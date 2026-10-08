// src/app/api/bulletins/24hrs/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import BulletinCache from '@/models/BulletinCache';

export async function GET(request) {
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

        // Try to get valid (non-expired) cache
        let cachedBulletin = await BulletinCache.findOne({
            timeframe: '24hrs',
            expiresAt: { $gt: new Date() }
        }).sort({ generatedAt: -1 });

        if (cachedBulletin) {
            return NextResponse.json({
                success: true,
                bullets: cachedBulletin.bullets,
                cachedAt: cachedBulletin.generatedAt,
                fromCache: true
            });
        }

        // Fallback: Try to get ANY cache (even expired)
        cachedBulletin = await BulletinCache.findOne({
            timeframe: '24hrs'
        }).sort({ generatedAt: -1 });

        if (cachedBulletin) {
            return NextResponse.json({
                success: true,
                bullets: cachedBulletin.bullets,
                cachedAt: cachedBulletin.generatedAt,
                fromCache: true,
                stale: true,
                message: 'Showing previous bulletin (new one generating)'
            });
        }

        // No cache exists at all
        return NextResponse.json({
            success: false,
            message: 'Bulletin is being generated. Please check back in a few minutes.',
            generating: true
        }, { status: 202 });

    } catch (error) {
        console.error('Bulletin fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bulletin', message: error.message },
            { status: 500 }
        );
    }
}

// POST endpoint removed - GitHub Actions generates directly to DB
// No CRON_SECRET needed anymore
