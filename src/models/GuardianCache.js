// src/models/GuardianCache.js
import mongoose from 'mongoose';

const GuardianCacheSchema = new mongoose.Schema({
  // Unique key = filter + page, e.g. "guardian_24h_politics_p2" (unique already creates the index)
  cacheKey: {
    type: String,
    required: true,
    unique: true
  },

  // When this page was fetched from the Guardian API
  fetchedAt: {
    type: Date,
    default: Date.now
  },

  // The cached page is served as "fresh" until this time (fetchedAt + 12 hours)
  freshUntil: {
    type: Date,
    required: true
  },

  // MongoDB physically deletes the document at this time (fetchedAt + 24 hours).
  // The extra 12 hours keep an expired page available as a fallback when the Guardian API is down.
  purgeAt: {
    type: Date,
    required: true
  },

  // The actual page data: { articles, count, page, pages, total, hasMore }
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Query parameters for reference
  queryParams: {
    time: String,
    topic: String,
    page: Number
  },

  // Rate limit info from Guardian
  rateLimitInfo: {
    remaining: Number,
    limit: Number
  }
}, {
  timestamps: true
});

// TTL index: MongoDB auto-deletes a document once purgeAt has passed
GuardianCacheSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if this cached page is still fresh (younger than 12 hours)
GuardianCacheSchema.methods.isFresh = function () {
  return this.freshUntil > new Date();
};

// NEW collection name ("guardiannewscache"): the old "guardiancaches" collection has a 5-minute
// auto-delete index that would wipe the 12-hour cache, so we deliberately do not reuse it.
export default mongoose.models.GuardianCache ||
  mongoose.model('GuardianCache', GuardianCacheSchema, 'guardiannewscache');