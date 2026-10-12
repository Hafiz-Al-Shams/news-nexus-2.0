// .github/scripts/send-newsletter.mjs
// Daily job: reads the newest bulletin from MongoDB, builds an HTML email with the 12 bullets,
// and creates ONE Kit broadcast scheduled for 7:30 AM Dhaka time (01:30 UTC) to all subscribers.
// The workflow runs this script several times a day (main + backups); the duplicate check below
// makes sure only ONE broadcast is created per day.
import mongoose from "mongoose";

const {
  MONGODB_URI,
  KIT_API_KEY,
  FORCE_SEND, // "true" when started manually with the "force" option (ignores the duplicate protection)
  DRAFT_ONLY, // "true" when started manually with the "draft only" option (creates a draft in Kit, sends nothing)
} = process.env;

const KIT_BASE_URL = "https://api.kit.com/v4";
const SITE_URL = "https://news-nexus-2.vercel.app/"; // link shown in the email, change if your domain changes
const MAX_BULLETIN_AGE_MS = 24 * 60 * 60 * 1000; // news may be up to 24 hours old (your project rule)
const MIN_GAP_MS = 18 * 60 * 60 * 1000;          // CHANGED 20h -> 18h: never create two broadcasts within 18 hours (leaves room for late backup runs)
const SEND_HOUR_UTC = 1;                         // 01:30 UTC = 7:30 AM in Dhaka (UTC+6)
const SEND_MINUTE_UTC = 30;
const LATE_SEND_DELAY_MS = 2 * 60 * 1000;        // if the run starts after 01:30 UTC, send 2 minutes from now
const MAX_RETRIES = 4;                           // retries for rate limits / temporary server errors

// Stop immediately if a required secret is missing
const missing = Object.entries({ MONGODB_URI, KIT_API_KEY })
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.error(`Missing required secrets: ${missing.join(", ")}`);
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Minimal models (strict:false = no need to copy the full schemas into this script)
const BulletinCache =
  mongoose.models.BulletinCache ||
  mongoose.model("BulletinCache", new mongoose.Schema({}, { strict: false }));

// Small log collection that remembers when the last broadcast was created (prevents duplicate sends)
const NewsletterLog =
  mongoose.models.NewsletterLog ||
  mongoose.model("NewsletterLog", new mongoose.Schema({}, { strict: false }));

// One Kit API request, with automatic retry on rate limit (429) or temporary server errors (5xx)
async function kitRequest(method, path, body) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let response;
    try {
      response = await fetch(`${KIT_BASE_URL}${path}`, {
        method,
        headers: {
          "X-Kit-Api-Key": KIT_API_KEY, // Kit v4 API key authentication
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(20000), // never hang longer than 20 seconds
      });
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error; // network problem on the last try
      await sleep(2000 * attempt);
      continue;
    }

    // Wait and retry on rate limit / temporary server errors
    if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
      const waitMs = 2000 * attempt;
      console.warn(`Kit returned ${response.status}, retrying in ${waitMs / 1000}s (attempt ${attempt}/${MAX_RETRIES})`);
      await sleep(waitMs);
      continue;
    }

    const text = await response.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
    }
    return { ok: response.ok, status: response.status, data };
  }
}

// Escapes special characters so bullet text can never break the email HTML
const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Builds the email body (simple inline-styled HTML, works in all email apps). Kit adds the unsubscribe footer itself.
function buildEmailHtml(bullets, dateText) {
  const items = bullets
    .map(
      (bullet) =>
        `<li style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:#1f2937;">${escapeHtml(bullet)}</li>`
    )
    .join("\n");

  return `
<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;">
  <h1 style="font-size:22px;margin:0 0 4px 0;color:#111827;">NEWS<span style="color:#6b7280;">NEXUS</span></h1>
  <p style="font-size:14px;color:#6b7280;margin:0 0 20px 0;">Daily Bulletin &bull; ${escapeHtml(dateText)}</p>
  <h2 style="font-size:18px;margin:0 0 16px 0;color:#104AC2;">Today's 12 Key Stories</h2>
  <ul style="padding-left:20px;margin:0 0 24px 0;">
    ${items}
  </ul>
  <p style="font-size:14px;color:#374151;margin:0 0 8px 0;">
    Want more? <a href="${SITE_URL}" style="color:#104AC2;">Read the full news on NewsNexus</a>.
  </p>
  <p style="font-size:12px;color:#9ca3af;margin:0;">Summarized by AI from today's top world news.</p>
</div>`.trim();
}

// Works out when Kit should send the broadcast: the next 01:30 UTC (7:30 AM Dhaka), or "very soon" if that time already passed
function getSendTime() {
  const now = new Date();
  const target = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), SEND_HOUR_UTC, SEND_MINUTE_UTC, 0)
  );

  // Normal case: the run started on time, so 01:30 UTC today is still in the future
  if (target.getTime() > now.getTime() + 60 * 1000) return target;

  // Late run (or backup run / manual run): send 2 minutes from now instead of using a past time
  return new Date(now.getTime() + LATE_SEND_DELAY_MS);
}

async function main() {
  console.log("Starting newsletter job...");
  await mongoose.connect(MONGODB_URI);

  const isDraft = DRAFT_ONLY === "true";

  // 1) Duplicate protection FIRST (so backup runs exit quickly): skip if a broadcast was already created in the last 18 hours
  if (FORCE_SEND !== "true" && !isDraft) {
    const lastLog = await NewsletterLog.findOne({ type: "daily-broadcast" }).sort({ createdAt: -1 }).lean();
    if (lastLog && Date.now() - new Date(lastLog.createdAt).getTime() < MIN_GAP_MS) {
      console.log(`Today's broadcast already exists (created ${new Date(lastLog.createdAt).toISOString()}). Nothing to do.`);
      await mongoose.disconnect();
      process.exit(0); // green run, this is the normal result for backup runs
    }
  }

  // 2) Load the newest bulletin
  const bulletin = await BulletinCache.findOne({ timeframe: "24hrs" }).sort({ generatedAt: -1 }).lean();
  if (!bulletin) throw new Error("No bulletin found in the database, nothing to send.");

  // 3) Freshness check: the news may be up to 24 hours old, older than that is not sent
  const ageMs = Date.now() - new Date(bulletin.generatedAt).getTime();
  if (ageMs > MAX_BULLETIN_AGE_MS) {
    throw new Error(`Latest bulletin is ${(ageMs / 3600000).toFixed(1)}h old (limit 24h). Not sending. Check the bulletin cron job.`);
  }

  const bullets = bulletin.bullets || [];
  if (!Array.isArray(bullets) || bullets.length !== 12) {
    throw new Error(`Expected 12 bullets, found ${bullets.length}. Not sending.`);
  }
  console.log(`Using bulletin generated ${(ageMs / 3600000).toFixed(1)}h ago`);

  // 4) Build the email
  const sendAt = getSendTime();
  const dateText = sendAt.toLocaleDateString("en-US", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka", // date as seen in Dhaka
  });
  const subject = `NewsNexus Daily Bulletin - ${dateText}`;

  // 5) Create the broadcast in Kit (draft when send_at is null, scheduled otherwise)
  // No subscriber_filter on purpose: Kit only accepts "segment" or "tag" filters,
  // and when no filter is given the broadcast goes to ALL subscribers.
  const result = await kitRequest("POST", "/broadcasts", {
    subject,
    preview_text: "Today's 12 most important world stories, summarized by AI.", // text shown next to the subject in inboxes
    description: `Daily bulletin ${dateText}`, // internal name, only visible in your Kit dashboard
    content: buildEmailHtml(bullets, dateText),
    public: false, // do not publish the email on the web
    send_at: isDraft ? null : sendAt.toISOString(), // scheduled send time (ISO 8601, UTC)
  });

  if (!result.ok) {
    throw new Error(`Kit rejected the broadcast: ${result.status} ${JSON.stringify(result.data)}`);
  }

  const broadcastId = result.data?.broadcast?.id;
  console.log(
    isDraft
      ? `Draft broadcast created in Kit (id: ${broadcastId}). Nothing was sent.`
      : `Broadcast ${broadcastId} scheduled for ${sendAt.toISOString()} (Dhaka: ${sendAt.toLocaleTimeString("en-US", { timeZone: "Asia/Dhaka" })})`
  );

  // 6) Remember this broadcast so the backup runs know the job is done for today
  if (!isDraft) {
    await NewsletterLog.create({
      type: "daily-broadcast",
      createdAt: new Date(),
      scheduledFor: sendAt,
      kitBroadcastId: broadcastId,
      bulletinId: bulletin._id,
    });
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (error) => {
  console.error("Newsletter job failed:", error.message);
  await mongoose.disconnect();
  process.exit(1); // red run in GitHub so you notice (the next backup run will try again)
});