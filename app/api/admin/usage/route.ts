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

    // Get summary with proper aggregation
    const summaryQuery = supabase
      .from('ai_usage_events')
      .select('user_id, metadata, prompt_tokens, completion_tokens', { count: 'exact' })

    if (userId) {
      summaryQuery.eq('user_id', userId)
    }
    if (from) {
      summaryQuery.gte('created_at', from)
    }
    if (to) {
      summaryQuery.lte('created_at', to)
    }

    const { data: allEvents, count } = await summaryQuery

    // Aggregate summary
    const uniqueUsers = new Set(allEvents?.map(e => e.user_id).filter(Boolean))
    const summary = {
      totalCalls: count || 0,
      activeUsers: uniqueUsers.size,
      totalCost: allEvents?.reduce((sum, e) => sum + (Number(e.metadata?.cost_usd) || 0), 0) || 0,
      totalTokens: allEvents?.reduce((sum, e) => sum + (e.prompt_tokens || 0) + (e.completion_tokens || 0), 0) || 0,
      avgCostPerCall: count ? (allEvents?.reduce((sum, e) => sum + (Number(e.metadata?.cost_usd) || 0), 0) || 0) / count : 0,
    }

    // Aggregate per-user stats from all events (not just paginated)
    const userStatsMap = new Map<string, any>()
    allEvents?.forEach(event => {
      if (!event.user_id) return
      
      const existing = userStatsMap.get(event.user_id) || {
        user_id: event.user_id,
        call_count: 0,
        total_cost: 0,
        total_tokens: 0,
        total_tool_calls: 0,
        provider_breakdown: {} as Record<string, any>,
      }

      existing.call_count++
      existing.total_cost += Number(event.metadata?.cost_usd) || 0
      existing.total_tokens += (event.prompt_tokens || 0) + (event.completion_tokens || 0)
      // Note: tool_calls not in summary query, will be 0

      const provider = event.metadata?.provider || 'unknown'
      if (!existing.provider_breakdown[provider]) {
        existing.provider_breakdown[provider] = { cost: 0, calls: 0 }
      }
      existing.provider_breakdown[provider].cost += Number(event.metadata?.cost_usd) || 0
      existing.provider_breakdown[provider].calls++

      userStatsMap.set(event.user_id, existing)
    })

    const userStats = Array.from(userStatsMap.values())
      .sort((a, b) => b.total_cost - a.total_cost)
      .slice(offset, offset + limit)

    // Aggregate provider stats from all events
    const providerStatsMap = new Map<string, any>()
    allEvents?.forEach(event => {
      const provider = event.metadata?.provider || 'unknown'
      const existing = providerStatsMap.get(provider) || {
        provider,
        call_count: 0,
        total_cost: 0,
        total_tokens: 0,
      }

      existing.call_count++
      existing.total_cost += Number(event.metadata?.cost_usd) || 0
      existing.total_tokens += (event.prompt_tokens || 0) + (event.completion_tokens || 0)

      providerStatsMap.set(provider, existing)
    })

    const providerStats = Array.from(providerStatsMap.values())
      .sort((a, b) => b.total_cost - a.total_cost)

    // Aggregate model stats from all events
    const modelStatsMap = new Map<string, any>()
    allEvents?.forEach(event => {
      const model = event.model || 'unknown'
      const existing = modelStatsMap.get(model) || {
        model,
        call_count: 0,
        total_cost: 0,
        total_prompt_tokens: 0,
        total_completion_tokens: 0,
      }

      existing.call_count++
      existing.total_cost += Number(event.metadata?.cost_usd) || 0
      existing.total_prompt_tokens += event.prompt_tokens || 0
      existing.total_completion_tokens += event.completion_tokens || 0

      modelStatsMap.set(model, existing)
    })

    const modelStats = Array.from(modelStatsMap.values())
      .sort((a, b) => b.total_cost - a.total_cost)
      .slice(0, 20)

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

