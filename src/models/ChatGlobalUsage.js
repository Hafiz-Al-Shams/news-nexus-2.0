// src>models>ChatGlobalUsage.js  (NEW)
// One tiny document per UTC day with the total number of successful chat answers (the global circuit-breaker).
import mongoose from "mongoose";

const ChatGlobalUsageSchema = new mongoose.Schema({
  // UTC day like "2026-10-15" (unique = one document per day)
  day: { type: String, required: true, unique: true },

  // Total chat answers reserved today by all users
  count: { type: Number, default: 0 },

  // Cleanup time (the day after the day ends), so old documents disappear by themselves
  expiresAt: { type: Date, required: true },
});

// TTL: MongoDB deletes the document at expiresAt
ChatGlobalUsageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.ChatGlobalUsage || mongoose.model("ChatGlobalUsage", ChatGlobalUsageSchema);