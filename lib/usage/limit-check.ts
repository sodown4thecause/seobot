/**
 * Credit Limit Checker
 * Enforces monthly credit limits for beta users
 */

import { createClient } from '@/lib/supabase/server'

export interface LimitCheckResult {
  allowed: boolean
  remainingUsd: number
  currentSpendUsd: number
  limitUsd: number
  reason?: string
  resetDate?: Date
}

/**
 * Check if user has remaining credits for the current month
 */
export async function checkCreditLimit(userId: string | null | undefined): Promise<LimitCheckResult> {
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

    // Get user's credit limit
    const { data: limits, error: limitsError } = await supabase
      .from('user_usage_limits')
      .select('monthly_credit_limit_usd, is_unlimited')
      .eq('user_id', userId)
      .single()

    // If no limits record exists, create one with default $10
    let monthlyLimit = 10.0
    let isUnlimited = false

    if (limitsError && limitsError.code === 'PGRST116') {
      // No record exists - create default
      const { data: newLimit } = await supabase
        .from('user_usage_limits')
        .insert({
          user_id: userId,
          monthly_credit_limit_usd: 10.0,
          is_unlimited: false,
        })
        .select()
        .single()
      
      if (newLimit) {
        monthlyLimit = Number(newLimit.monthly_credit_limit_usd)
        isUnlimited = newLimit.is_unlimited
      }
    } else if (limits) {
      monthlyLimit = Number(limits.monthly_credit_limit_usd)
      isUnlimited = limits.is_unlimited
    }

    // If unlimited, allow everything
    if (isUnlimited) {
      return {
        allowed: true,
        remainingUsd: Infinity,
        currentSpendUsd: 0,
        limitUsd: monthlyLimit,
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
      currentSpend = usage.reduce((sum, event) => {
        const cost = event.metadata?.cost_usd || 0
        return sum + Number(cost)
      }, 0)
    }

    const remaining = monthlyLimit - currentSpend
    const allowed = remaining > 0

    // Calculate reset date (first day of next month)
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    return {
      allowed,
      remainingUsd: Math.max(0, remaining),
      currentSpendUsd: currentSpend,
      limitUsd: monthlyLimit,
      reason: allowed ? undefined : `Monthly credit limit of $${monthlyLimit.toFixed(2)} exceeded. Resets on ${resetDate.toLocaleDateString()}.`,
      resetDate,
    }
  } catch (error) {
    console.error('[Limit Check] Error checking credit limit:', error)
    // On error, allow the request (fail open) but log the error
    return {
      allowed: true,
      remainingUsd: 10.0, // Default assumption
      currentSpendUsd: 0,
      limitUsd: 10.0,
      reason: 'Error checking limit - allowing request',
    }
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

