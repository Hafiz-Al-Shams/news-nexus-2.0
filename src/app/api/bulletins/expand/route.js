// src/app/api/bulletins/expand/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import BulletinCache from '@/models/BulletinCache';

export async function POST(request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized - Please login' },
                { status: 401 }
            );
        }

        await connectDB();

        const { bullets } = await request.json();

        if (!bullets || !Array.isArray(bullets) || bullets.length !== 12) {
            return NextResponse.json(
                { error: 'Invalid bullets - must be array of 12 strings' },
                { status: 400 }
            );
        }

        // GitHub Actions pre-generates detailed cards, so just fetch from cache
        let cachedBulletin = await BulletinCache.findOne({
            timeframe: '24hrs',
            'detailedCards.0': { $exists: true },
            expiresAt: { $gt: new Date() }
        });

        if (cachedBulletin && cachedBulletin.detailedCards.length > 0) {
            return NextResponse.json({
                success: true,
                cards: cachedBulletin.detailedCards,
                fromCache: true
            });
        }

        // Fallback: check expired cache
        cachedBulletin = await BulletinCache.findOne({
            timeframe: '24hrs',
            'detailedCards.0': { $exists: true }
        }).sort({ generatedAt: -1 });

        if (cachedBulletin && cachedBulletin.detailedCards.length > 0) {
            return NextResponse.json({
                success: true,
                cards: cachedBulletin.detailedCards,
                fromCache: true,
                stale: true,
                message: 'Showing previous details (new ones generating)'
            });
        }

        // No cache available
        return NextResponse.json({
            success: false,
            message: 'Detailed cards are being generated. Please try again shortly.',
        }, { status: 202 });

    } catch (error) {
        console.error('Bulletin expansion error:', error);
        return NextResponse.json(
            { error: 'Failed to expand bulletin', message: error.message },
            { status: 500 }
        );
    }
}

// Rate limiting removed - not needed since GitHub pre-generates everything
// No on-demand generation - GitHub Actions handles it