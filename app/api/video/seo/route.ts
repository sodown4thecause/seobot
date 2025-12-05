import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  analyzeVideoSEO,
  generateTitleSuggestions,
  generateDescriptionOptimization,
  generateOptimalTags
} from '@/lib/video/video-seo-service'
import { serverEnv, clientEnv } from '@/lib/config/env'

const supabase = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    // Verify user is authenticated
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    let result

    switch (action) {
      case 'analyze':
        result = await analyzeVideoSEO({
          videoUrl: data.videoUrl,
          targetKeywords: data.targetKeywords,
          userId: user.id,
          transcript: data.transcript
        })
        break

      case 'generate_titles':
        result = await generateTitleSuggestions({
          currentTitle: data.currentTitle,
          targetKeywords: data.targetKeywords,
          videoTopic: data.videoTopic,
          audience: data.audience
        })
        break

      case 'optimize_description':
        result = await generateDescriptionOptimization({
          currentDescription: data.currentDescription,
          targetKeywords: data.targetKeywords,
          videoTitle: data.videoTitle,
          callToAction: data.callToAction
        })
        break

      case 'generate_tags':
        result = await generateOptimalTags({
          videoTitle: data.videoTitle,
          videoDescription: data.videoDescription,
          targetKeywords: data.targetKeywords,
          competitorTags: data.competitorTags
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('Video SEO API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Verify user is authenticated
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Get user's video SEO analyses
    const { data: analyses, error } = await supabase
      .from('video_seo_analysis')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ success: true, data: analyses })

  } catch (error) {
    console.error('Video SEO fetch API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
