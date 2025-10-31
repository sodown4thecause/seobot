import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/config/env';

export const runtime = 'edge';

interface RequestBody {
  contentId?: string;
  businessProfileId: string;
  title: string;
  content: string;
  targetKeyword: string;
  status: 'draft' | 'published' | 'scheduled';
  scheduledFor?: string;
  metadata?: {
    seoScore?: number;
    readabilityScore?: number;
    keywordDensity?: number;
  };
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
    const {
      contentId,
      businessProfileId,
      title,
      content,
      targetKeyword,
      status,
      scheduledFor,
      metadata,
    } = body;

    if (!businessProfileId || !title || !content || !targetKeyword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    const wordCount = content.split(/\s+/).length;
    const now = new Date().toISOString();

    if (contentId) {
      // Update existing content
      const { data: existingContent, error: fetchError } = await supabase
        .from('content')
        .select('id, content')
        .eq('id', contentId)
        .eq('business_profile_id', businessProfileId)
        .single();

      if (fetchError || !existingContent) {
        return NextResponse.json(
          { error: 'Content not found' },
          { status: 404 }
        );
      }

      // Update content
      const { error: updateError } = await supabase
        .from('content')
        .update({
          title,
          content,
          target_keyword: targetKeyword,
          status,
          scheduled_for: scheduledFor || null,
          word_count: wordCount,
          seo_score: metadata?.seoScore,
          readability_score: metadata?.readabilityScore,
          updated_at: now,
        })
        .eq('id', contentId);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update content' },
          { status: 500 }
        );
      }

      // Create new version if content changed
      if (existingContent.content !== content) {
        const { data: versions } = await supabase
          .from('content_versions')
          .select('version_number')
          .eq('content_id', contentId)
          .order('version_number', { ascending: false })
          .limit(1);

        const nextVersion = versions && versions.length > 0 
          ? versions[0].version_number + 1 
          : 1;

        await supabase.from('content_versions').insert({
          content_id: contentId,
          version_number: nextVersion,
          content,
          word_count: wordCount,
          change_summary: 'Manual edit',
          created_at: now,
        });
      }

      return NextResponse.json({
        success: true,
        data: { contentId, status: 'updated' },
      });
    } else {
      // Create new content
      const { data: newContent, error: insertError } = await supabase
        .from('content')
        .insert({
          business_profile_id: businessProfileId,
          title,
          content,
          target_keyword: targetKeyword,
          status,
          scheduled_for: scheduledFor || null,
          word_count: wordCount,
          seo_score: metadata?.seoScore,
          readability_score: metadata?.readabilityScore,
          created_at: now,
          updated_at: now,
        })
        .select('id')
        .single();

      if (insertError || !newContent) {
        return NextResponse.json(
          { error: 'Failed to create content' },
          { status: 500 }
        );
      }

      // Create initial version
      await supabase.from('content_versions').insert({
        content_id: newContent.id,
        version_number: 1,
        content,
        word_count: wordCount,
        change_summary: 'Initial creation',
        created_at: now,
      });

      return NextResponse.json({
        success: true,
        data: { contentId: newContent.id, status: 'created' },
      });
    }
  } catch (error) {
    console.error('Content save error:', error);
    return NextResponse.json(
      { error: 'Failed to save content' },
      { status: 500 }
    );
  }
}
