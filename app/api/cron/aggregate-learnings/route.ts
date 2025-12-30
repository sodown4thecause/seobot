import { getBestPractices } from '@/lib/ai/learning-storage';
import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/config/env';

export const runtime = 'edge';

/**
 * Cron endpoint for learning aggregation
 * 
 * Note: With the new Drizzle-based implementation, best practices
 * are calculated dynamically from content_learnings table.
 * This endpoint now just triggers a validation/warm-up of the queries.
 */
export async function GET(req: Request) {
  try {
    // Check for authorization (e.g., a secret key in headers)
    // In production, you should set CRON_SECRET environment variable
    const authHeader = req.headers.get('authorization');
    if (serverEnv.CRON_SECRET && authHeader !== `Bearer ${serverEnv.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('[Cron] Starting learning aggregation check...');
    
    // Aggregate for common content types
    const contentTypes = ['blog_post', 'article', 'social_media', 'landing_page'];
    
    // With Drizzle, best practices are computed dynamically
    // This just validates the queries work for each content type
    const results = await Promise.allSettled(
      contentTypes.map(async type => {
        const practices = await getBestPractices(type);
        return { type, practicesCount: practices.length };
      })
    );
    
    const summary = results.map((r, i) => ({
      type: contentTypes[i],
      status: r.status,
      count: r.status === 'fulfilled' ? (r.value as any).practicesCount : 0,
    }));
    
    console.log('[Cron] Learning aggregation check complete:', summary);
    
    return NextResponse.json({
      success: true,
      message: 'Validated getBestPractices queries; aggregation performed in SQL',
      results: summary,
    });
  } catch (error) {
    console.error('[Cron] Learning aggregation check failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
