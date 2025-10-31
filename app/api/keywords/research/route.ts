import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { keywordResearch } from '@/lib/api/dataforseo-service'
import { rateLimitMiddleware } from '@/lib/redis/rate-limit'

export const runtime = 'edge'

interface RequestBody {
  keywords: string[]
  domain?: string
  location?: number
}

export async function POST(req: Request) {
  // Check rate limit
  const rateLimitResponse = await rateLimitMiddleware(req as any, 'KEYWORDS')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = (await req.json()) as RequestBody
    const { keywords, location } = body
    
    if (!keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords array is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get keyword data from DataForSEO
    const result = await keywordResearch({
      keywords,
      location_code: location,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.statusCode }
      )
    }

    const keywordData = result.data.tasks[0]?.result || []
    
    // Save keywords to database
    const keywordsToInsert = keywordData
      .filter(item => item.keyword_data)
      .map(item => ({
        user_id: user.id,
        keyword: item.keyword_data.keyword,
        search_volume: item.keyword_data.search_volume || 0,
        keyword_difficulty: item.keyword_data.keyword_difficulty || 0,
        priority: getPriority(
          item.keyword_data.search_volume,
          item.keyword_data.keyword_difficulty
        ),
        status: 'opportunity' as const,
        metadata: {
          cpc: item.keyword_data.cpc,
          competition: item.keyword_data.competition,
        },
      }))

    if (keywordsToInsert.length > 0) {
      await supabase.from('keywords').upsert(keywordsToInsert)
    }

    return NextResponse.json({
      keywords: keywordsToInsert,
      total: keywordsToInsert.length,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Keyword research error:', err)
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

function getPriority(volume: number, difficulty: number): string {
  // High volume, low difficulty = high priority
  if (volume > 1000 && difficulty < 40) return 'high'
  if (volume > 500 && difficulty < 60) return 'medium'
  return 'low'
}
