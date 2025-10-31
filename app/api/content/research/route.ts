import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/config/env';
import { perplexityService } from '@/lib/api/perplexity-service';

export const runtime = 'edge';

interface RequestBody {
  keyword: string;
  businessProfileId: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      serverEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get auth user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { keyword, businessProfileId } = body;

    if (!keyword || !businessProfileId) {
      return NextResponse.json(
        { error: 'keyword and businessProfileId are required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('id', businessProfileId)
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Research topic using Perplexity
    const researchResult = await perplexityService.researchTopic(
      keyword,
      `Provide comprehensive research about "${keyword}". Include:
1. Latest statistics and data (with years)
2. Current trends and developments
3. Expert insights and common misconceptions
4. Practical examples and use cases
5. Key facts that would make great content`
    );

    if (!researchResult.success) {
      return NextResponse.json(
        { error: researchResult.error.message },
        { status: researchResult.error.statusCode || 500 }
      );
    }

    const research = researchResult.data;

    // Get latest stats as separate call
    const statsResult = await perplexityService.fetchLatestStats(keyword);
    const stats = statsResult.success ? statsResult.data : null;

    // Get trend analysis
    const trendsResult = await perplexityService.analyzeTrends(keyword);
    const trends = trendsResult.success ? trendsResult.data : null;

    // Combine research data
    const combinedResearch = {
      keyword,
      mainContent: research.content,
      citations: research.citations,
      stats: stats?.content || '',
      trends: trends?.content || '',
      researchedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: combinedResearch,
    });
  } catch (error) {
    console.error('Content research error:', error);
    return NextResponse.json(
      { error: 'Failed to research topic' },
      { status: 500 }
    );
  }
}
