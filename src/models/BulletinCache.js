// src/models/BulletinCache.js
import mongoose from 'mongoose';

const BulletinCacheSchema = new mongoose.Schema({
    timeframe: {
        type: String,
        required: true,
        enum: ['24hrs'],
        default: '24hrs'
    },

    bullets: {
        type: [String],
        required: true,
        validate: {
            validator: function (arr) {
                return arr.length === 12;
            },
            message: 'Must have exactly 12 bullets'
        }
    },

    detailedCards: [{
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        }
    }],

    sourceArticles: [{
        title: String,
        url: String,
        publishedAt: Date
    }],

    generatedAt: {
        type: Date,
        default: Date.now
    },

    // Set by the cron job to (creation time + 24 hours).
    // This is only a safety net: the old bulletin is normally deleted by the cron job
    // when a NEW bulletin is created, not by this expiry.
    expiresAt: {
        type: Date,
        required: true
    },

    generationMetadata: {
        guardianArticlesFetched: Number,
        geminiTokensUsed: Number,
        processingTimeMs: Number,
        detailsGeneratedAt: Date // added so it matches what the cron script saves
    }
});

// Index for quickly finding the latest bulletin of a timeframe
BulletinCacheSchema.index({ timeframe: 1, generatedAt: -1 });

// Index for finding valid cache
BulletinCacheSchema.index({ timeframe: 1, expiresAt: 1 });

// TTL: auto-delete a bulletin 24 hours after creation (only if no newer bulletin replaced it)
BulletinCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.BulletinCache || mongoose.model('BulletinCache', BulletinCacheSchema);