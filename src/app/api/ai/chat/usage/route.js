// src>app>api>ai>chat>usage>route.js  (NEW)
// Returns the logged-in user's chat quota WITHOUT using any of it (the modal calls this when it opens).
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import { getUserUsage, ensureChatIndexes } from "@/lib/chatQuota";

export const dynamic = "force-dynamic"; // always fresh

export async function GET() {
  try {
    // Login required (no public endpoint)
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please login." }, { status: 401 });
    }

    await connectDB();
    await ensureChatIndexes();

    const usage = await getUserUsage(session.user.email); // read only, nothing is consumed

    return NextResponse.json({
      success: true,
      remaining: usage.remaining,
      limit: usage.limit,
      resetAt: usage.resetAt, // null when no message was sent in the last 24 hours
    });
  } catch (error) {
    console.error("Chat usage error:", error.message);
    return NextResponse.json({ success: false, error: "Failed to load usage" }, { status: 500 });
  }
}