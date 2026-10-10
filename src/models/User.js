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
    // NEW: user type - every new user is saved as "user"; you change it to "admin" manually in MongoDB
    role: {
      type: String,
      enum: ["user", "admin"], // only these two values are allowed
      default: "user",         // all new users (credentials + Google) automatically get "user"
    },
    // NEW: updated by the heartbeat ping; used to decide who is online right now
    lastSeenAt: {
      type: Date,
      default: null,
    },
    // NEW: Daily limits tracking
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