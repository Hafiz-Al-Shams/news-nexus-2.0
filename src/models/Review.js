// src>models>Review.js  (MODIFIED)
import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true,
  },
  // NEW: the name shown next to a public review (copied from the login session when the review is submitted)
  userName: {
    type: String,
    default: "",
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    maxLength: 500,
  },
  articleUrl: {
    type: String,
  },
  // Review type: article_summary / bulletin_details = private feedback, "general" = the public site review
  reviewType: {
    type: String,
    enum: ['article_summary', 'bulletin_details', 'general'],
    default: 'article_summary'
  },
  // NEW: admin approval. Only "general" reviews with status "approved" appear on the website.
  // Old reviews saved before this feature have no status, so they can never appear publicly by accident.
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  // NEW: who reviewed it and when (filled when the admin approves / rejects)
  reviewedAt: {
    type: Date,
    default: null,
  },
  reviewedBy: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// NEW: makes "approved site reviews, newest first" and the admin lists fast
ReviewSchema.index({ reviewType: 1, status: 1, createdAt: -1 });

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);