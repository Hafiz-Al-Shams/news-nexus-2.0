// src/app/api/admin/subscribers/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic"; // always return fresh data

const KIT_BASE_URL = "https://api.kit.com/v4";
const PER_PAGE = 500; // Kit's default page size
const MAX_PAGES = 10; // safety limit: up to 5000 subscribers (protects the Kit rate limit and response time)

// Reads subscribers from Kit page by page (Kit uses cursors: "after=<end_cursor>")
async function fetchAllKitSubscribers() {
  const all = [];
  let cursor = null;
  let truncated = false;

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({ status: "all", per_page: String(PER_PAGE) }); // "all" = every status, not only active
    if (cursor) params.set("after", cursor);

    const response = await fetch(`${KIT_BASE_URL}/subscribers?${params.toString()}`, {
      headers: { "X-Kit-Api-Key": process.env.KIT_API_KEY }, // secret key, stays on the server
      signal: AbortSignal.timeout(15000), // never hang longer than 15 seconds
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Kit API error ${response.status}`);
    }

    const data = await response.json();
    all.push(...(data.subscribers || []));

    if (!data.pagination?.has_next_page) break; // last page reached
    cursor = data.pagination.end_cursor;

    if (page === MAX_PAGES - 1) truncated = true; // more pages exist but we stopped at the limit
  }

  return { subscribers: all, truncated };
}

export async function GET() {
  try {
    // Step 1: must be logged in
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized - Please login" }, { status: 401 });
    }

    await connectDB();

    // Step 2: must be an admin, checked in the DATABASE (same rule as /api/admin/users)
    const requester = await User.findOne({ email: session.user.email }).select("role");
    if (!requester || requester.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admins only" }, { status: 403 });
    }

    // Step 3: the Kit key must be configured on the server (.env.local / Vercel)
    if (!process.env.KIT_API_KEY) {
      console.error("KIT_API_KEY is not configured");
      return NextResponse.json({ error: "Kit is not configured (KIT_API_KEY missing)" }, { status: 500 });
    }

    // Step 4: load subscribers from Kit
    const { subscribers, truncated } = await fetchAllKitSubscribers();

    // Only send what the admin page needs
    const list = subscribers.map((s) => ({
      id: s.id,
      name: s.first_name || null,
      email: s.email_address,
      state: s.state, // active | inactive (not confirmed yet) | cancelled | bounced | complained
      createdAt: s.created_at,
    }));

    // Counts for the stat cards
    const counts = {
      active: list.filter((s) => s.state === "active").length,
      pending: list.filter((s) => s.state === "inactive").length,
      unsubscribed: list.filter((s) => s.state === "cancelled").length,
      total: list.length,
    };

    return NextResponse.json({
      success: true,
      subscribers: list,
      counts,
      truncated, // true when there are more subscribers than we loaded
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin subscribers fetch error:", error);
    return NextResponse.json({ error: "Failed to load subscribers from Kit" }, { status: 502 });
  }
}