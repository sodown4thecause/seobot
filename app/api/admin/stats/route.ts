import { NextRequest, NextResponse } from 'next/server';
import { getAllCacheStats, pruneAllCaches } from '@/lib/utils/cache';
import { getRateLimitStats } from '@/lib/redis/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth/admin-check';

/**
 * Admin endpoint to get system statistics
 * Protected with admin authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

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
 * Protected with admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

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
