// src>app>api>ai>summarize-article>route.js  (MODIFIED)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// How long a generated summary stays cached
const SUMMARY_CACHE_MS = 24 * 60 * 60 * 1000;

// Max characters of article body sent to Gemini (keeps cost and speed under control)
const MAX_BODY_CHARS = 8000;

// MongoDB Schema for caching summaries
const SummarySchema = new mongoose.Schema({
  articleUrl: { type: String, required: true, unique: true, index: true },
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// TTL index - MongoDB auto-deletes a summary once its expiresAt (24 hours after creation) passes
SummarySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ArticleSummary = mongoose.models.ArticleSummary || mongoose.model("ArticleSummary", SummarySchema);

// Rate limit schema
const RateLimitSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  count: { type: Number, default: 0 },
  resetAt: { type: Date, required: true },
  dailyCount: { type: Number, default: 0 },
  dailyResetAt: { type: Date, required: true },
});

const RateLimit = mongoose.models.RateLimit || mongoose.model("RateLimit", RateLimitSchema);

// Ensure MongoDB connection
async function ensureDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

// Sanitize JSON string - fix smart quotes and other problematic characters
function sanitizeJsonString(str) {
  return str
    // Remove markdown code blocks
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    // Replace smart double quotes with regular quotes (unicode escapes so they are never mistaken for plain quotes)
    .replace(/[\u201C\u201D]/g, '"')
    // Replace smart single quotes/apostrophes with regular apostrophes
    .replace(/[\u2018\u2019]/g, "'")
    // Replace em/en dashes with regular dashes
    .replace(/[—–]/g, '-')
    // Replace ellipsis
    .replace(/…/g, '...')
    .trim();
}

// Fetch the full article text from the Guardian API using the article's URL
// Done on the server (not sent from the browser) so nobody can store fake text in the shared cache
async function fetchGuardianArticleBody(url) {
  try {
    const parsedUrl = new URL(url);

    // Only works for Guardian articles; other sources fall back to the description
    if (!parsedUrl.hostname.endsWith("theguardian.com")) return null;
    if (!process.env.GUARDIAN_API_KEY) return null;

    // Guardian article id = URL path, e.g. /world/2026/oct/10/some-story
    const apiUrl =
      `https://content.guardianapis.com${parsedUrl.pathname}` +
      `?api-key=${process.env.GUARDIAN_API_KEY}&show-fields=bodyText`;

    // 8 second timeout so a slow Guardian response can't hang the summary request
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;

    const data = await response.json();
    const bodyText = data.response?.content?.fields?.bodyText;

    if (!bodyText) return null;

    // Trim to the size limit so very long articles don't create huge prompts
    return bodyText.trim().substring(0, MAX_BODY_CHARS);
  } catch (error) {
    // Never fail the whole summary just because the body fetch failed
    console.error("Guardian body fetch failed:", error.message);
    return null;
  }
}

// Check rate limits (now only called when a NEW summary must be generated)
async function checkRateLimit(userEmail) {
  const now = new Date();

  let rateLimit = await RateLimit.findOne({ userEmail });

  if (!rateLimit) {
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);

    rateLimit = await RateLimit.create({
      userEmail,
      count: 0,
      resetAt: new Date(now.getTime() + 60 * 60 * 1000),
      dailyCount: 0,
      dailyResetAt: tomorrow,
    });
  }

  // Reset hourly counter if expired
  if (now > rateLimit.resetAt) {
    rateLimit.count = 0;
    rateLimit.resetAt = new Date(now.getTime() + 60 * 60 * 1000);
  }

  // Reset daily counter if expired
  if (now > rateLimit.dailyResetAt) {
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);

    rateLimit.dailyCount = 0;
    rateLimit.dailyResetAt = tomorrow;
  }

  // Check limits
  if (rateLimit.count >= 10) {
    const minutesLeft = Math.ceil((rateLimit.resetAt - now) / 1000 / 60);
    throw new Error(`Hourly limit reached (10/hour). Try again in ${minutesLeft} minutes.`);
  }

  if (rateLimit.dailyCount >= 100) {
    throw new Error(`Daily limit reached (100/day). Try again tomorrow.`);
  }

  // Increment counters
  rateLimit.count += 1;
  rateLimit.dailyCount += 1;
  await rateLimit.save();

  return {
    hourlyRemaining: 10 - rateLimit.count,
    dailyRemaining: 100 - rateLimit.dailyCount,
  };
}

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;

    // Connect to MongoDB
    await ensureDb();

    // Parse and validate the request first (before any rate limit is applied)
    const { title, description, url } = await request.json();

    if (!title || !url) {
      return NextResponse.json(
        { error: "Title and URL are required" },
        { status: 400 }
      );
    }

    console.log(`Summarizing article for: ${userEmail}`);
    console.log(`URL: ${url}`);

    // Check the cache BEFORE the rate limit, so ready-made summaries are free
    const cached = await ArticleSummary.findOne({
      articleUrl: url,
      expiresAt: { $gt: new Date() },
    });

    if (cached) {
      console.log("Returning cached summary (no rate limit used)");
      return NextResponse.json({
        success: true,
        summary: {
          title: cached.title,
          content: cached.content,
        },
        cached: true,
        rateLimitInfo: null, // no counter was touched for a cached summary
      });
    }

    // CHANGED: the rate limit check (database) and the full article fetch (Guardian) now run AT THE SAME TIME
    // instead of one after the other. fetchGuardianArticleBody never throws, so nothing is left unhandled
    // if the rate limit check rejects.
    console.log("Checking rate limit and fetching full article body in parallel...");
    const [rateLimitInfo, articleBody] = await Promise.all([
      checkRateLimit(userEmail),
      fetchGuardianArticleBody(url),
    ]);
    console.log(articleBody ? `Body fetched (${articleBody.length} chars)` : "No body available, using description only");

    // Generate new summary with Gemini
    console.log("Generating new summary with Gemini...");

    // Prompt uses the full article text and asks for 8 sentences / max 200 words
    const prompt = `You are a professional news summarizer. Write a rich, informative summary of the following news article.

Article Title: ${title}
Article Description: ${description || "No description available"}
${articleBody ? `\nFull Article Text:\n${articleBody}\n` : ""}
CRITICAL: Use only standard ASCII quotes (") and apostrophes ('). Do NOT use smart quotes or special characters.

Provide your response in this EXACT JSON format (no markdown, no code blocks):
{
  "title": "A concise 5-6 word headline",
  "content": "An 8 sentence summary (max 200 words total)"
}

Cover who, what, where, when, why, and the key consequences or reactions. Be clear, factual and direct. Only use information from the material provided above, do not invent details.`;

    // Use correct API pattern
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      config: {
        // Ask Gemini to return valid JSON directly (fewer parsing failures with longer text)
        responseMimeType: "application/json",
        // CHANGED: turn "thinking" OFF for summaries. Gemini 2.5 Flash thinks by default, which adds
        // several seconds. Summarizing text that is already provided doesn't need it.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    // Extract response text
    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("No valid response from AI");
    }

    console.log("Raw Gemini response:", responseText);

    // Parse JSON response with sanitization and fallback
    let summary;
    let usedFallback = false;

    try {
      const cleanText = sanitizeJsonString(responseText);
      console.log("Sanitized text:", cleanText);
      summary = JSON.parse(cleanText);

      // Validate structure
      if (!summary.title || !summary.content) {
        throw new Error("Invalid summary format from AI");
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      console.error("Raw response was:", responseText);

      // FALLBACK: Create a summary from original content instead of failing
      usedFallback = true;
      const fallbackSource = articleBody || description; // prefer the full body, else the description
      summary = {
        title: title.length > 50
          ? title.substring(0, 50) + '...'
          : title,
        content: fallbackSource
          ? (fallbackSource.length > 800
            ? fallbackSource.substring(0, 800) + '...'
            : fallbackSource)
          : "Unable to generate AI summary. Please read the full article for details."
      };

      console.log("Using fallback summary due to parsing failure");
    }

    // Cache the summary for 24 hours
    // Fallback summaries are NOT cached, so the next click can try for a proper AI summary
    if (!usedFallback) {
      const expiresAt = new Date(Date.now() + SUMMARY_CACHE_MS);

      // Upsert instead of create(), so an expired-but-not-yet-deleted
      // document (or two simultaneous requests) can't cause a duplicate-key error
      await ArticleSummary.findOneAndUpdate(
        { articleUrl: url },
        {
          articleUrl: url,
          title: summary.title,
          content: summary.content,
          createdAt: new Date(),
          expiresAt,
        },
        { upsert: true, new: true }
      );

      console.log("AI summary cached for 24 hours");
    }

    return NextResponse.json({
      success: true,
      summary,
      cached: false,
      usedFallback, // Frontend can know if this was a fallback
      rateLimitInfo,
    });

  } catch (error) {
    console.error("Summarization error:", error);

    let errorMessage = error.message || "Failed to generate summary";
    let statusCode = 500;

    if (error.message?.includes("limit")) {
      statusCode = 429;
    } else if (error.message?.includes("Unauthorized")) {
      statusCode = 401;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode }
    );
  }
}