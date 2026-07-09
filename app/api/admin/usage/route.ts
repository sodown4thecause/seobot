/**
 * Admin Usage Analytics API
 * Aggregated AI usage statistics from ai_usage_events
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { requireUserId } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/admin-check'
import { db } from '@/lib/db'

function parseDateRange(from: string | null, to: string | null) {
  const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const toDate = to ? new Date(to) : new Date()
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) throw new Error('Invalid date range')
  return { fromDate, toDate }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId()

    const admin = await isAdmin(userId)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const searchParams = req.nextUrl.searchParams
    const targetUserId = searchParams.get('user_id')
    const rawPage = parseInt(searchParams.get('page') || '1', 10)
    const page = Number.isNaN(rawPage) ? 1 : Math.max(1, rawPage)
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10)
    const limit = Number.isNaN(rawLimit) ? 50 : Math.min(100, Math.max(1, rawLimit))
    const offset = (page - 1) * limit
    const { fromDate, toDate } = parseDateRange(
      searchParams.get('from'),
      searchParams.get('to')
    )

    const summaryResult = await db.execute(sql`
      SELECT
        COUNT(*)::int AS total_calls,
        COUNT(DISTINCT user_id)::int AS active_users,
        COALESCE(SUM((metadata->>'cost_usd')::float), 0) AS total_cost,
        COALESCE(SUM(prompt_tokens + completion_tokens), 0)::int AS total_tokens
      FROM ai_usage_events
      WHERE created_at >= ${fromDate.toISOString()}::timestamp
        AND created_at <= ${toDate.toISOString()}::timestamp
        ${targetUserId ? sql`AND user_id = ${targetUserId}` : sql``}
    `)

    const summaryRow = summaryResult.rows[0] as {
      total_calls: number
      active_users: number
      total_cost: number
      total_tokens: number
    }

    const totalCalls = Number(summaryRow?.total_calls ?? 0)
    const totalCost = Number(summaryRow?.total_cost ?? 0)

    const userStatsResult = await db.execute(sql`
      SELECT
        user_id,
        COUNT(*)::int AS call_count,
        COALESCE(SUM((metadata->>'cost_usd')::float), 0) AS total_cost,
        COALESCE(SUM(prompt_tokens + completion_tokens), 0)::int AS total_tokens
      FROM ai_usage_events
      WHERE created_at >= ${fromDate.toISOString()}::timestamp
        AND created_at <= ${toDate.toISOString()}::timestamp
        ${targetUserId ? sql`AND user_id = ${targetUserId}` : sql``}
      GROUP BY user_id
      ORDER BY total_cost DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const providerStatsResult = await db.execute(sql`
      SELECT
        COALESCE(metadata->>'provider', 'unknown') AS provider,
        COUNT(*)::int AS call_count,
        COALESCE(SUM((metadata->>'cost_usd')::float), 0) AS total_cost
      FROM ai_usage_events
      WHERE created_at >= ${fromDate.toISOString()}::timestamp
        AND created_at <= ${toDate.toISOString()}::timestamp
        ${targetUserId ? sql`AND user_id = ${targetUserId}` : sql``}
      GROUP BY metadata->>'provider'
      ORDER BY total_cost DESC
    `)

    const modelStatsResult = await db.execute(sql`
      SELECT
        model,
        COUNT(*)::int AS call_count,
        COALESCE(SUM((metadata->>'cost_usd')::float), 0) AS total_cost
      FROM ai_usage_events
      WHERE created_at >= ${fromDate.toISOString()}::timestamp
        AND created_at <= ${toDate.toISOString()}::timestamp
        ${targetUserId ? sql`AND user_id = ${targetUserId}` : sql``}
      GROUP BY model
      ORDER BY total_cost DESC
      LIMIT 20
    `)

    const agentStatsResult = await db.execute(sql`
      SELECT
        COALESCE(agent_type, 'unknown') AS agent_type,
        COUNT(*)::int AS call_count,
        COALESCE(SUM((metadata->>'cost_usd')::float), 0) AS total_cost
      FROM ai_usage_events
      WHERE created_at >= ${fromDate.toISOString()}::timestamp
        AND created_at <= ${toDate.toISOString()}::timestamp
        ${targetUserId ? sql`AND user_id = ${targetUserId}` : sql``}
      GROUP BY agent_type
      ORDER BY total_cost DESC
    `)

    const totalUsersResult = await db.execute(sql`
      SELECT COUNT(DISTINCT user_id)::int AS total_users
      FROM ai_usage_events
      WHERE created_at >= ${fromDate.toISOString()}::timestamp
        AND created_at <= ${toDate.toISOString()}::timestamp
        ${targetUserId ? sql`AND user_id = ${targetUserId}` : sql``}
    `)

    const totalUsers = Number((totalUsersResult.rows[0] as { total_users: number })?.total_users ?? 0)

    return NextResponse.json({
      summary: {
        totalCalls,
        activeUsers: Number(summaryRow?.active_users ?? 0),
        totalCost,
        totalTokens: Number(summaryRow?.total_tokens ?? 0),
        avgCostPerCall: totalCalls > 0 ? totalCost / totalCalls : 0,
        isPartialData: false,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      userStats: userStatsResult.rows,
      providerStats: providerStatsResult.rows,
      modelStats: modelStatsResult.rows,
      agentStats: agentStatsResult.rows,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
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
