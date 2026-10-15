// src>models>ChatUsage.js  (NEW)
// One document per user: how many chat messages were used in the current 24-hour window.
// Separate from the RateLimit model used by the summary route (that one is untouched).
import mongoose from "mongoose";

const ChatUsageSchema = new mongoose.Schema({
  // lower-cased email, unique = exactly one document per user (also what makes the atomic "create" safe)
  userEmail: { type: String, required: true, unique: true },

  // Messages used in the current window
  count: { type: Number, default: 0 },

  // When the current 24h window ends (the quota resets then)
  windowResetAt: { type: Date, required: true },
});

// TTL: MongoDB deletes the document once its window has ended (a fresh one is created on the next message)
ChatUsageSchema.index({ windowResetAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.ChatUsage || mongoose.model("ChatUsage", ChatUsageSchema);