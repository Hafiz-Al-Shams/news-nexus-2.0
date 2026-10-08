import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const API_KEY = process.env.NEWS_API_KEY;
const BASE_URL = "https://newsapi.org/v2";

// CORRECT Country codes mapping for locations (ISO 3166-1)
const LOCATION_COUNTRIES = {
  world: ["us", "gb", "ca", "au", "in"], 
  asia: ["in", "jp", "kr", "sg", "th"],
  europe: ["gb", "de", "fr", "it", "nl"],
  america: ["us", "ca", "mx", "ar", "br"],
};

// Calculate time range based on filter
function getTimeRange(timeFilter) {
  const now = new Date();
  const from = new Date();

  switch (timeFilter) {
    case "1h":
      from.setHours(now.getHours() - 1);
      break;
    case "6h":
      from.setHours(now.getHours() - 6);
      break;
    case "12h":
      from.setHours(now.getHours() - 12);
      break;
    case "24h":
    default:
      from.setHours(now.getHours() - 24);
      break;
  }

  return {
    from: from.toISOString(),
    to: now.toISOString(),
  };
}

// Function to check rate limit status
function checkRateLimitHeaders(headers) {
  const rateLimitInfo = {
    limit: headers.get('X-RateLimit-Limit'),
    remaining: headers.get('X-RateLimit-Remaining'),
    reset: headers.get('X-RateLimit-Reset'),
    retryAfter: headers.get('Retry-After'),
  };

  console.log('📊 ===== RATE LIMIT STATUS =====');
  console.log('🔢 Daily Limit:', rateLimitInfo.limit || 'Not available');
  console.log('✅ Remaining Requests:', rateLimitInfo.remaining || 'Not available');
  
  if (rateLimitInfo.reset) {
    const resetDate = new Date(parseInt(rateLimitInfo.reset) * 1000);
    console.log('⏰ Resets At:', resetDate.toLocaleString());
  }
  
  if (rateLimitInfo.retryAfter) {
    console.log('⏳ Retry After:', rateLimitInfo.retryAfter, 'seconds');
  }
  
  console.log('================================\n');

  return rateLimitInfo;
}

// Function to handle NewsAPI errors
function handleNewsAPIError(status, errorData) {
  console.log('❌ ===== NEWS API ERROR =====');
  console.log('Status Code:', status);
  console.log('Error:', JSON.stringify(errorData, null, 2));
  
  // Common NewsAPI error codes
  switch (errorData.code) {
    case 'rateLimited':
      console.log('🚫 RATE LIMIT EXCEEDED!');
      console.log('💡 You have exceeded your daily request quota');
      console.log('📅 Free tier: 100 requests/day');
      console.log('🔄 Resets at midnight UTC');
      return {
        error: 'Rate limit exceeded',
        message: 'You have exceeded your daily NewsAPI quota (100 requests). Please try again tomorrow.',
        code: 'RATE_LIMIT_EXCEEDED',
        resetInfo: 'Resets at midnight UTC'
      };
      
    case 'apiKeyDisabled':
      console.log('🔑 API KEY DISABLED!');
      return {
        error: 'API key disabled',
        message: 'Your NewsAPI key has been disabled. Please check your account.',
        code: 'API_KEY_DISABLED'
      };
      
    case 'apiKeyInvalid':
      console.log('🔑 API KEY INVALID!');
      return {
        error: 'Invalid API key',
        message: 'The NewsAPI key is invalid. Please check your configuration.',
        code: 'API_KEY_INVALID'
      };
      
    case 'apiKeyMissing':
      console.log('🔑 API KEY MISSING!');
      return {
        error: 'API key missing',
        message: 'NewsAPI key is not configured.',
        code: 'API_KEY_MISSING'
      };
      
    case 'parameterInvalid':
      console.log('⚠️ INVALID PARAMETER!');
      console.log('Details:', errorData.message);
      return {
        error: 'Invalid parameter',
        message: errorData.message || 'Invalid request parameters',
        code: 'INVALID_PARAMETER'
      };
      
    case 'parametersMissing':
      console.log('⚠️ MISSING PARAMETERS!');
      return {
        error: 'Missing parameters',
        message: errorData.message || 'Required parameters are missing',
        code: 'MISSING_PARAMETERS'
      };
      
    case 'sourcesTooMany':
      console.log('⚠️ TOO MANY SOURCES!');
      return {
        error: 'Too many sources',
        message: 'Maximum 20 sources allowed per request',
        code: 'TOO_MANY_SOURCES'
      };
      
    case 'sourceDoesNotExist':
      console.log('⚠️ SOURCE NOT FOUND!');
      return {
        error: 'Source not found',
        message: errorData.message || 'The requested source does not exist',
        code: 'SOURCE_NOT_FOUND'
      };
      
    default:
      console.log('⚠️ UNKNOWN ERROR!');
      return {
        error: 'Unknown error',
        message: errorData.message || 'An unknown error occurred',
        code: errorData.code || 'UNKNOWN'
      };
  }
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

    if (!API_KEY) {
      console.error("❌ NEWS_API_KEY is not configured in .env.local");
      return NextResponse.json(
        { error: "News API is not configured" },
        { status: 500 }
      );
    }

    console.log('🔑 Using API Key:', API_KEY.substring(0, 8) + '...' + API_KEY.substring(API_KEY.length - 4));

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location") || "world";
    const time = searchParams.get("time") || "24h";
    const topic = searchParams.get("topic") || "general";

    console.log("\n🔍 ===== NEW REQUEST =====");
    console.log("📍 Location:", location);
    console.log("⏰ Time:", time);
    console.log("📰 Topic:", topic);
    console.log("========================\n");

    // Get countries for location
    const countries = LOCATION_COUNTRIES[location] || LOCATION_COUNTRIES.world;

    // Get time range
    const { from, to } = getTimeRange(time);

    console.log("🌍 Countries to fetch:", countries);
    console.log("📅 Time range:", from, "to", to, "\n");

    // Try a simple test request first to check API status
    console.log("🧪 Testing API connection...");
    const testEndpoint = `${BASE_URL}/top-headlines?country=us&pageSize=1&apiKey=${API_KEY}`;
    
    const testResponse = await fetch(testEndpoint);
    const testHeaders = checkRateLimitHeaders(testResponse.headers);
    
    // Check if rate limit is exceeded
    if (testResponse.status === 429) {
      const errorData = await testResponse.json();
      const errorInfo = handleNewsAPIError(429, errorData);
      console.log('================================\n');
      
      return NextResponse.json(
        { 
          success: false, 
          ...errorInfo,
          rateLimitInfo: testHeaders
        },
        { status: 429 }
      );
    }
    
    if (!testResponse.ok) {
      const errorData = await testResponse.json();
      const errorInfo = handleNewsAPIError(testResponse.status, errorData);
      console.log('================================\n');
      
      return NextResponse.json(
        { 
          success: false, 
          ...errorInfo
        },
        { status: testResponse.status }
      );
    }

    const testData = await testResponse.json();
    
    if (testData.status === "error") {
      console.log("❌ API Test Failed!");
      const errorInfo = handleNewsAPIError(testResponse.status, testData);
      return NextResponse.json(
        { 
          success: false, 
          ...errorInfo
        },
        { status: 400 }
      );
    }

    console.log("✅ API connection successful!\n");

    // Now fetch actual news
    const fetchPromises = countries.slice(0, 2).map(async (country) => {
      try {
        let endpoint;
        const categoryQuery = topic !== "general" ? ` ${topic}` : "";
        
        endpoint = `${BASE_URL}/everything?` +
          `q=news${categoryQuery}&` +
          `language=en&` +
          `from=${from}&` +
          `to=${to}&` +
          `sortBy=publishedAt&` +
          `pageSize=20&` +
          `apiKey=${API_KEY}`;

        console.log(`📡 Fetching news for: ${country}`);
        
        const response = await fetch(endpoint);
        checkRateLimitHeaders(response.headers);

        if (response.status === 429) {
          const errorData = await response.json();
          handleNewsAPIError(429, errorData);
          return { articles: [], rateLimitExceeded: true };
        }

        if (!response.ok) {
          const errorData = await response.json();
          handleNewsAPIError(response.status, errorData);
          return { articles: [] };
        }

        const data = await response.json();
        
        if (data.status === "error") {
          handleNewsAPIError(response.status, data);
          return { articles: [] };
        }
        
        console.log(`✅ ${country}: ${data.articles?.length || 0} articles\n`);
        return data;
      } catch (error) {
        console.error(`❌ Error fetching from ${country}:`, error.message);
        return { articles: [] };
      }
    });

    const results = await Promise.all(fetchPromises);

    // Check if rate limit was hit
    if (results.some(r => r.rateLimitExceeded)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'NewsAPI daily limit reached. Please try again tomorrow.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }

    let allArticles = [];
    results.forEach((result) => {
      if (result.articles && Array.isArray(result.articles)) {
        allArticles = [...allArticles, ...result.articles];
      }
    });

    console.log(`📊 Total articles fetched: ${allArticles.length}`);

    const uniqueArticles = Array.from(
      new Map(
        allArticles
          .filter(article => article.title && article.title !== "[Removed]")
          .map((article) => [article.title, article])
      ).values()
    );

    console.log(`✨ Unique articles: ${uniqueArticles.length}`);

    const filteredArticles = uniqueArticles
      .filter((article) => {
        return (
          article.urlToImage && 
          article.url &&
          article.title &&
          article.description &&
          article.title !== "[Removed]"
        );
      })
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 30);

    console.log(`✅ Final filtered articles: ${filteredArticles.length}`);
    console.log('================================\n');

    if (filteredArticles.length === 0) {
      console.log("⚠️ No articles found, trying fallback...\n");
      
      const fallbackEndpoint = topic === "general"
        ? `${BASE_URL}/top-headlines?country=us&pageSize=20&apiKey=${API_KEY}`
        : `${BASE_URL}/top-headlines?country=us&category=${topic}&pageSize=20&apiKey=${API_KEY}`;
      
      const fallbackResponse = await fetch(fallbackEndpoint);
      checkRateLimitHeaders(fallbackResponse.headers);
      
      if (fallbackResponse.status === 429) {
        const errorData = await fallbackResponse.json();
        const errorInfo = handleNewsAPIError(429, errorData);
        
        return NextResponse.json(
          { 
            success: false, 
            ...errorInfo
          },
          { status: 429 }
        );
      }
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.articles && fallbackData.articles.length > 0) {
          const fallbackFiltered = fallbackData.articles
            .filter(article => 
              article.urlToImage && 
              article.title !== "[Removed]"
            )
            .slice(0, 20);
          
          console.log(`✅ Fallback returned ${fallbackFiltered.length} articles\n`);
          
          return NextResponse.json({
            success: true,
            articles: fallbackFiltered,
            count: fallbackFiltered.length,
            filters: { location, time, topic },
            note: "Showing latest top headlines"
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      articles: filteredArticles,
      count: filteredArticles.length,
      filters: { location, time, topic },
    });
    
  } catch (error) {
    console.error("\n❌ ===== UNEXPECTED ERROR =====");
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    console.error("================================\n");
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch news",
        message: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}