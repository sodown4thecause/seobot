/**
 * Credit Limit Checker
 * Enforces monthly credit limits for beta users
 * 
 * Migrated from Supabase to Drizzle ORM with Neon
 */

import { db } from '@/lib/db'
import { userUsageLimits, type Json } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { BETA_LIMITS } from '@/lib/config/beta-limits'
import { getClientIp, blockIp } from '@/lib/auth/ip-block-check'
import { NextRequest } from 'next/server'

export interface LimitCheckResult {
  allowed: boolean
  remainingUsd: number
  currentSpendUsd: number
  limitUsd: number
  reason?: string
  resetDate?: Date
  isPaused?: boolean
  pauseUntil?: Date
}

/**
 * Check if user has remaining credits for the current month
 * Includes beta mode pause functionality
 */
export async function checkCreditLimit(
  userId: string | null | undefined,
  req?: NextRequest
): Promise<LimitCheckResult> {
  if (!userId) {
    // No user ID - allow (for public endpoints, but log with null user_id)
    return {
      allowed: true,
      remainingUsd: Infinity,
      currentSpendUsd: 0,
      limitUsd: Infinity,
    }
  }

  try {
    // Get user's credit limit and pause status
    const [limits] = await db
      .select()
      .from(userUsageLimits)
      .where(eq(userUsageLimits.userId, userId))
      .limit(1)

    // If no limits record exists, create one with default $1 for beta
    let monthlyLimit: number = BETA_LIMITS.MAX_SPEND_USD
    let isUnlimited = false
    let isPaused = false
    let pauseUntil: Date | undefined
    let pauseReason: string | undefined

    if (!limits) {
      // No record exists - create default with beta limit
      const [newLimit] = await db
        .insert(userUsageLimits)
        .values({
          userId,
          monthlyCreditLimitUsd: BETA_LIMITS.MAX_SPEND_USD,
          isUnlimited: false,
          isPaused: false,
        })
        .returning()

      if (newLimit) {
        monthlyLimit = Number(newLimit.monthlyCreditLimitUsd)
        isUnlimited = newLimit.isUnlimited
        isPaused = newLimit.isPaused || false
        pauseUntil = newLimit.pauseUntil ? new Date(newLimit.pauseUntil) : undefined
        pauseReason = newLimit.pauseReason || undefined
      }
    } else {
      monthlyLimit = Number(limits.monthlyCreditLimitUsd)
      isUnlimited = limits.isUnlimited
      isPaused = limits.isPaused || false
      pauseUntil = limits.pauseUntil ? new Date(limits.pauseUntil) : undefined
      pauseReason = limits.pauseReason || undefined
    }

    // Check if pause has expired
    if (isPaused && pauseUntil) {
      const now = new Date()
      if (now >= pauseUntil) {
        // Pause expired, clear it
        await db
          .update(userUsageLimits)
          .set({
            isPaused: false,
            pauseUntil: null,
            pauseReason: null,
            updatedAt: new Date(),
          })
          .where(eq(userUsageLimits.userId, userId))
        isPaused = false
        pauseUntil = undefined
        pauseReason = undefined
      } else {
        // Still paused
        return {
          allowed: false,
          remainingUsd: 0,
          currentSpendUsd: 0,
          limitUsd: monthlyLimit,
          reason: pauseReason || BETA_LIMITS.UPGRADE_MESSAGE,
          isPaused: true,
          pauseUntil,
        }
      }
    }

    // If unlimited, allow everything
    if (isUnlimited) {
      return {
        allowed: true,
        remainingUsd: Infinity,
        currentSpendUsd: 0,
        limitUsd: monthlyLimit,
        isPaused: false,
      }
    }

    // Calculate current month spend
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Sum costs from ai_usage_events for current month using raw SQL for JSONB access
    const result = await db.execute(sql`
      SELECT COALESCE(SUM((metadata->>'cost_usd')::float), 0) as total_cost
      FROM ai_usage_events
      WHERE user_id = ${userId}
        AND created_at >= ${startOfMonth.toISOString()}::timestamp
        AND created_at <= ${endOfMonth.toISOString()}::timestamp
    `)

    const currentSpend = Number((result.rows[0] as any)?.total_cost || 0)
    const remaining = monthlyLimit - currentSpend
    const allowed = remaining > 0

    // If limit exceeded and not already paused, pause the account
    if (!allowed && !isPaused && req) {
      await pauseUserAccount(userId, req)
      // Update local state to reflect pause
      isPaused = true
      pauseUntil = new Date(now.getTime() + BETA_LIMITS.PAUSE_DURATION_DAYS * 24 * 60 * 60 * 1000)
      pauseReason = BETA_LIMITS.UPGRADE_MESSAGE
    }

    // Calculate reset date (first day of next month)
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    return {
      allowed,
      remainingUsd: Math.max(0, remaining),
      currentSpendUsd: currentSpend,
      limitUsd: monthlyLimit,
      reason: allowed ? undefined : (pauseReason || BETA_LIMITS.UPGRADE_MESSAGE),
      resetDate,
      isPaused: !allowed && isPaused,
      pauseUntil: !allowed && isPaused ? pauseUntil : undefined,
    }
  } catch (error) {
    console.error('[Limit Check] Error checking credit limit:', error)
    // On error, allow the request (fail open) but log the error
    return {
      allowed: true,
      remainingUsd: BETA_LIMITS.MAX_SPEND_USD, // Default assumption
      currentSpendUsd: 0,
      limitUsd: BETA_LIMITS.MAX_SPEND_USD,
      reason: 'Error checking limit - allowing request',
    }
  }
}

/**
 * Pause user account and block their IP
 */
export async function pauseUserAccount(userId: string, req: NextRequest): Promise<void> {
  try {
    const now = new Date()
    const pauseUntilDate = new Date(now.getTime() + BETA_LIMITS.PAUSE_DURATION_DAYS * 24 * 60 * 60 * 1000)

    // Update user_usage_limits to pause account
    await db
      .update(userUsageLimits)
      .set({
        isPaused: true,
        pausedAt: now,
        pauseReason: BETA_LIMITS.UPGRADE_MESSAGE,
        pauseUntil: pauseUntilDate,
        updatedAt: now,
      })
      .where(eq(userUsageLimits.userId, userId))

    // Block the user's IP address
    const ipAddress = getClientIp(req)
    if (ipAddress && ipAddress !== 'unknown') {
      await blockIp(
        ipAddress,
        `Account paused after reaching beta limit of $${BETA_LIMITS.MAX_SPEND_USD}`,
        userId
      )
    }

    console.log(`[Limit Check] ✓ Paused account for user ${userId} until ${pauseUntilDate.toISOString()}`)
  } catch (error) {
    console.error('[Limit Check] Error pausing user account:', error)
    // Don't throw - pause failure shouldn't break the request flow
  }
}

/**
 * Check if estimated cost would exceed limit
 */
export async function checkEstimatedCost(
  userId: string | null | undefined,
  estimatedCostUsd: number
): Promise<LimitCheckResult> {
  const currentCheck = await checkCreditLimit(userId)

  if (!currentCheck.allowed) {
    return currentCheck
  }

  // Check if adding this cost would exceed limit
  const wouldExceed = currentCheck.currentSpendUsd + estimatedCostUsd > currentCheck.limitUsd

  return {
    ...currentCheck,
    allowed: !wouldExceed,
    remainingUsd: Math.max(0, currentCheck.remainingUsd - estimatedCostUsd),
    reason: wouldExceed
      ? `This operation would exceed your monthly limit of $${currentCheck.limitUsd.toFixed(2)}`
      : undefined,
  }
}

