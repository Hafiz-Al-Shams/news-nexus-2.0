// src/app/api/admin/users/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic"; // always return fresh data

// A user counts as "online" if their last heartbeat was within this time
// (heartbeat is every 30s, so 2 minutes leaves room for a missed ping)
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

export async function GET() {
  try {
    // Step 1: must be logged in
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized - Please login" }, { status: 401 });
    }

    await connectDB();

    // Step 2: must be an admin - checked in the DATABASE (not the login token),
    // so removing someone's admin role takes effect immediately
    const requester = await User.findOne({ email: session.user.email }).select("role");
    if (!requester || requester.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admins only" }, { status: 403 });
    }

    // Step 3: load all users (password is never selected, so it can't leak)
    const users = await User.find({})
      .select("name email role provider createdAt lastSeenAt")
      .sort({ createdAt: -1 }) // newest users first
      .lean();

    const now = Date.now();

    const userList = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role || "user", // older users saved before this feature have no role field
      provider: u.provider || "credentials",
      createdAt: u.createdAt,
      lastSeenAt: u.lastSeenAt || null,
      // online = pinged within the last 2 minutes
      isOnline: !!u.lastSeenAt && now - new Date(u.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS,
    }));

    return NextResponse.json({
      success: true,
      users: userList,
      totalUsers: userList.length,
      onlineCount: userList.filter((u) => u.isOnline).length,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}