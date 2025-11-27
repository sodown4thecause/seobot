import { NextRequest, NextResponse } from 'next/server';
import { getAllCacheStats, pruneAllCaches } from '@/lib/utils/cache';
import { getRateLimitStats } from '@/lib/redis/rate-limit';

export const runtime = 'edge';

/**
 * Admin endpoint to get system statistics
 * In production, this should be protected with admin authentication
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const isAdmin = await checkAdminAuth(request);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    const cacheStats = getAllCacheStats();
    const rateLimitStats = await getRateLimitStats();

    return NextResponse.json({
      success: true,
      data: {
        cache: cacheStats,
        rateLimit: rateLimitStats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

/**
 * Admin endpoint to trigger cache cleanup
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check

    const body = await request.json();
    const action = body.action;

    if (action === 'prune_caches') {
      const pruned = pruneAllCaches();
      return NextResponse.json({
        success: true,
        data: {
          action: 'prune_caches',
          pruned,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}
