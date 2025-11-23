import { aggregateBestPractices } from '@/lib/ai/learning-storage';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    // Check for authorization (e.g., a secret key in headers)
    // In production, you should set CRON_SECRET environment variable
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('[Cron] Starting learning aggregation...');
    
    // Aggregate for common content types
    const contentTypes = ['blog_post', 'article', 'social_media', 'landing_page'];
    
    const results = await Promise.allSettled(
      contentTypes.map(type => aggregateBestPractices(type))
    );
    
    const summary = results.map((r, i) => ({
      type: contentTypes[i],
      status: r.status,
    }));
    
    console.log('[Cron] Learning aggregation complete:', summary);
    
    return NextResponse.json({
      success: true,
      message: 'Learning aggregation complete',
      results: summary,
    });
  } catch (error) {
    console.error('[Cron] Learning aggregation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}












