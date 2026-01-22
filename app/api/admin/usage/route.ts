/**
 * Admin Usage Analytics API
 * Provides aggregated usage statistics per user and provider
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth/clerk'
import { isAdmin } from '@/lib/auth/admin-check'

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId()

    // Check admin access
    const admin = await isAdmin(userId)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const searchParams = req.nextUrl.searchParams
    const _targetUserId = searchParams.get('user_id')
    const _from = searchParams.get('from')
    const _to = searchParams.get('to')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const _offset = (page - 1) * limit

    // TODO: Implement ai_usage_events table in schema
    // Table needs: id, user_id, model, prompt_tokens, completion_tokens, 
    // tool_calls, metadata (with cost_usd), created_at
    // Also need RPC functions:
    // - aggregate_usage_summary
    // - aggregate_user_stats
    // - aggregate_provider_stats
    // - aggregate_model_stats

    return NextResponse.json({
      summary: {
        totalCalls: 0,
        activeUsers: 0,
        totalCost: 0,
        totalTokens: 0,
        avgCostPerCall: 0,
        isPartialData: false,
      },
      userStats: [],
      providerStats: [],
      modelStats: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
      message: 'Usage analytics not yet implemented - ai_usage_events table and RPC functions missing'
    })
  } catch (error) {
    console.error('[Admin Usage API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}


