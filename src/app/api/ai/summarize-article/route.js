import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// MongoDB Schema for caching summaries
const SummarySchema = new mongoose.Schema({
  articleUrl: { type: String, required: true, unique: true, index: true },
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// TTL index - auto-delete after 12 hours
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
    // Replace smart quotes with regular quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Replace em/en dashes with regular dashes
    .replace(/[—–]/g, '-')
    // Replace ellipsis
    .replace(/…/g, '...')
    .trim();
}

// Check rate limits
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

    // Check rate limits
    const rateLimitInfo = await checkRateLimit(userEmail);

    // Parse request
    const { title, description, url } = await request.json();

    if (!title || !url) {
      return NextResponse.json(
        { error: "Title and URL are required" },
        { status: 400 }
      );
    }

    console.log(`Summarizing article for: ${userEmail}`);
    console.log(`URL: ${url}`);

    // Check cache first
    const cached = await ArticleSummary.findOne({
      articleUrl: url,
      expiresAt: { $gt: new Date() },
    });

    if (cached) {
      console.log("Returning cached summary");
      return NextResponse.json({
        success: true,
        summary: {
          title: cached.title,
          content: cached.content,
        },
        cached: true,
        rateLimitInfo,
      });
    }

    // Generate new summary with Gemini
    console.log("Generating new summary with Gemini...");

    const prompt = `You are a professional news summarizer. Summarize the following news article concisely.

Article Title: ${title}
Article Description: ${description || "No description available"}

CRITICAL: Use only standard ASCII quotes (") and apostrophes ('). Do NOT use smart quotes or special characters.

Provide your response in this EXACT JSON format (no markdown, no code blocks):
{
  "title": "A concise 5-6 word headline",
  "content": "A 2-3 sentence summary (max 60 words total)"
}

Focus on the most important facts. Be clear and direct.`;

    // Use correct API pattern
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
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
      summary = {
        title: title.length > 50
          ? title.substring(0, 50) + '...'
          : title,
        content: description
          ? (description.length > 150
            ? description.substring(0, 150) + '...'
            : description)
          : "Unable to generate AI summary. Please read the full article for details."
      };

      console.log("Using fallback summary due to parsing failure");
    }

    // Cache the summary (12 hours) - even if it's a fallback
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

    await ArticleSummary.create({
      articleUrl: url,
      title: summary.title,
      content: summary.content,
      expiresAt,
    });

    console.log(usedFallback ? "Fallback summary cached" : "AI summary cached");

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