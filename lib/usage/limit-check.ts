/**
 * Credit Limit Checker
 * Enforces monthly credit limits for beta users
 */

import { createClient } from '@/lib/supabase/server'
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
    const supabase = await createClient()

    // Get user's credit limit and pause status
    const { data: limits, error: limitsError } = await supabase
      .from('user_usage_limits')
      .select('monthly_credit_limit_usd, is_unlimited, is_paused, pause_until, pause_reason')
      .eq('user_id', userId)
      .single()

    // If no limits record exists, create one with default $1 for beta
    let monthlyLimit: number = BETA_LIMITS.MAX_SPEND_USD
    let isUnlimited = false
    let isPaused = false
    let pauseUntil: Date | undefined
    let pauseReason: string | undefined

    if (limitsError && limitsError.code === 'PGRST116') {
      // No record exists - create default with beta limit
      const { data: newLimit } = await supabase
        .from('user_usage_limits')
        .insert({
          user_id: userId,
          monthly_credit_limit_usd: BETA_LIMITS.MAX_SPEND_USD,
          is_unlimited: false,
          is_paused: false,
        })
        .select()
        .single()

      if (newLimit) {
        monthlyLimit = Number(newLimit.monthly_credit_limit_usd)
        isUnlimited = newLimit.is_unlimited
        isPaused = newLimit.is_paused || false
        pauseUntil = newLimit.pause_until ? new Date(newLimit.pause_until) : undefined
        pauseReason = newLimit.pause_reason || undefined
      }
    } else if (limits) {
      monthlyLimit = Number(limits.monthly_credit_limit_usd)
      isUnlimited = limits.is_unlimited
      isPaused = limits.is_paused || false
      pauseUntil = limits.pause_until ? new Date(limits.pause_until) : undefined
      pauseReason = limits.pause_reason || undefined
    }

    // Check if pause has expired
    if (isPaused && pauseUntil) {
      const now = new Date()
      if (now >= pauseUntil) {
        // Pause expired, clear it
        await supabase
          .from('user_usage_limits')
          .update({
            is_paused: false,
            pause_until: null,
            pause_reason: null,
          })
          .eq('user_id', userId)
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

    // Sum costs from ai_usage_events for current month
    const { data: usage, error: usageError } = await supabase
      .from('ai_usage_events')
      .select('metadata')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())

    let currentSpend = 0
    if (!usageError && usage) {
      currentSpend = usage.reduce((sum: number, event: { metadata: Record<string, any> | null }) => {
        const cost = event.metadata?.cost_usd || 0
        return sum + Number(cost)
      }, 0)
    }

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
    const supabase = await createClient()
    const now = new Date()
    const pauseUntil = new Date(now.getTime() + BETA_LIMITS.PAUSE_DURATION_DAYS * 24 * 60 * 60 * 1000)

    // Update user_usage_limits to pause account
    const { error: pauseError } = await supabase
      .from('user_usage_limits')
      .update({
        is_paused: true,
        paused_at: now.toISOString(),
        pause_reason: BETA_LIMITS.UPGRADE_MESSAGE,
        pause_until: pauseUntil.toISOString(),
      })
      .eq('user_id', userId)

    if (pauseError) {
      console.error('[Limit Check] Error pausing account:', pauseError)
      return
    }

    // Block the user's IP address
    const ipAddress = getClientIp(req)
    if (ipAddress && ipAddress !== 'unknown') {
      await blockIp(
        ipAddress,
        `Account paused after reaching beta limit of $${BETA_LIMITS.MAX_SPEND_USD}`,
        userId
      )
    }

    console.log(`[Limit Check] ✓ Paused account for user ${userId} until ${pauseUntil.toISOString()}`)
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

