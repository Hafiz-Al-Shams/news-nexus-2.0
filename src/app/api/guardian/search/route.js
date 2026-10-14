// src/app/api/guardian/search/route.js  (NEW)
// PUBLIC route: searches the WHOLE Guardian archive for a keyword.
// Flow: fresh DB copy (12h) -> otherwise ONE Guardian request -> saved in DB for the next visitors.
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SearchCache from "@/models/SearchCache";
import { buildGuardianUrl } from "@/utils/guardian";
import { normalizeKeyword, MIN_SEARCH_LENGTH } from "@/utils/search";

export const dynamic = "force-dynamic"; // never let Next.js cache this route itself, our DB cache does that

const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY;

const PAGE_SIZE = 30;                         // articles per page ("Load More" adds 30 more)
const MAX_PAGE = 10;                          // max 10 pages = 300 articles per keyword (protects your quota)
const CACHE_FRESH_MS = 12 * 60 * 60 * 1000;   // a saved search is served for 12 hours without touching Guardian
const CACHE_PURGE_MS = 24 * 60 * 60 * 1000;   // MongoDB deletes it after 24 hours (fallback copy if Guardian is down)

// Protection against one visitor burning your Guardian quota with many DIFFERENT new keywords.
// Only searches that really need a Guardian call are counted, cached searches are always free.
const MISS_LIMIT = 20;                        // max new Guardian searches per visitor ...
const MISS_WINDOW_MS = 10 * 60 * 1000;        // ... per 10 minutes
const missLog = new Map();                    // ip -> { count, resetAt } (kept in server memory)

function allowGuardianCall(ip) {
  const now = Date.now();

  // Small cleanup so the Map can never grow forever
  if (missLog.size > 5000) {
    for (const [key, entry] of missLog) {
      if (now > entry.resetAt) missLog.delete(key);
    }
  }

  const entry = missLog.get(ip);
  if (!entry || now > entry.resetAt) {
    missLog.set(ip, { count: 1, resetAt: now + MISS_WINDOW_MS });
    return true;
  }
  if (entry.count >= MISS_LIMIT) return false;

  entry.count += 1;
  return true;
}

// Requests currently talking to Guardian, keyed by cache key.
// If 20 visitors search the same new keyword at the same moment, only ONE Guardian request is made.
const inflightRequests = new Map();

// Custom error so the handler can return the right status code and message to the browser
class SearchFetchError extends Error {
  constructor(message, { status = 500, code } = {}) {
    super(message);
    this.name = "SearchFetchError";
    this.status = status;
    this.code = code;
  }
}

// Fetches ONE page of search results from Guardian, saves it to the DB cache and returns it
async function fetchSearchPageFromGuardian({ keyword, page, cacheKey }) {
  const url = buildGuardianUrl({
    q: keyword,                // the Guardian full-text search keyword
    pageSize: PAGE_SIZE,
    page,
    orderBy: "relevance",      // best matches first (no date limit = searches the whole archive)
    showFields: ["headline", "trailText", "thumbnail", "byline"], // only what the website uses
    apiKey: GUARDIAN_API_KEY,
  });

  console.log(`Guardian SEARCH call: "${keyword}" page=${page}`);

  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" }); // 15 second timeout
  } catch {
    throw new SearchFetchError("Could not reach the Guardian API", { status: 502 });
  }

  if (response.status === 429) {
    throw new SearchFetchError("Guardian API daily limit reached. Please try again tomorrow.", {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
    });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new SearchFetchError(errorData.message || "Failed to search Guardian", { status: response.status });
  }

  const data = await response.json();

  if (data.response?.status !== "ok") {
    throw new SearchFetchError(data.response?.message || "Invalid response from Guardian", { status: 400 });
  }

  // Same article shape the news cards already use
  const articles = (data.response?.results || [])
    .filter((article) => article.webTitle && article.webUrl)
    .map((article) => ({
      title: article.webTitle,
      description: article.fields?.trailText || "",
      url: article.webUrl,
      urlToImage: article.fields?.thumbnail || null,
      publishedAt: article.webPublicationDate,
      source: { id: "the-guardian", name: "The Guardian" },
      author: article.fields?.byline || "The Guardian",
    }));

  const currentPage = data.response?.currentPage || page;
  const totalPages = data.response?.pages || 1;

  const payload = {
    articles,
    count: articles.length,
    page: currentPage,
    pages: totalPages,
    total: data.response?.total || 0,
    hasMore: currentPage < totalPages && currentPage < MAX_PAGE, // more pages exist AND we are under the cap
    keyword,
  };

  const fetchedAt = new Date();

  // Save in the DB for 12 hours (an empty result is cached too: "no results" for a keyword rarely changes,
  // and caching it stops people from hitting Guardian again and again with the same dead keyword)
  try {
    await SearchCache.findOneAndUpdate(
      { cacheKey },
      {
        cacheKey,
        keyword,
        page,
        payload,
        fetchedAt,
        freshUntil: new Date(fetchedAt.getTime() + CACHE_FRESH_MS),
        purgeAt: new Date(fetchedAt.getTime() + CACHE_PURGE_MS),
      },
      { upsert: true, new: true } // upsert = update the expired copy or create a new one (no duplicate-key errors)
    );
    console.log("Search saved to cache for 12 hours:", cacheKey);
  } catch (cacheError) {
    console.error("Failed to save search cache:", cacheError.message); // never fail the request because of this
  }

  return { payload, fetchedAt };
}

// Identical simultaneous searches share ONE Guardian call
function loadSearchFromGuardian(args) {
  if (inflightRequests.has(args.cacheKey)) {
    return inflightRequests.get(args.cacheKey);
  }

  const promise = fetchSearchPageFromGuardian(args).finally(() => {
    inflightRequests.delete(args.cacheKey); // done (success or error), allow future fetches
  });

  inflightRequests.set(args.cacheKey, promise);
  return promise;
}

// Builds the JSON the browser receives
function buildSuccessBody({ payload, page, keyword, fromCache, stale, cachedAt }) {
  return {
    success: true,
    fromCache,
    stale, // true when an expired saved result is shown because Guardian is unavailable
    keyword,
    articles: payload.articles || [],
    count: payload.articles?.length || 0,
    page,
    pages: payload.pages || 1,
    total: payload.total || 0,
    hasMore: !!payload.hasMore,
    cachedAt,
  };
}

export async function GET(request) {
  try {
    if (!GUARDIAN_API_KEY) {
      console.error("GUARDIAN_API_KEY is not configured");
      return NextResponse.json({ error: "Guardian API is not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);

    // Clean + validate the public input (the browser also does this, but the server never trusts the browser)
    const keyword = normalizeKeyword(searchParams.get("q") || "");
    if (keyword.length < MIN_SEARCH_LENGTH) {
      return NextResponse.json(
        { success: false, error: "Search too short", message: `Type at least ${MIN_SEARCH_LENGTH} characters to search.` },
        { status: 400 }
      );
    }

    const rawPage = parseInt(searchParams.get("page"), 10);
    const page = Number.isInteger(rawPage) ? Math.min(Math.max(rawPage, 1), MAX_PAGE) : 1; // always 1..10

    await connectDB();

    // One DB entry per keyword + page
    const cacheKey = `search_${keyword}_p${page}`;

    // Look for a saved copy (fresh OR expired, the expired one is the emergency fallback)
    let cached = null;
    try {
      cached = await SearchCache.findOne({ cacheKey }).lean();
    } catch (cacheError) {
      console.log("Search cache read error, continuing with API call:", cacheError.message);
    }

    // 1) Fresh copy (younger than 12 hours): serve it, Guardian is NOT touched
    if (cached && new Date(cached.freshUntil) > new Date()) {
      console.log("Search served from cache:", cacheKey);
      return NextResponse.json(
        buildSuccessBody({ payload: cached.payload, page, keyword, fromCache: true, stale: false, cachedAt: cached.fetchedAt })
      );
    }

    // 2) Per-visitor limit for NEW Guardian searches (cached searches above are never limited)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    if (!allowGuardianCall(ip)) {
      if (cached) {
        // An old saved copy is better than an error
        return NextResponse.json(
          buildSuccessBody({ payload: cached.payload, page, keyword, fromCache: true, stale: true, cachedAt: cached.fetchedAt })
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: "Too many searches",
          message: "You are searching very fast. Please wait a few minutes and try again.",
          code: "SEARCH_RATE_LIMIT",
        },
        { status: 429 }
      );
    }

    // 3) No fresh copy: ask Guardian (and save the result for the next 12 hours)
    try {
      const result = await loadSearchFromGuardian({ keyword, page, cacheKey });
      return NextResponse.json(
        buildSuccessBody({ payload: result.payload, page, keyword, fromCache: false, stale: false, cachedAt: result.fetchedAt })
      );
    } catch (fetchError) {
      // 4) Guardian failed: show the expired saved copy instead of an error
      if (cached) {
        console.log("Guardian failed, serving stale search cache:", cacheKey, "-", fetchError.message);
        return NextResponse.json(
          buildSuccessBody({ payload: cached.payload, page, keyword, fromCache: true, stale: true, cachedAt: cached.fetchedAt })
        );
      }
      throw fetchError; // nothing saved at all, report the real error below
    }
  } catch (error) {
    console.error("Guardian search route error:", error.message);

    if (error instanceof SearchFetchError) {
      return NextResponse.json(
        { success: false, error: "Guardian API error", message: error.message, code: error.code },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to search news", message: error.message },
      { status: 500 }
    );
  }
}