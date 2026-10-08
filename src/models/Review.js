import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true,
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
  // NEW: Review type to differentiate between article summaries and bulletin details
  reviewType: {
    type: String,
    enum: ['article_summary', 'bulletin_details', 'general'],
    default: 'article_summary'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);