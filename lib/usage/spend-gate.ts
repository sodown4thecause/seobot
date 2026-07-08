/**
 * Pre-flight Spend Gate
 *
 * Soft monthly spend check executed before expensive fan-out calls.
 * Fails open on DB errors so transient issues never block users.
 */

import { db } from '@/lib/db'
import { apiUsageEvents, userUsageLimits } from '@/lib/db/schema'
import { and, eq, gte, lte, sql } from 'drizzle-orm'

export interface SpendGateResult {
  allowed: boolean
  reason?: string
  currentSpend?: number
  limit?: number
}

export async function checkSpendGate(
  userId: string,
  estimatedCostUsd: number,
): Promise<SpendGateResult> {
  try {
    const [limits] = await db
      .select({
        monthlyCreditLimitUsd: userUsageLimits.monthlyCreditLimitUsd,
        isUnlimited: userUsageLimits.isUnlimited,
        isPaused: userUsageLimits.isPaused,
      })
      .from(userUsageLimits)
      .where(eq(userUsageLimits.userId, userId))
      .limit(1)

    if (!limits) {
      return { allowed: true }
    }

    if (limits.isPaused) {
      return { allowed: false, reason: 'Account paused' }
    }

    if (limits.isUnlimited) {
      return { allowed: true }
    }

    const monthlyLimit = Number(limits.monthlyCreditLimitUsd)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [spend] = await db
      .select({ total: sql<number>`coalesce(sum(${apiUsageEvents.costUsd}), 0)` })
      .from(apiUsageEvents)
      .where(
        and(
          eq(apiUsageEvents.userId, userId),
          gte(apiUsageEvents.createdAt, startOfMonth),
          lte(apiUsageEvents.createdAt, endOfMonth),
        ),
      )

    const currentSpend = Number(spend?.total ?? 0)

    if (currentSpend + estimatedCostUsd > monthlyLimit) {
      return {
        allowed: false,
        reason: 'Monthly spend limit would be exceeded',
        currentSpend,
        limit: monthlyLimit,
      }
    }

    return { allowed: true, currentSpend, limit: monthlyLimit }
  } catch (error) {
    console.error('[Spend Gate] Error checking spend gate:', error)
    return { allowed: true }
  }
}