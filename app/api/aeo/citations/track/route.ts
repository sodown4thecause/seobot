/**
 * AEO Citation Tracking API
 * 
 * POST /api/aeo/citations/track
 * - Add a new query to track for citations
 * - Body: { query, platforms?, checkFrequency? }
 * 
 * DELETE /api/aeo/citations/track
 * - Stop tracking a query
 * - Body: { query }
 * 
 * Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'edge'

interface TrackQueryRequest {
  query: string
  platforms?: string[]
  checkFrequency?: 'hourly' | 'daily' | 'weekly'
}

/**
 * POST handler - Start tracking a query
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
    const body: TrackQueryRequest = await req.json()
    const {
      query,
      platforms = ['perplexity'],
      checkFrequency = 'daily',
    } = body

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      )
    }

    console.log('[API] Start tracking query:', { userId, query, platforms, checkFrequency })

    // TODO: Insert into tracked_queries table in Supabase
    // TODO: Trigger initial citation check
    // TODO: Return tracked query record

    // Mock response
    const response = {
      success: true,
      data: {
        id: 'mock-id',
        query,
        platforms,
        checkFrequency,
        active: true,
        createdAt: new Date().toISOString(),
      },
      message: 'Query tracking started successfully',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[API] Error starting query tracking:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start tracking',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE handler - Stop tracking a query
 */
export async function DELETE(req: NextRequest) {
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
    const { query } = body

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      )
    }

    console.log('[API] Stop tracking query:', { userId, query })

    // TODO: Update tracked_queries table - set active = false
    // TODO: Return success

    const response = {
      success: true,
      message: 'Query tracking stopped successfully',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[API] Error stopping query tracking:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop tracking',
      },
      { status: 500 }
    )
  }
}

/**
 * GET handler - List all tracked queries for user
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

    console.log('[API] Fetching tracked queries for user:', userId)

    // TODO: Query tracked_queries table for user's active queries
    // TODO: Return list with last_checked_at timestamps

    // Mock response
    const response = {
      success: true,
      data: {
        queries: [
          {
            id: 'mock-1',
            query: 'best CRM software',
            platforms: ['perplexity', 'chatgpt'],
            checkFrequency: 'daily',
            lastCheckedAt: new Date().toISOString(),
            active: true,
          },
        ],
        total: 1,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[API] Error fetching tracked queries:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tracked queries',
      },
      { status: 500 }
    )
  }
}
