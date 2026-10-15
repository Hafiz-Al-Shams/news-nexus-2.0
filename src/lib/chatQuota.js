// src>lib>chatQuota.js  (NEW)
// Atomic quota logic for the chat. Every change is ONE MongoDB operation with a condition,
// so two simultaneous requests can never both slip under the limit.
import ChatUsage from "@/models/ChatUsage";
import ChatGlobalUsage from "@/models/ChatGlobalUsage";

// Reads a positive whole number from an env variable, otherwise uses the default
function readLimit(raw, fallback) {
  const n = parseInt(raw, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export const USER_LIMIT = readLimit(process.env.CHAT_USER_LIMIT, 10);                 // messages per user per 24h
export const GLOBAL_LIMIT = readLimit(process.env.CHAT_GLOBAL_DAILY_LIMIT, 500);      // answers per UTC day, all users

const WINDOW_MS = 24 * 60 * 60 * 1000;
const isDuplicateKey = (error) => error?.code === 11000; // "unique index says this document already exists"
const normalizeEmail = (email) => String(email).trim().toLowerCase();

// The unique indexes are REQUIRED for the logic below. connectDB uses bufferCommands:false,
// so we wait once per server instance until both indexes are built.
let indexesReady = null;
export function ensureChatIndexes() {
  if (!indexesReady) {
    indexesReady = Promise.all([ChatUsage.init(), ChatGlobalUsage.init()]).catch((error) => {
      indexesReady = null; // try again on the next request
      console.error("Chat index init error:", error.message);
    });
  }
  return indexesReady;
}

// Next UTC midnight (when the global counter starts again)
export function nextUtcMidnight() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1));
}

// ===================== PER-USER QUOTA =====================

// Reserves ONE message for the user BEFORE Gemini is called.
// Returns { ok:true, windowResetAt, remaining, resetAt } or { ok:false, remaining:0, resetAt }
export async function reserveUserSlot(email) {
  const key = normalizeEmail(email);

  // Two attempts: the second one covers the rare case where two first-ever requests race each other
  for (let attempt = 0; attempt < 2; attempt++) {
    const now = new Date();

    // A) Window still running AND count below the limit -> add one (single atomic update)
    const active = await ChatUsage.findOneAndUpdate(
      { userEmail: key, windowResetAt: { $gt: now }, count: { $lt: USER_LIMIT } },
      { $inc: { count: 1 } },
      { new: true }
    );
    if (active) {
      return {
        ok: true,
        windowResetAt: active.windowResetAt,
        remaining: Math.max(USER_LIMIT - active.count, 0),
        resetAt: active.windowResetAt,
      };
    }

    // B) No document yet, or the old window has ended -> start a fresh 24h window with count = 1.
    // If a document with a RUNNING window exists, the filter does not match, the upsert tries to insert
    // and the unique index rejects it (duplicate key). That means "limit reached" (or a concurrent create -> retry A).
    try {
      const newReset = new Date(now.getTime() + WINDOW_MS);
      const started = await ChatUsage.findOneAndUpdate(
        { userEmail: key, windowResetAt: { $lte: now } },
        { $set: { count: 1, windowResetAt: newReset } },
        { new: true, upsert: true }
      );
      return {
        ok: true,
        windowResetAt: started.windowResetAt,
        remaining: Math.max(USER_LIMIT - started.count, 0),
        resetAt: started.windowResetAt,
      };
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      // otherwise loop and try step A again
    }
  }

  // Limit reached: tell the user when the window ends
  const doc = await ChatUsage.findOne({ userEmail: key }).select("windowResetAt").lean();
  return { ok: false, remaining: 0, resetAt: doc?.windowResetAt || null };
}

// Gives the reserved message back (used when Gemini failed). Only touches the SAME window it was taken from.
export async function releaseUserSlot(email, windowResetAt) {
  try {
    await ChatUsage.updateOne(
      { userEmail: normalizeEmail(email), windowResetAt, count: { $gt: 0 } },
      { $inc: { count: -1 } }
    );
  } catch (error) {
    console.error("Release user slot error:", error.message); // never break the response because of this
  }
}

// Current usage WITHOUT consuming anything (used by the usage endpoint)
export async function getUserUsage(email) {
  const doc = await ChatUsage.findOne({
    userEmail: normalizeEmail(email),
    windowResetAt: { $gt: new Date() }, // an ended window counts as "nothing used"
  })
    .select("count windowResetAt")
    .lean();

  return {
    remaining: doc ? Math.max(USER_LIMIT - doc.count, 0) : USER_LIMIT,
    limit: USER_LIMIT,
    resetAt: doc ? doc.windowResetAt : null,
  };
}

// ===================== GLOBAL DAILY QUOTA =====================

const dayKey = () => new Date().toISOString().slice(0, 10); // UTC day, e.g. "2026-10-15"

// Reserves ONE global answer for today. Returns { ok:true, day } or { ok:false }
export async function reserveGlobalSlot() {
  for (let attempt = 0; attempt < 2; attempt++) {
    const day = dayKey();
    try {
      // Matches only while today's count is below the limit; if today's document does not exist yet it is created.
      // If it exists and is full, the insert is rejected by the unique "day" index (duplicate key) = limit reached.
      await ChatGlobalUsage.findOneAndUpdate(
        { day, count: { $lt: GLOBAL_LIMIT } },
        {
          $inc: { count: 1 },
          $setOnInsert: { expiresAt: new Date(nextUtcMidnight().getTime() + WINDOW_MS) }, // delete the day's document 1 day after it ends
        },
        { new: true, upsert: true }
      );
      return { ok: true, day };
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      // either full, or two requests created today's document at once -> one more try decides
    }
  }
  return { ok: false };
}

// Gives the global slot back (used when Gemini failed)
export async function releaseGlobalSlot(day) {
  try {
    await ChatGlobalUsage.updateOne({ day, count: { $gt: 0 } }, { $inc: { count: -1 } });
  } catch (error) {
    console.error("Release global slot error:", error.message);
  }
}