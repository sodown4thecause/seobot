/**
 * AEO Citations API
 * 
 * GET /api/aeo/citations
 * - Fetch user's citation data
 * - Query params: platform, days, limit
 * 
 * Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'edge'

interface CitationRecord {
  id: string
  query: string
  platform: string
  cited: boolean
  citationText?: string
  citationPosition?: number
  citationUrl?: string
  competitorUrls: string[]
  trackedAt: string
}

interface CitationsResponse {
  success: boolean
  data?: {
    citations: CitationRecord[]
    summary: {
      totalQueries: number
      citationCount: number
      citationRate: number
      platformBreakdown: Record<string, { cited: number; total: number }>
    }
  }
  error?: string
}

/**
 * GET handler - Fetch user's citations
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const platform = searchParams.get('platform') // Filter by platform
    const days = parseInt(searchParams.get('days') || '30')
    const limit = parseInt(searchParams.get('limit') || '100')

    // TODO: Query Supabase for citation data
    // For now, return mock data structure
    console.log('[API] Fetching citations for user:', userId)
    console.log('[API] Filters - platform:', platform, 'days:', days, 'limit:', limit)

    // Mock response - will be replaced with actual database query
    const mockCitations: CitationRecord[] = [
      {
        id: '1',
        query: 'best CRM software',
        platform: 'perplexity',
        cited: true,
        citationText: 'According to FlowIntent...',
        citationPosition: 2,
        citationUrl: 'https://example.com/best-crm',
        competitorUrls: ['https://competitor1.com/crm-guide'],
        trackedAt: new Date().toISOString(),
      },
    ]

    const response: CitationsResponse = {
      success: true,
      data: {
        citations: mockCitations,
        summary: {
          totalQueries: 1,
          citationCount: 1,
          citationRate: 100,
          platformBreakdown: {
            perplexity: { cited: 1, total: 1 },
            chatgpt: { cited: 0, total: 0 },
            claude: { cited: 0, total: 0 },
            gemini: { cited: 0, total: 0 },
            google_ai_overview: { cited: 0, total: 0 },
          },
        },
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[API] Error fetching citations:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch citations',
      },
      { status: 500 }
    )
  }
}

/**
 * POST handler - Manually trigger citation check for a query
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await req.json()
    const { query, platform, userDomain } = body

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      )
    }

    console.log('[API] Manual citation check:', { userId, query, platform })

    // TODO: Trigger citation check using citation-monitor service
    // TODO: Save results to database
    // TODO: Return results

    // Mock response for now
    const response = {
      success: true,
      data: {
        query,
        platform: platform || 'perplexity',
        cited: false,
        competitorUrls: [],
        checkedAt: new Date().toISOString(),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[API] Error checking citation:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check citation',
      },
      { status: 500 }
    )
  }
}
