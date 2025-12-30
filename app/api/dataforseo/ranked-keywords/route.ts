import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth/clerk'
import { analyzeRankedKeywords, compareKeywordProfiles } from '@/lib/services/dataforseo/ranked-keywords-analysis'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    // Authentication
    await requireUserId()

    const body = await request.json()
    const { 
      domain, 
      competitors = [], 
      location_name = 'United States',
      language_code = 'en',
      limit = 1000,
      includeSubdomains = false,
      action = 'analyze',
      options = {}
    } = body

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }

    // Clean domain input
    const cleanTarget = domain.replace(/^https?:\/\//, '').replace(/^www\./, '')

    if (action === 'compare' && competitors.length > 0) {
      // Compare with competitors
      const cleanCompetitors = competitors.map((comp: string) => 
        comp.replace(/^https?:\/\//, '').replace(/^www\./, '')
      )

      const result = await compareKeywordProfiles(
        cleanTarget,
        cleanCompetitors,
        {
          location_name,
          language_code,
          limit,
          includeSubdomains,
        }
      )

      if (!result.success) {
        return NextResponse.json(
          { error: result.error?.message || 'Analysis failed' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        type: 'comparison',
      })
    } else {
      // Single domain analysis
      const result = await analyzeRankedKeywords({
        target: cleanTarget,
        location_name,
        language_code,
        limit: options.limit || limit,
        includeSubdomains,
      })

      if (!result.success) {
        return NextResponse.json(
          { error: result.error?.message || 'Analysis failed' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        type: 'analysis',
      })
    }
  } catch (error: any) {
    console.error('Ranked keywords API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}