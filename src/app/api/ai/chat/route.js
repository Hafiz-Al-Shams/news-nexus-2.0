// src>app>api>ai>chat>route.js  (MODIFIED)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb"; // shared, race-safe database connection
import { generateChatResponse } from "@/lib/gemini";
import { buildSystemInstruction } from "@/lib/chatKnowledge"; // role + rules + knowledge
import { getLiveContext } from "@/lib/chatContext"; // live bulletin + homepage data from our own DB
import {
  USER_LIMIT,
  GLOBAL_LIMIT,
  ensureChatIndexes,
  reserveUserSlot,
  releaseUserSlot,
  reserveGlobalSlot,
  releaseGlobalSlot,
  nextUtcMidnight,
} from "@/lib/chatQuota";

export const dynamic = "force-dynamic"; // never cache this route
export const maxDuration = 30; // seconds a Vercel function may run (a slow Gemini answer is not cut off)

// Hard caps (the server never trusts the browser)
const MAX_MESSAGE_CHARS = 500;
const MAX_HISTORY_MESSAGES = 6;
const MAX_HISTORY_CHARS = 800;

// Gemini settings: short, factual answers, no extended thinking (saves quota and time)
const GENERATION_OPTIONS = {
  maxOutputTokens: 600,
  temperature: 0.3,
  thinkingBudget: 0,
};

// Cleans the history sent by the browser: only strict "user"/"assistant" roles, string content, limited size.
// Anything invalid is dropped, so nobody can inject fake roles or giant texts.
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];

  const cleaned = history
    .filter(
      (m) =>
        m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-MAX_HISTORY_MESSAGES) // only the last 6 messages
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_HISTORY_CHARS) }));

  // The conversation sent to Gemini must start with a user message
  while (cleaned.length > 0 && cleaned[0].role !== "user") cleaned.shift();

  return cleaned;
}

export async function POST(request) {
  try {
    // 1) Must be logged in
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }
    const email = session.user.email;

    // 2) Read the body safely
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    // 3) Validate the message on the server
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json({ success: false, error: "Valid message is required" }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json(
        { success: false, error: `Message is too long (max ${MAX_MESSAGE_CHARS} characters)` },
        { status: 400 }
      );
    }
    const history = sanitizeHistory(body?.history);

    await connectDB();
    await ensureChatIndexes(); // the quota logic needs the unique indexes

    // 4) Reserve ONE message for this user BEFORE calling Gemini (atomic, race-safe)
    const userSlot = await reserveUserSlot(email);
    if (!userSlot.ok) {
      return NextResponse.json(
        {
          success: false,
          code: "USER_LIMIT",
          error: "You have reached your daily message limit.",
          remaining: 0,
          limit: USER_LIMIT,
          resetAt: userSlot.resetAt,
        },
        { status: 429 }
      );
    }

    // 5) Reserve ONE global answer for today (circuit-breaker for the free Gemini quota)
    const globalSlot = await reserveGlobalSlot();
    if (!globalSlot.ok) {
      await releaseUserSlot(email, userSlot.windowResetAt); // the user did nothing wrong, give the message back
      return NextResponse.json(
        {
          success: false,
          code: "GLOBAL_LIMIT",
          error: "The assistant is temporarily unavailable. Please try again later.",
          remaining: 0,
          limit: GLOBAL_LIMIT,
          resetAt: nextUtcMidnight().toISOString(),
        },
        { status: 429 }
      );
    }

    // 6) Build the context and call Gemini ONCE. Any failure gives both reserved slots back.
    try {
      const liveBlock = await getLiveContext(message, history); // "" when the question is not about news
      const systemInstruction = buildSystemInstruction({ liveBlock, userLimit: USER_LIMIT });

      const aiResponse = await generateChatResponse(message, history, {
        ...GENERATION_OPTIONS,
        systemInstruction,
      });

      return NextResponse.json({
        success: true,
        response: aiResponse, // same field names the ChatModal already reads
        remaining: userSlot.remaining,
        limit: USER_LIMIT,
        resetAt: userSlot.resetAt,
      });
    } catch (aiError) {
      // Only SUCCESSFUL answers count: refund the user message and the global slot
      await Promise.all([
        releaseUserSlot(email, userSlot.windowResetAt),
        releaseGlobalSlot(globalSlot.day),
      ]);
      throw aiError; // handled by the error mapping below
    }
  } catch (error) {
    console.error("AI Chat Error:", error.message); // no user messages and no stack traces in the logs

    // Friendly error mapping (the quota was already refunded above)
    const msg = String(error.message || "");
    let errorMessage = "Failed to generate response";
    let statusCode = 500;
    let code = "AI_ERROR";

    if (msg.includes("API key")) {
      errorMessage = "API configuration error";
    } else if (/quota|rate limit|429|RESOURCE_EXHAUSTED/i.test(msg)) {
      errorMessage = "Service temporarily unavailable. Please try again later.";
      statusCode = 503; // 503 (not 429), so the browser never confuses it with our own limit codes
      code = "AI_BUSY";
    } else if (/timeout|DEADLINE/i.test(msg)) {
      errorMessage = "Request timeout. Please try again.";
      statusCode = 504;
      code = "AI_TIMEOUT";
    }

    return NextResponse.json(
      {
        success: false,
        code,
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? msg : undefined, // technical details only in development
      },
      { status: statusCode }
    );
  }
}