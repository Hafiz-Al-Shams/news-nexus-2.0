// src/app/api/reviews/route.js  (NEW)
// PUBLIC route: returns the 3 permanent reviews + the APPROVED user reviews + the calculated average.
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Review from "@/models/Review";
import { SEED_REVIEWS, SEED_RATING_SUM, computeAverage } from "@/utils/seedReviews";

export const dynamic = "force-dynamic"; // always fresh, so an approved review appears immediately

const MAX_SHOWN = 20; // newest approved reviews shown in the list (the average still uses ALL approved reviews)

export async function GET() {
  try {
    await connectDB();

    // Only public site reviews that the admin approved
    const approvedFilter = { reviewType: "general", status: "approved" };

    const [approvedReviews, totals] = await Promise.all([
      // the newest reviews to display (the email is never selected, so it can't leak)
      Review.find(approvedFilter)
        .sort({ createdAt: -1 })
        .limit(MAX_SHOWN)
        .select("userName rating comment createdAt")
        .lean(),
      // count + sum of ALL approved ratings (for the average)
      Review.aggregate([
        { $match: approvedFilter },
        { $group: { _id: null, count: { $sum: 1 }, sum: { $sum: "$rating" } } },
      ]),
    ]);

    const approvedCount = totals[0]?.count || 0;
    const approvedSum = totals[0]?.sum || 0;

    // Average = (3 permanent ratings + all approved ratings) / (3 + approved count), one decimal like 4.7
    const count = SEED_REVIEWS.length + approvedCount;
    const average = computeAverage(count, SEED_RATING_SUM + approvedSum);

    // The 3 permanent reviews ALWAYS come first, approved user reviews after them
    const reviews = [
      ...SEED_REVIEWS,
      ...approvedReviews.map((r) => ({
        id: r._id.toString(),
        userName: r.userName || "Reader",
        rating: r.rating,
        comment: r.comment || "",
        createdAt: r.createdAt,
      })),
    ];

    return NextResponse.json({ success: true, reviews, average, count });
  } catch (error) {
    console.error("Reviews fetch error:", error);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}