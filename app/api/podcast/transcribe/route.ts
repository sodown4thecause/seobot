import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  transcribeAndOptimizePodcast,
  generateBlogPostFromPodcast,
  generateSocialMediaCalendar
} from '@/lib/podcast/podcast-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
      case 'transcribe':
        result = await transcribeAndOptimizePodcast({
          audioUrl: data.audioUrl,
          podcastTitle: data.podcastTitle,
          podcastDescription: data.podcastDescription,
          episodeNumber: data.episodeNumber,
          targetKeywords: data.targetKeywords,
          userId: user.id
        })
        break

      case 'generate_blog_post':
        result = await generateBlogPostFromPodcast({
          podcastId: data.podcastId,
          targetAudience: data.targetAudience,
          tone: data.tone,
          includeQuotes: data.includeQuotes
        })
        break

      case 'generate_social_calendar':
        result = await generateSocialMediaCalendar({
          podcastId: data.podcastId,
          platforms: data.platforms,
          duration: data.duration,
          postsPerDay: data.postsPerDay
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
    console.error('Podcast transcription API error:', error)
    
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

    // Get user's podcast transcriptions
    const { data: transcriptions, error } = await supabase
      .from('podcast_transcriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ success: true, data: transcriptions })

  } catch (error) {
    console.error('Podcast transcription fetch API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
