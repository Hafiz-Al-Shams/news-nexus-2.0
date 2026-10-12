// src/app/api/guardian/route.js
import { NextResponse } from "next/server";
// CHANGED: removed getServerSession / authOptions imports, this route is PUBLIC (no login needed)
import { connectDB } from "@/lib/mongodb"; // shared, race-safe database connection
import GuardianCache from '@/models/GuardianCache';
import {
  buildGuardianUrl,
  calculateTimeRange,
  GUARDIAN_TOPIC_MAP
} from '@/utils/guardian';

export const dynamic = "force-dynamic"; // never let Next.js cache this route itself, our own database cache does that

const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY;

// The only time filters we accept (anything else falls back to "24h")
const ALLOWED_TIMES = ["1h", "24h", "3d", "7d"];

const PAGE_SIZE = 30;                           // articles per page ("Load More" adds 30 more)
const MAX_PAGE = 10;                            // max 10 pages = 300 articles per filter (protects your Guardian quota from public abuse)
const CACHE_FRESH_MS = 12 * 60 * 60 * 1000;     // a cached page is served for 12 hours without touching Guardian
const CACHE_PURGE_MS = 24 * 60 * 60 * 1000;     // MongoDB deletes it after 24 hours (kept longer as a fallback if Guardian is down)

// Requests currently talking to Guardian, keyed by cache key.
// If 20 visitors ask for the same page at the same moment, only ONE Guardian request is made.
const inflightRequests = new Map();

// Custom error so the handler can return the right status code and message to the browser
class GuardianFetchError extends Error {
  constructor(message, { status = 500, code, rateLimitInfo } = {}) {
    super(message);
    this.name = "GuardianFetchError";
    this.status = status;
    this.code = code;
    this.rateLimitInfo = rateLimitInfo;
  }
}

// Fetches ONE page from the Guardian API, saves it to the database cache, and returns it
async function fetchPageFromGuardian({ time, topic, page, cacheKey }) {
  const { fromDate, toDate } = calculateTimeRange(time); // e.g. "last 24 hours" -> real dates
  const topicConfig = GUARDIAN_TOPIC_MAP[topic] || GUARDIAN_TOPIC_MAP.all;

  const url = buildGuardianUrl({
    section: topicConfig.section,
    tags: topicConfig.tags,
    fromDate,
    toDate,
    pageSize: PAGE_SIZE,
    page, // which page of results to fetch
    orderBy: 'newest',
    // CHANGED: only the fields the website really uses (no full article body, keeps the cache small and fast)
    showFields: ['headline', 'trailText', 'thumbnail', 'byline'],
    apiKey: GUARDIAN_API_KEY
  });

  console.log(`Guardian API call: time=${time} topic=${topic} page=${page}`);

  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" }); // 15 second timeout
  } catch (networkError) {
    throw new GuardianFetchError("Could not reach the Guardian API", { status: 502 });
  }

  // Rate limit headers (for your logs)
  const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining-day');
  const rateLimitTotal = response.headers.get('X-RateLimit-Limit-day');
  const rateLimitInfo = { remaining: rateLimitRemaining, limit: rateLimitTotal };
  console.log("Guardian daily limit:", rateLimitTotal || 'n/a', "| remaining:", rateLimitRemaining || 'n/a');

  // Handle rate limit exceeded
  if (response.status === 429) {
    throw new GuardianFetchError('Guardian API daily limit reached. Please try again tomorrow.', {
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      rateLimitInfo
    });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new GuardianFetchError(errorData.message || 'Failed to fetch from Guardian', {
      status: response.status,
      rateLimitInfo
    });
  }

  const data = await response.json();

  // Check if response is successful
  if (data.response?.status !== 'ok') {
    throw new GuardianFetchError(data.response?.message || 'Invalid response from Guardian', { status: 400 });
  }

  // Transform Guardian articles to the format the website uses
  const articles = (data.response?.results || [])
    .filter(article => article.webTitle && article.webUrl)
    .map(article => ({
      title: article.webTitle,
      description: article.fields?.trailText || '',
      url: article.webUrl,
      urlToImage: article.fields?.thumbnail || null,
      publishedAt: article.webPublicationDate,
      source: {
        id: 'the-guardian',
        name: 'The Guardian'
      },
      author: article.fields?.byline || 'The Guardian'
    }));

  // Guardian tells us how many pages exist, so "Load More" knows when to stop
  const currentPage = data.response?.currentPage || page;
  const totalPages = data.response?.pages || 1;

  const payload = {
    articles,
    count: articles.length,
    page: currentPage,
    pages: totalPages,
    total: data.response?.total || 0,
    hasMore: currentPage < totalPages && currentPage < MAX_PAGE // more pages exist AND we are under the 300 article cap
  };

  const fetchedAt = new Date();

  // Save to the database cache for 12 hours (but never cache an empty result, it would stay empty for 12 hours)
  if (articles.length > 0) {
    try {
      await GuardianCache.findOneAndUpdate(
        { cacheKey },
        {
          cacheKey,
          fetchedAt,
          freshUntil: new Date(fetchedAt.getTime() + CACHE_FRESH_MS),
          purgeAt: new Date(fetchedAt.getTime() + CACHE_PURGE_MS),
          payload,
          queryParams: { time, topic, page },
          rateLimitInfo: {
            remaining: rateLimitRemaining ? parseInt(rateLimitRemaining) : null,
            limit: rateLimitTotal ? parseInt(rateLimitTotal) : null
          }
        },
        { upsert: true, new: true }
      );
      console.log("Saved to cache for 12 hours:", cacheKey);
    } catch (cacheError) {
      // Never fail the request just because saving the cache failed
      console.error("Failed to save cache:", cacheError.message);
    }
  }

  return { payload, fetchedAt };
}

// Same as above, but identical simultaneous requests share ONE Guardian call
function loadPageFromGuardian(args) {
  if (inflightRequests.has(args.cacheKey)) {
    return inflightRequests.get(args.cacheKey); // someone is already fetching this exact page, wait for their result
  }

  const promise = fetchPageFromGuardian(args).finally(() => {
    inflightRequests.delete(args.cacheKey); // done (success or error), allow future fetches
  });

  inflightRequests.set(args.cacheKey, promise);
  return promise;
}

// Builds the JSON the browser receives
function buildSuccessBody({ payload, page, time, topic, fromCache, stale, cachedAt }) {
  return {
    success: true,
    fromCache,
    stale, // true when an expired cached page is shown because Guardian is unavailable
    articles: payload.articles || [],
    count: payload.articles?.length || 0,
    page,
    pages: payload.pages || 1,
    total: payload.total || 0,
    hasMore: !!payload.hasMore, // the "Load More News" button is disabled when this is false
    filters: { time, topic },
    cachedAt // when this page was fetched from Guardian
  };
}

export async function GET(request) {
  try {
    // CHANGED: no login check, logged-out visitors can read the news.
    // The 12-hour database cache below protects your Guardian API quota from heavy public traffic.

    if (!GUARDIAN_API_KEY) {
      console.error("GUARDIAN_API_KEY is not configured");
      return NextResponse.json(
        { error: "Guardian API is not configured" },
        { status: 500 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);

    // Validate public input, unknown values fall back to safe defaults.
    // This stops strangers from creating unlimited cache entries / Guardian API calls with random values.
    const rawTime = searchParams.get("time");
    const rawTopic = searchParams.get("topic");
    const rawPage = parseInt(searchParams.get("page"), 10);

    const time = ALLOWED_TIMES.includes(rawTime) ? rawTime : "24h";
    const topic = Object.prototype.hasOwnProperty.call(GUARDIAN_TOPIC_MAP, rawTopic) ? rawTopic : "all";
    const page = Number.isInteger(rawPage) ? Math.min(Math.max(rawPage, 1), MAX_PAGE) : 1; // always between 1 and 10

    // Connect to MongoDB
    await connectDB();

    // One cache entry per filter + page
    const cacheKey = `guardian_${time}_${topic}_p${page}`;

    // Look for a cached copy (fresh OR expired, the expired one is the emergency fallback)
    let cached = null;
    try {
      cached = await GuardianCache.findOne({ cacheKey }).lean();
    } catch (cacheError) {
      console.log("Cache read error, continuing with API call:", cacheError.message);
    }

    // 1) Fresh cache (younger than 12 hours): serve it, Guardian is NOT touched
    if (cached && new Date(cached.freshUntil) > new Date()) {
      console.log("Serving from cache:", cacheKey);
      return NextResponse.json(
        buildSuccessBody({
          payload: cached.payload,
          page,
          time,
          topic,
          fromCache: true,
          stale: false,
          cachedAt: cached.fetchedAt
        })
      );
    }

    // 2) No fresh cache: ask Guardian (and save the result for the next 12 hours)
    try {
      const result = await loadPageFromGuardian({ time, topic, page, cacheKey });

      return NextResponse.json({
        ...buildSuccessBody({
          payload: result.payload,
          page,
          time,
          topic,
          fromCache: false,
          stale: false,
          cachedAt: result.fetchedAt
        }),
        rateLimitInfo: null
      });
    } catch (fetchError) {
      // 3) Guardian failed (rate limit, down, timeout): show the expired cached copy instead of an error
      if (cached) {
        console.log("Guardian failed, serving stale cache:", cacheKey, "-", fetchError.message);
        return NextResponse.json(
          buildSuccessBody({
            payload: cached.payload,
            page,
            time,
            topic,
            fromCache: true,
            stale: true,
            cachedAt: cached.fetchedAt
          })
        );
      }

      throw fetchError; // nothing cached at all, report the real error below
    }

  } catch (error) {
    console.error("Guardian route error:", error.message);

    // Known Guardian problems keep their own status code and message
    if (error instanceof GuardianFetchError) {
      return NextResponse.json(
        {
          success: false,
          error: error.code === 'RATE_LIMIT_EXCEEDED' ? 'Rate limit exceeded' : 'Guardian API error',
          message: error.message,
          code: error.code,
          rateLimitInfo: error.rateLimitInfo,
          status: error.status
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch Guardian news",
        message: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}