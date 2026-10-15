// src>lib>chatContext.js  (NEW)
// Loads SMALL live data blocks (bulletin + homepage feed) from OUR OWN MongoDB cache.
// It NEVER calls the Guardian API. The caller (the chat route) must call connectDB() first.
import BulletinCache from "@/models/BulletinCache";
import GuardianCache from "@/models/GuardianCache";

const HOMEPAGE_CACHE_KEY = "guardian_24h_all_p1"; // default homepage feed (Last 24 Hours, All Topics, page 1)

// Size limits, so the live block stays around 2000-3000 tokens
const MAX_LIVE_CHARS = 9000;     // hard cap for the whole live block
const MAX_BULLET_CHARS = 260;    // one bulletin bullet
const MAX_CARD_TITLE = 100;      // one detailed card title
const MAX_CARD_DESC = 340;       // one detailed card description
const MAX_ARTICLES = 15;         // homepage articles
const MAX_ARTICLE_TITLE = 150;
const MAX_ARTICLE_DESC = 140;

// Words that mean "this question is about the news" (checked case-insensitively, whole words)
const NEWS_INTENT = /\b(news|bulletin|today|today's|todays|tonight|latest|headline|headlines|happening|happened|story|stories|summary|summarize|update|updates|current|currently|recent|recently|breaking|yesterday|going on)\b/i;

// Words that mean "the user wants more depth", so the detailed cards are loaded too
const DETAIL_INTENT = /\b(detail|details|detailed|more|explain|elaborate|deeper|context|background|why|implications?|tell me about)\b/i;

// True when live data should be loaded: looks at the current message and the previous user turn (for follow-ups)
export function needsLiveData(message, history = []) {
  if (NEWS_INTENT.test(message)) return true;

  const lastUser = [...history].reverse().find((m) => m.role === "user");
  // Short follow-ups such as "tell me more" / "explain the first one" continue a news question
  return !!lastUser && NEWS_INTENT.test(lastUser.content) && DETAIL_INTENT.test(message);
}

export function wantsDetails(message) {
  return DETAIL_INTENT.test(message);
}

// Cleans text from the database: removes HTML tags and angle brackets (so nothing can fake our <LIVE_...> tags),
// collapses whitespace and cuts it to a maximum length
function clean(text, max) {
  const t = String(text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? `${t.slice(0, max - 1).trim()}…` : t;
}

const iso = (d) => (d ? new Date(d).toISOString() : "unknown");

// Returns the live data text block ("" when the question is not about news)
export async function getLiveContext(message, history = []) {
  if (!needsLiveData(message, history)) return "";

  const withDetails = wantsDetails(message);

  let bulletin = null;
  let feed = null;

  try {
    // Two small reads at the same time (.lean() + select only what is needed)
    [bulletin, feed] = await Promise.all([
      BulletinCache.findOne({ timeframe: "24hrs" })
        .sort({ generatedAt: -1 }) // newest bulletin
        .select(withDetails ? "bullets detailedCards generatedAt" : "bullets generatedAt")
        .lean(),
      GuardianCache.findOne({ cacheKey: HOMEPAGE_CACHE_KEY })
        .select("payload.articles fetchedAt")
        .lean(),
    ]);
  } catch (error) {
    console.error("Chat live data error:", error.message); // chat still works, just without live data
  }

  // ----- Bulletin block -----
  let bulletinBlock;
  if (bulletin?.bullets?.length) {
    const lines = bulletin.bullets.map((b, i) => `${i + 1}. ${clean(b, MAX_BULLET_CHARS)}`);

    if (withDetails && bulletin.detailedCards?.length) {
      lines.push("", "Detailed cards:");
      bulletin.detailedCards.slice(0, 12).forEach((c, i) => {
        lines.push(`${i + 1}. ${clean(c.title, MAX_CARD_TITLE)}: ${clean(c.description, MAX_CARD_DESC)}`);
      });
    }

    bulletinBlock = `<LIVE_BULLETIN generated_at="${iso(bulletin.generatedAt)}">\n${lines.join("\n")}\n</LIVE_BULLETIN>`;
  } else {
    bulletinBlock = "<LIVE_BULLETIN>NOT AVAILABLE</LIVE_BULLETIN>";
  }

  // ----- Homepage feed block (only as many articles as the size budget allows) -----
  const articles = feed?.payload?.articles;
  let feedBlock;
  if (Array.isArray(articles) && articles.length > 0) {
    let budget = MAX_LIVE_CHARS - bulletinBlock.length - 200; // 200 = room for the tags
    const lines = [];

    for (const a of articles.slice(0, MAX_ARTICLES)) {
      const line = `- [${a.publishedAt ? iso(a.publishedAt) : "date unknown"}] ${clean(a.title, MAX_ARTICLE_TITLE)}${
        a.description ? `: ${clean(a.description, MAX_ARTICLE_DESC)}` : ""
      }`;
      if (budget - line.length < 0) break; // out of budget, stop adding
      budget -= line.length;
      lines.push(line);
    }

    feedBlock = lines.length
      ? `<LIVE_HOMEPAGE_NEWS fetched_at="${iso(feed.fetchedAt)}" filter="last 24 hours, all topics">\n${lines.join("\n")}\n</LIVE_HOMEPAGE_NEWS>`
      : "<LIVE_HOMEPAGE_NEWS>NOT AVAILABLE</LIVE_HOMEPAGE_NEWS>";
  } else {
    feedBlock = "<LIVE_HOMEPAGE_NEWS>NOT AVAILABLE</LIVE_HOMEPAGE_NEWS>";
  }

  return `${bulletinBlock}\n\n${feedBlock}`;
}