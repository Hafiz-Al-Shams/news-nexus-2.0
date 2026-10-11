// src/app/api/bulletins/expand/route.js
import { NextResponse } from 'next/server';
// CHANGED: removed getServerSession / authOptions imports, this route is now PUBLIC (no login needed)
import { connectDB } from '@/lib/mongodb';
import BulletinCache from '@/models/BulletinCache';

// Same staleness threshold as the 24hrs route (3hr cron schedule + 1hr grace)
const STALE_AFTER_MS = 4 * 60 * 60 * 1000;

export async function POST(request) {
    try {
        // CHANGED: the login check was removed. This route does NOT call Gemini,
        // it only reads the detailed cards the cron job already generated, so it is safe to keep public.

        await connectDB();

        const { bullets } = await request.json();

        if (!bullets || !Array.isArray(bullets) || bullets.length !== 12) {
            return NextResponse.json(
                { error: 'Invalid bullets - must be array of 12 strings' },
                { status: 400 }
            );
        }

        // Fetch the NEWEST bulletin that has detailed cards, regardless of its age
        // (GitHub Actions pre-generates the cards together with the bullets)
        const latestBulletin = await BulletinCache.findOne({
            timeframe: '24hrs',
            'detailedCards.0': { $exists: true } // must contain at least one card
        }).sort({ generatedAt: -1 }); // newest first

        if (latestBulletin && latestBulletin.detailedCards.length > 0) {
            const ageMs = Date.now() - new Date(latestBulletin.generatedAt).getTime();
            const isStale = ageMs > STALE_AFTER_MS;

            return NextResponse.json({
                success: true,
                cards: latestBulletin.detailedCards,
                fromCache: true,
                stale: isStale, // true when a new bulletin is overdue
                ...(isStale && { message: 'Showing the latest available details (new ones are being prepared)' })
            });
        }

        // No bulletin exists at all
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