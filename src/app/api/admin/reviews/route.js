// src/app/api/admin/reviews/route.js  (NEW)
// ADMIN ONLY: lists the site reviews by status (pending / approved / rejected) + counts for the tabs.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Review from "@/models/Review";

export const dynamic = "force-dynamic"; // always return fresh data

const ALLOWED_STATUS = ["pending", "approved", "rejected"];
const MAX_LIST = 100; // newest 100 reviews of the selected status

export async function GET(request) {
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

    // Step 3: which tab is open (unknown values fall back to "pending")
    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get("status");
    const status = ALLOWED_STATUS.includes(rawStatus) ? rawStatus : "pending";

    // Step 4: the list for this tab + the number of reviews in every status (for the tab badges)
    const [list, grouped] = await Promise.all([
      Review.find({ reviewType: "general", status })
        .sort({ createdAt: -1 }) // newest first
        .limit(MAX_LIST)
        .lean(),
      Review.aggregate([
        { $match: { reviewType: "general" } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const counts = { pending: 0, approved: 0, rejected: 0 };
    grouped.forEach((g) => {
      if (counts[g._id] !== undefined) counts[g._id] = g.count;
    });

    const reviews = list.map((r) => ({
      id: r._id.toString(),
      userName: r.userName || "",
      userEmail: r.userEmail,
      rating: r.rating,
      comment: r.comment || "",
      status: r.status,
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt || null,
      reviewedBy: r.reviewedBy || "",
    }));

    return NextResponse.json({ success: true, reviews, counts });
  } catch (error) {
    console.error("Admin reviews fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}