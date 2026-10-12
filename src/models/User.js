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
    // REMOVED: "newsletter" fields (Kit form handles subscribers now, nothing here uses them)
    // REMOVED: "dailyLimits" map (unused, summary limits live in the RateLimit model)
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);