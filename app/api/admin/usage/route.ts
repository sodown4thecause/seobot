/**
 * Admin Usage Analytics API
 * Provides aggregated usage statistics per user and provider
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Import admin check utility
import { isAdmin as checkAdmin } from '@/lib/auth/admin-check'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    const admin = await checkAdmin(user.id)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get('user_id')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query filters for fetching all events (for aggregation)
    let query = supabase
      .from('ai_usage_events')
      .select('*', { count: 'exact' })

    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (from) {
      query = query.gte('created_at', from)
    }
    if (to) {
      query = query.lte('created_at', to)
    }

    // Get total count for pagination
    const { count: totalCount } = await query

    // Get paginated events
    const { data: events, error: eventsError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (eventsError) {
      console.error('[Admin Usage API] Error fetching events:', eventsError)
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 })
    }

    // Build base query for aggregations
    let baseQuery = supabase.from('ai_usage_events')
    if (userId) baseQuery = baseQuery.eq('user_id', userId)
    if (from) baseQuery = baseQuery.gte('created_at', from)
    if (to) baseQuery = baseQuery.lte('created_at', to)

    // Get total count (database-level)
    const { count: totalCalls } = await baseQuery.select('*', { count: 'exact', head: true })

    // Get unique user count (database-level via distinct)
    const { count: activeUsers } = await baseQuery.select('user_id', { count: 'exact', head: true })

    // Use RPC functions for database-level aggregation (if available)
    // Otherwise fallback to limited queries
    const { data: summaryData, error: summaryError } = await supabase.rpc('aggregate_usage_summary', {
      p_user_id: userId || null,
      p_from: from || null,
      p_to: to || null
    }).single().catch(() => ({ data: null, error: true }))

    let summary
    if (summaryError || !summaryData) {
      // Fallback: Fetch only aggregated fields with limit to prevent memory issues
      const { data: aggData } = await baseQuery
        .select('metadata, prompt_tokens, completion_tokens')
        .limit(5000) // Reasonable limit for aggregation
      
      const totalCost = aggData?.reduce((sum, e) => sum + (Number(e.metadata?.cost_usd) || 0), 0) || 0
      const totalTokens = aggData?.reduce((sum, e) => sum + (e.prompt_tokens || 0) + (e.completion_tokens || 0), 0) || 0
      summary = {
        totalCalls: totalCalls || 0,
        activeUsers: activeUsers || 0,
        totalCost,
        totalTokens,
        avgCostPerCall: totalCalls ? totalCost / totalCalls : 0,
      }
    } else {
      summary = summaryData
    }

    // Use RPC for user stats (database aggregation)
    // Note: RPC functions should be created in database for optimal performance
    const { data: userStatsData, error: userStatsError } = await supabase.rpc('aggregate_user_stats', {
      p_user_id: userId || null,
      p_from: from || null,
      p_to: to || null,
      p_limit: limit,
      p_offset: offset
    })
    const userStats = userStatsError ? [] : (userStatsData || [])

    // Use RPC for provider stats (database aggregation)
    const { data: providerStatsData, error: providerStatsError } = await supabase.rpc('aggregate_provider_stats', {
      p_user_id: userId || null,
      p_from: from || null,
      p_to: to || null
    })
    const providerStats = providerStatsError ? [] : (providerStatsData || [])

    // Use RPC for model stats (database aggregation)
    const { data: modelStatsData, error: modelStatsError } = await supabase.rpc('aggregate_model_stats', {
      p_user_id: userId || null,
      p_from: from || null,
      p_to: to || null,
      p_limit: 20
    })
    const modelStats = modelStatsError ? [] : (modelStatsData || [])

    return NextResponse.json({
      summary,
      userStats,
      providerStats,
      modelStats,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    })
  } catch (error) {
    console.error('[Admin Usage API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

