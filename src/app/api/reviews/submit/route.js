// src>app>api>reviews>submit>route.js  (MODIFIED)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb"; // shared, race-safe database connection
import Review from "@/models/Review";

const MIN_SITE_COMMENT = 10; // a public review needs a real sentence

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    await connectDB();

    const { rating, comment, articleUrl, reviewType } = await request.json();

    // Whole numbers 1 to 5 only
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Valid rating (1-5) is required" },
        { status: 400 }
      );
    }

    // Validate reviewType
    const validReviewTypes = ['article_summary', 'bulletin_details', 'general'];
    const finalReviewType = validReviewTypes.includes(reviewType) 
      ? reviewType 
      : 'article_summary';

    // NEW: "general" = the public site review shown in the review section (needs admin approval)
    const isSiteReview = finalReviewType === 'general';
    const cleanComment = (comment || "").toString().trim().slice(0, 500);

    if (isSiteReview) {
      // A public review must contain a comment
      if (cleanComment.length < MIN_SITE_COMMENT) {
        return NextResponse.json(
          { error: `Please write at least ${MIN_SITE_COMMENT} characters in your review.` },
          { status: 400 }
        );
      }

      // One waiting review per user (stops spam while the admin has not decided yet)
      const alreadyPending = await Review.exists({
        userEmail: session.user.email,
        reviewType: 'general',
        status: 'pending',
      });

      if (alreadyPending) {
        return NextResponse.json(
          { error: "You already have a review waiting for admin approval." },
          { status: 409 }
        );
      }
    }

    const review = await Review.create({
      userEmail: session.user.email,
      userName: session.user.name || session.user.email.split("@")[0], // name shown publicly after approval
      rating,
      comment: cleanComment,
      articleUrl: articleUrl || "",
      reviewType: finalReviewType,
      // Site reviews wait for the admin. Summary / bulletin feedback is private and never shown, so no approval is needed.
      status: isSiteReview ? 'pending' : 'approved',
    });

    console.log(`⭐ ${finalReviewType} review submitted by ${session.user.email}: ${rating}/5`);

    return NextResponse.json({
      success: true,
      review: {
        id: review._id,
        rating: review.rating,
        reviewType: review.reviewType,
        status: review.status,
      },
    });

  } catch (error) {
    console.error("❌ Review submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}