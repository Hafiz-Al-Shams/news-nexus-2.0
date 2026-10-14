// src/models/SearchCache.js  (NEW)
import mongoose from "mongoose";

const SearchCacheSchema = new mongoose.Schema(
  {
    // Unique key = keyword + page, e.g. "search_climate change_p1" (unique also creates the index)
    cacheKey: {
      type: String,
      required: true,
      unique: true,
    },

    // The exact (normalized) keyword the user searched for
    keyword: {
      type: String,
      required: true,
      index: true,
    },

    // Which page of results this document holds (1 = first 30 articles)
    page: {
      type: Number,
      default: 1,
    },

    // The saved result: { articles, count, page, pages, total, hasMore, keyword }
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // When this page was fetched from the Guardian API
    fetchedAt: {
      type: Date,
      default: Date.now,
    },

    // Served as "fresh" until this time (fetchedAt + 12 hours). After that Guardian is asked again.
    freshUntil: {
      type: Date,
      required: true,
    },

    // MongoDB physically deletes the document at this time (fetchedAt + 24 hours).
    // The extra 12 hours keep an expired result available as a fallback when Guardian is down.
    purgeAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// TTL index: MongoDB auto-deletes a document once purgeAt has passed
SearchCacheSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

// Own collection name, so it never mixes with the other caches
export default mongoose.models.SearchCache ||
  mongoose.model("SearchCache", SearchCacheSchema, "searchnewscache");