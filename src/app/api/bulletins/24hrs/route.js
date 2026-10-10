// src/app/api/bulletins/24hrs/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import BulletinCache from '@/models/BulletinCache';

// Cron runs every 3 hours; if the bulletin is older than this, we flag it as "stale"
// (still shown to the user, just marked so the UI can optionally mention it)
const STALE_AFTER_MS = 4 * 60 * 60 * 1000; // 3hr schedule + 1hr grace for GitHub delays

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

        // Always fetch the NEWEST bulletin, regardless of its age.
        // The cron job deletes older ones when it creates a new bulletin,
        // and the 24hr TTL removes it automatically if the cron job stops completely.
        const latestBulletin = await BulletinCache.findOne({
            timeframe: '24hrs'
        }).sort({ generatedAt: -1 }); // newest first

        if (latestBulletin) {
            // Check how old the bulletin is (so we can tell the UI if the cron job is running late)
            const ageMs = Date.now() - new Date(latestBulletin.generatedAt).getTime();
            const isStale = ageMs > STALE_AFTER_MS;

            return NextResponse.json({
                success: true,
                bullets: latestBulletin.bullets,
                cachedAt: latestBulletin.generatedAt,
                fromCache: true,
                stale: isStale, // true when a new bulletin is overdue
                ...(isStale && { message: 'A new bulletin is being prepared. Showing the latest available one.' })
            });
        }

        // Only happens on a brand-new setup, or if no bulletin was generated for 24+ hours
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