import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/config/env';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

interface RequestBody {
  keyword: string;
  businessProfileId: string;
  researchData?: {
    mainContent: string;
    citations: string[];
    stats: string;
    trends: string;
  };
  analysisData?: {
    recommendedFormat: string;
    recommendedTitle: string;
    topCompetitors: Array<{ url: string; position: number; wordCount: number }>;
    contentGaps: string[];
  };
  brandVoiceId?: string;
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
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body: RequestBody = await request.json();
    const {
      keyword,
      businessProfileId,
      researchData,
      analysisData,
      brandVoiceId,
    } = body;

    if (!keyword || !businessProfileId) {
      return new Response('keyword and businessProfileId are required', {
        status: 400,
      });
    }

    // Verify ownership
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id, business_name, industry, description')
      .eq('id', businessProfileId)
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response('Business profile not found', { status: 404 });
    }

    // Get brand voice if specified
    let brandVoice = null;
    if (brandVoiceId) {
      const { data: voice } = await supabase
        .from('brand_voices')
        .select('tone, style_attributes, example_phrases, guidelines')
        .eq('id', brandVoiceId)
        .eq('business_profile_id', businessProfileId)
        .single();

      brandVoice = voice;
    }

    // Build comprehensive prompt
    const systemPrompt = `You are an expert SEO content writer creating high-quality, engaging articles. 

Business Context:
- Company: ${profile.business_name}
- Industry: ${profile.industry}
- Description: ${profile.description || 'N/A'}

${brandVoice ? `Brand Voice:
- Tone: ${brandVoice.tone}
- Style: ${Array.isArray(brandVoice.style_attributes) ? brandVoice.style_attributes.join(', ') : 'N/A'}
- Guidelines: ${brandVoice.guidelines || 'N/A'}
` : ''}

${analysisData ? `Content Strategy:
- Format: ${analysisData.recommendedFormat}
- Suggested Title: ${analysisData.recommendedTitle}
- Top Competitors: ${analysisData.topCompetitors.map(c => `${c.url} (#${c.position}, ~${c.wordCount} words)`).join(', ')}
- Content Gaps to Address: ${analysisData.contentGaps.join(', ')}
` : ''}

${researchData ? `Research Insights:
${researchData.mainContent}

Latest Statistics:
${researchData.stats}

Current Trends:
${researchData.trends}

Citations: ${researchData.citations.join(', ')}
` : ''}

Task: Write a comprehensive, SEO-optimized article about "${keyword}".

Requirements:
1. Start with an engaging hook that addresses the reader's intent
2. Use proper heading hierarchy (H2, H3)
3. Include the target keyword naturally in the first 100 words
4. Add relevant statistics and data points (with [citation] placeholders)
5. Create clear, scannable sections with actionable insights
6. Include a comparison table if relevant
7. Add an FAQ section with 5-7 common questions
8. End with a strong conclusion and call-to-action
9. Aim for 1800-2500 words
10. Write in ${brandVoice?.tone || 'a professional, informative'} tone
11. Make it valuable, not just keyword-stuffed

Format the article in clean Markdown with proper structure.`;

    // Generate content using Gemini
    const genAI = new GoogleGenerativeAI(serverEnv.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const response = await model.generateContentStream(systemPrompt);

    // Create content record in database first
    const { data: contentRecord, error: contentError } = await supabase
      .from('content')
      .insert({
        business_profile_id: businessProfileId,
        title: analysisData?.recommendedTitle || `${keyword} - Article`,
        target_keyword: keyword,
        status: 'draft',
        word_count: 0,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (contentError) {
      console.error('Failed to create content record:', contentError);
    }

    // Convert to streaming response
    let fullCompletion = '';
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response.stream) {
            const text = chunk.text();
            fullCompletion += text;
            controller.enqueue(encoder.encode(text));
          }
          
          // Save completed content
          if (contentRecord) {
            const wordCount = fullCompletion.split(/\s+/).length;
            await supabase
              .from('content')
              .update({
                content: fullCompletion,
                word_count: wordCount,
                updated_at: new Date().toISOString(),
              })
              .eq('id', contentRecord.id);

            await supabase.from('content_versions').insert({
              content_id: contentRecord.id,
              version_number: 1,
              content: fullCompletion,
              word_count: wordCount,
              change_summary: 'Initial AI generation',
              created_at: new Date().toISOString(),
            });
          }
          
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream' }
    });
  } catch (error) {
    console.error('Content generation error:', error);
    return new Response('Failed to generate content', { status: 500 });
  }
}
