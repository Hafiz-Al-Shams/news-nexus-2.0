import { NextResponse } from "next/server";
import { generateChatResponse } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { message, history } = body;

    // Validate message
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: "Valid message is required" },
        { status: 400 }
      );
    }

    // Validate history format (should be array)
    if (history && !Array.isArray(history)) {
      return NextResponse.json(
        { error: "History must be an array" },
        { status: 400 }
      );
    }

    console.log("🤖 Generating AI response for:", message.substring(0, 100) + "...");
    console.log("📚 History length:", history?.length || 0);

    // Generate AI response with thinking enabled
    const aiResponse = await generateChatResponse(
      message.trim(), 
      history || []
    );

    console.log("✅ AI Response generated successfully");
    console.log("📝 Response preview:", aiResponse.substring(0, 100) + "...");

    return NextResponse.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString(),
      // Optional: include metadata
      metadata: {
        model: "gemini-2.5-flash",
        thinkingEnabled: true,
        historyLength: history?.length || 0
      }
    });

  } catch (error) {
    console.error("❌ AI Chat Error:", error);
    console.error("🔍 Error details:", error.message);
    console.error("📋 Stack trace:", error.stack);
    
    // Handle specific error types
    let errorMessage = "Failed to generate response";
    let statusCode = 500;

    if (error.message?.includes("API key")) {
      errorMessage = "API configuration error";
      statusCode = 500;
    } else if (error.message?.includes("quota") || error.message?.includes("rate limit")) {
      errorMessage = "Service temporarily unavailable. Please try again later.";
      statusCode = 429;
    } else if (error.message?.includes("timeout")) {
      errorMessage = "Request timeout. Please try again.";
      statusCode = 504;
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: statusCode }
    );
  }
}

// Optional: Add GET method for health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "AI Chat API",
    model: "gemini-2.5-flash",
    thinkingEnabled: true,
    timestamp: new Date().toISOString()
  });
}