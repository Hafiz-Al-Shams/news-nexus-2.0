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