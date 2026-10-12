import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      // Not required for social logins
    },
    provider: {
      type: String,
      default: "credentials", // or "google"
    },
    // User type - every new user is saved as "user"; you change it to "admin" manually in MongoDB
    role: {
      type: String,
      enum: ["user", "admin"], // only these two values are allowed
      default: "user",         // all new users (credentials + Google) automatically get "user"
    },
    // Updated by the heartbeat ping; used to decide who is online right now
    lastSeenAt: {
      type: Date,
      default: null,
    },
    // NEW: daily newsletter settings (written by /api/newsletter and the daily GitHub job)
    newsletter: {
      subscribed: { type: Boolean, default: false },                    // true = receives the daily email
      plan: { type: String, enum: ["free", "premium"], default: "free" }, // "premium" is set manually in MongoDB for now (Stripe later)
      subscribedAt: { type: Date, default: null },                      // when they last subscribed
      unsubscribedAt: { type: Date, default: null },                    // when they last unsubscribed
      lastSentAt: { type: Date, default: null },                        // last time the daily job sent them the newsletter (prevents duplicates)
    },
    // Daily limits tracking
    dailyLimits: {
      type: Map,
      of: {
        bulletinExpansions: { type: Number, default: 0 },
        articleSummaries: { type: Number, default: 0 }
      },
      default: {}
    }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);