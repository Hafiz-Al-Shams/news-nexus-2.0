// src/app/api/guardian/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from 'mongoose';
import GuardianCache from '@/models/GuardianCache';
import {
  buildGuardianUrl,
  calculateTimeRange,
  GUARDIAN_TOPIC_MAP
} from '@/utils/guardian';

const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY;
const MONGO_URI = process.env.MONGODB_URI;

// Ensure MongoDB connection
async function ensureDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for Guardian cache');
  }
}

// Generate cache key from parameters
function generateCacheKey(params) {
  const { time, topic } = params;
  return `guardian_${time}_${topic}`;
}

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please login to access news." },
        { status: 401 }
      );
    }

    if (!GUARDIAN_API_KEY) {
      console.error("GUARDIAN_API_KEY is not configured");
      return NextResponse.json(
        { error: "Guardian API is not configured" },
        { status: 500 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const time = searchParams.get("time") || "24h";
    const topic = searchParams.get("topic") || "all";

    console.log("\n===== GUARDIAN API REQUEST =====");
    console.log("Time:", time);
    console.log("Topic:", topic);
    console.log("===================================\n");

    // Connect to MongoDB
    await ensureDb();

    // Check cache first
    const cacheKey = generateCacheKey({ time, topic });
    
    try {
      const cached = await GuardianCache.findOne({ 
        cacheKey,
        fetchedAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) } // 5 minutes TTL
      });

      if (cached && cached.isValid()) {
        console.log("Returning cached Guardian data");
        return NextResponse.json({
          success: true,
          fromCache: true,
          articles: cached.payload.articles || [],
          count: cached.payload.count || 0,
          filters: { time, topic },
          cachedAt: cached.fetchedAt
        });
      }
    } catch (cacheError) {
      console.log("Cache read error, continuing with API call:", cacheError.message);
    }

    // Calculate time range
    const { fromDate, toDate } = calculateTimeRange(time);

    // Get topic mapping
    const topicConfig = GUARDIAN_TOPIC_MAP[topic] || GUARDIAN_TOPIC_MAP.all;

    // Build API URL
    const url = buildGuardianUrl({
      section: topicConfig.section,
      tags: topicConfig.tags,
      fromDate,
      toDate,
      pageSize: 50,
      page: 1,
      orderBy: 'newest',
      showFields: [
        'headline',
        'trailText',
        'body',
        'thumbnail',
        'lastModified',
        'wordcount',
        'byline'
      ],
      showTags: ['keyword', 'contributor'],
      apiKey: GUARDIAN_API_KEY
    });

    console.log("Fetching from Guardian API...");

    // Fetch from Guardian API
    const response = await fetch(url);

    // Check rate limit headers
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining-day');
    const rateLimitTotal = response.headers.get('X-RateLimit-Limit-day');

    console.log("\n===== RATE LIMIT INFO =====");
    console.log("Daily Limit:", rateLimitTotal || 'Not available');
    console.log("Remaining:", rateLimitRemaining || 'Not available');
    console.log("===========================\n");

    // Handle rate limit exceeded
    if (response.status === 429) {
      console.log("Guardian API rate limit exceeded!");
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Guardian API daily limit reached. Please try again tomorrow.',
          code: 'RATE_LIMIT_EXCEEDED',
          rateLimitInfo: {
            remaining: rateLimitRemaining,
            limit: rateLimitTotal
          }
        },
        { status: 429 }
      );
    }

    if (!response.ok) {
      console.error("Guardian API error:", response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      
      return NextResponse.json(
        {
          success: false,
          error: 'Guardian API error',
          message: errorData.message || 'Failed to fetch from Guardian',
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Check if response is successful
    if (data.response?.status !== 'ok') {
      console.error("Guardian returned error status:", data.response?.status);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid response from Guardian',
          message: data.response?.message || 'Unknown error'
        },
        { status: 400 }
      );
    }

    const articles = data.response?.results || [];
    
    console.log(`Fetched ${articles.length} articles from Guardian`);

    // Transform Guardian articles to match your format
    const transformedArticles = articles
      .filter(article => article.webTitle && article.webUrl)
      .map(article => ({
        title: article.webTitle,
        description: article.fields?.trailText || article.fields?.body?.substring(0, 200) || '',
        url: article.webUrl,
        urlToImage: article.fields?.thumbnail || null,
        publishedAt: article.webPublicationDate,
        source: {
          id: 'the-guardian',
          name: 'The Guardian'
        },
        author: article.fields?.byline || 'The Guardian',
        content: article.fields?.body || article.fields?.trailText || ''
      }))
      .slice(0, 30);

    console.log(`Transformed ${transformedArticles.length} articles`);

    // Save to cache
    try {
      await GuardianCache.findOneAndUpdate(
        { cacheKey },
        {
          cacheKey,
          fetchedAt: new Date(),
          payload: {
            articles: transformedArticles,
            count: transformedArticles.length
          },
          queryParams: { time, topic },
          rateLimitInfo: {
            remaining: rateLimitRemaining ? parseInt(rateLimitRemaining) : null,
            limit: rateLimitTotal ? parseInt(rateLimitTotal) : null
          }
        },
        { upsert: true, new: true }
      );
      console.log("Saved to cache");
    } catch (cacheError) {
      console.error("Failed to save cache:", cacheError.message);
    }

    console.log("================================\n");

    return NextResponse.json({
      success: true,
      fromCache: false,
      articles: transformedArticles,
      count: transformedArticles.length,
      filters: { time, topic },
      rateLimitInfo: {
        remaining: rateLimitRemaining,
        limit: rateLimitTotal
      }
    });

  } catch (error) {
    console.error("\n===== GUARDIAN API ERROR =====");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("=================================\n");

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