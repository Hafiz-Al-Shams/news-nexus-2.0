// src/app/api/admin/reviews/[id]/route.js  (NEW)
// ADMIN ONLY: approve / reject / move back to pending (PATCH) or delete (DELETE) one review.
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Review from "@/models/Review";

export const dynamic = "force-dynamic";

// Button name -> status saved in the database
const ACTION_TO_STATUS = {
  approve: "approved",   // the review becomes public (and is counted in the average)
  reject: "rejected",    // the review is hidden
  pending: "pending",    // move it back to the waiting list
};

// Shared check used by PATCH and DELETE: returns the admin's email, or a ready error response
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: "Unauthorized - Please login" }, { status: 401 }) };
  }

  await connectDB();

  // Role is checked in the DATABASE, so removing someone's admin role takes effect immediately
  const requester = await User.findOne({ email: session.user.email }).select("role");
  if (!requester || requester.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden - Admins only" }, { status: 403 }) };
  }

  return { email: session.user.email };
}

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin();
    if (admin.error) return admin.error;

    const { id } = await params; // Next.js 15: params is a Promise
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const { action } = await request.json();
    const newStatus = ACTION_TO_STATUS[action];
    if (!newStatus) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Only public site reviews can be moderated (summary / bulletin feedback is untouched)
    const updated = await Review.findOneAndUpdate(
      { _id: id, reviewType: "general" },
      { $set: { status: newStatus, reviewedAt: new Date(), reviewedBy: admin.email } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id, status: updated.status });
  } catch (error) {
    console.error("Admin review update error:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const admin = await requireAdmin();
    if (admin.error) return admin.error;

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const deleted = await Review.findOneAndDelete({ _id: id, reviewType: "general" });
    if (!deleted) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Admin review delete error:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}