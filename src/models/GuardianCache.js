// src/models/GuardianCache.js
import mongoose from 'mongoose';

const GuardianCacheSchema = new mongoose.Schema({
  // Unique cache key based on query parameters
  cacheKey: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  
  // When this cache entry was created
  fetchedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // The actual API response data
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Query parameters for reference
  queryParams: {
    location: String,
    time: String,
    topic: String,
    hours: Number
  },
  
  // Rate limit info from Guardian
  rateLimitInfo: {
    remaining: Number,
    limit: Number
  }
}, {
  timestamps: true
});

// TTL index - automatically delete documents after 5 minutes
GuardianCacheSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 300 });

// Method to check if cache is still valid
GuardianCacheSchema.methods.isValid = function(ttlMinutes = 5) {
  const now = new Date();
  const age = (now - this.fetchedAt) / 1000 / 60; // age in minutes
  return age < ttlMinutes;
};

export default mongoose.models.GuardianCache || 
  mongoose.model('GuardianCache', GuardianCacheSchema);