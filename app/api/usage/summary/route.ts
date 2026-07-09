/**
 * Current-user AI usage summary for dashboard widget
 */

import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db'
import { userUsageLimits } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { BETA_LIMITS } from '@/lib/config/beta-limits'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const userId = await requireUserId()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const [limits] = await db
      .select()
      .from(userUsageLimits)
      .where(eq(userUsageLimits.userId, userId))
      .limit(1)

    const limitUsd = limits?.isUnlimited
      ? null
      : Number(limits?.monthlyCreditLimitUsd ?? BETA_LIMITS.MAX_SPEND_USD)

    const usageResult = await db.execute(sql`
      SELECT
        COUNT(*)::int AS total_calls,
        COALESCE(SUM((metadata->>'cost_usd')::float), 0) AS total_cost,
        COALESCE(SUM(prompt_tokens + completion_tokens), 0)::int AS total_tokens,
        COALESCE(
          (
            SELECT agent_type
            FROM ai_usage_events e2
            WHERE e2.user_id = ${userId}
              AND e2.created_at >= ${startOfMonth.toISOString()}::timestamp
              AND e2.created_at <= ${endOfMonth.toISOString()}::timestamp
              AND e2.agent_type IS NOT NULL
            GROUP BY agent_type
            ORDER BY COUNT(*) DESC
            LIMIT 1
          ),
          'none'
        ) AS top_agent_type
      FROM ai_usage_events
      WHERE user_id = ${userId}
        AND created_at >= ${startOfMonth.toISOString()}::timestamp
        AND created_at <= ${endOfMonth.toISOString()}::timestamp
    `)

    const row = usageResult.rows[0] as {
      total_calls: number
      total_cost: number
      total_tokens: number
      top_agent_type: string
    }

    const currentSpendUsd = Number(row?.total_cost ?? 0)
    const remainingUsd = limitUsd === null ? null : Math.max(0, limitUsd - currentSpendUsd)

    return NextResponse.json({
      currentSpendUsd,
      limitUsd,
      remainingUsd,
      isUnlimited: limits?.isUnlimited ?? false,
      totalCalls: Number(row?.total_calls ?? 0),
      totalTokens: Number(row?.total_tokens ?? 0),
      topAgentType: row?.top_agent_type ?? 'none',
      resetDate: resetDate.toISOString(),
    })
  } catch (error) {
    console.error('[Usage Summary API] Error:', error)
    return NextResponse.json({ error: 'Failed to load usage summary' }, { status: 500 })
  }
}
