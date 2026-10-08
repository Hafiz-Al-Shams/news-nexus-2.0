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

    expiresAt: {
        type: Date,
        required: true
        // REMOVED: index: true
    },

    generationMetadata: {
        guardianArticlesFetched: Number,
        geminiTokensUsed: Number,
        processingTimeMs: Number
    }
});

// Index for finding valid cache
BulletinCacheSchema.index({ timeframe: 1, expiresAt: 1 });

// Auto-delete expired documents
BulletinCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.BulletinCache || mongoose.model('BulletinCache', BulletinCacheSchema);