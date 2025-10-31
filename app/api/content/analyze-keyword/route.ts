import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/config/env';
import { dataForSEOService } from '@/lib/api/dataforseo-service';

export const runtime = 'edge';

interface RequestBody {
  keyword: string;
  businessProfileId: string;
  location?: string;
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
    const { keyword, businessProfileId, location } = body;

    if (!keyword || !businessProfileId) {
      return NextResponse.json(
        { error: 'keyword and businessProfileId are required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id, target_locations')
      .eq('id', businessProfileId)
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Use provided location or first target location
    const targetLocation =
      location ||
      (profile.target_locations && profile.target_locations.length > 0
        ? profile.target_locations[0]
        : 'United States');

    // Get keyword data from DataForSEO
    const keywordResult = await dataForSEOService.keywordResearch([keyword], targetLocation);

    if (!keywordResult.success) {
      return NextResponse.json(
        { error: keywordResult.error.message },
        { status: keywordResult.error.statusCode || 500 }
      );
    }

    const keywordData = keywordResult.data[0];

    if (!keywordData) {
      return NextResponse.json(
        { error: 'No keyword data found' },
        { status: 404 }
      );
    }

    // Get SERP analysis for top competitors
    const serpResult = await dataForSEOService.serpAnalysis(keyword, targetLocation);

    const topCompetitors =
      serpResult.success
        ? serpResult.data.organicResults.slice(0, 3).map((result) => ({
            url: result.url.replace(/^https?:\/\/(www\.)?/, ''),
            position: result.position,
            title: result.title,
            // Estimate word count from description length
            wordCount: Math.round((result.description?.length || 500) * 3),
          }))
        : [];

    // Analyze content gaps (simplified - you'd want more sophisticated analysis)
    const contentGaps = [
      'Include latest statistics and data',
      'Add comparison tables for clarity',
      'Create actionable how-to sections',
      'Include expert quotes or case studies',
    ];

    // Determine recommended format based on search intent
    let recommendedFormat = 'Informational Guide';
    const keywordLower = keyword.toLowerCase();
    
    if (keywordLower.includes('best') || keywordLower.includes('top')) {
      recommendedFormat = 'Listicle + Comparison Guide';
    } else if (keywordLower.includes('how to') || keywordLower.includes('guide')) {
      recommendedFormat = 'Step-by-Step Tutorial';
    } else if (keywordLower.includes('vs') || keywordLower.includes('versus')) {
      recommendedFormat = 'Comparison Article';
    } else if (keywordLower.includes('review')) {
      recommendedFormat = 'Product Review + Buyer\'s Guide';
    }

    // Generate recommended title
    const currentYear = new Date().getFullYear();
    const titleKeyword = keyword
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const recommendedTitle = keywordLower.includes('best')
      ? `${titleKeyword} ${currentYear}: Complete Guide`
      : `${titleKeyword}: Everything You Need to Know (${currentYear})`;

    // Calculate estimated traffic (simplified formula)
    const estimatedTraffic = Math.round(keywordData.searchVolume * 0.2);

    const analysisData = {
      keyword: keywordData.keyword,
      volume: keywordData.searchVolume,
      difficulty: keywordData.difficulty,
      cpc: keywordData.cpc,
      competition: keywordData.competition,
      relatedKeywords: keywordData.relatedKeywords.slice(0, 5),
      recommendedFormat,
      recommendedTitle,
      topCompetitors,
      contentGaps,
      estimatedTraffic,
    };

    return NextResponse.json({
      success: true,
      data: analysisData,
    });
  } catch (error) {
    console.error('Keyword analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze keyword' },
      { status: 500 }
    );
  }
}
