// src/app/api/presence/heartbeat/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic"; // never cache this route

// Called every 30 seconds by every logged-in browser to say "I'm still here"
export async function POST() {
  try {
    // Only logged-in users can send a heartbeat
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Save "last seen" time; this is what the admin page uses to decide who is online
    await User.updateOne(
      { email: session.user.email },
      { $set: { lastSeenAt: new Date() } },
      { timestamps: false } // don't change the user's updatedAt on every ping
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return NextResponse.json({ error: "Heartbeat failed" }, { status: 500 });
  }
}