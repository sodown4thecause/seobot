/**
 * Subscription Guard
 * 
 * Enforces subscription-based access control for dashboard and API routes.
 * Checks subscriptionStatus field in the database (synced from Polar via webhooks).
 */

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-config'
import { headers } from 'next/headers'
import { isSubscriptionActive, type SubscriptionStatus } from './subscription-status'

export interface SubscriptionCheckResult {
  hasSubscription: boolean
  status: SubscriptionStatus
  userId: string | null
  authUserId: string | null
  polarSubscriptionId: string | null
  currentPeriodEnd: Date | null
}

/**
 * Check subscription status for a user
 * Returns detailed subscription information without redirecting
 */
export async function checkSubscription(
  authUserId: string | null | undefined
): Promise<SubscriptionCheckResult> {
  if (!authUserId) {
    return {
      hasSubscription: false,
      status: null,
      userId: null,
      authUserId: null,
      polarSubscriptionId: null,
      currentPeriodEnd: null,
    }
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        authUserId: users.betterAuthId,
        subscriptionStatus: users.subscriptionStatus,
        polarSubscriptionId: users.polarSubscriptionId,
        currentPeriodEnd: users.currentPeriodEnd,
      })
      .from(users)
      .where(eq(users.betterAuthId, authUserId))
      .limit(1)

    if (!user) {
      return {
        hasSubscription: false,
        status: null,
        userId: null,
        authUserId,
        polarSubscriptionId: null,
        currentPeriodEnd: null,
      }
    }

    const status = user.subscriptionStatus as SubscriptionStatus
    const hasSubscription = isSubscriptionActive(status)

    return {
      hasSubscription,
      status,
      userId: user.id,
      authUserId: user.authUserId,
      polarSubscriptionId: user.polarSubscriptionId,
      currentPeriodEnd: user.currentPeriodEnd,
    }
  } catch (error) {
    console.error('[Subscription Guard] Error checking subscription:', error)
    // Fail closed - deny access on error
    return {
      hasSubscription: false,
      status: null,
      userId: null,
      authUserId,
      polarSubscriptionId: null,
      currentPeriodEnd: null,
    }
  }
}

/**
 * Require subscription - throws redirect if no active subscription
 * Use in Server Components and Route Handlers
 */
export async function requireSubscription(
  redirectTo: string = '/prices?requires_subscription=1'
): Promise<SubscriptionCheckResult> {
  if (process.env.NODE_ENV === 'development') {
    return {
      hasSubscription: true,
      status: 'active',
      userId: 'dev-user',
      authUserId: 'dev-user',
      polarSubscriptionId: null,
      currentPeriodEnd: null,
    }
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    redirect('/sign-in?redirect_url=' + encodeURIComponent(redirectTo))
  }

  const result = await checkSubscription(session.user.id)

  if (!result.hasSubscription) {
    console.log(`[Subscription Guard] Denied access to ${session.user.id} (status: ${result.status})`)
    redirect(redirectTo)
  }

  return result
}

/**
 * Middleware-friendly subscription check
 * Returns NextResponse for edge middleware usage
 */
export async function middlewareCheckSubscription(
  userId: string | null | undefined
): Promise<{ allowed: boolean; status: SubscriptionStatus }> {
  if (!userId) {
    return { allowed: false, status: null }
  }

  const result = await checkSubscription(userId)
  return { allowed: result.hasSubscription, status: result.status }
}

// ============================================================================
// API ROUTE HELPERS
// ============================================================================

export interface ApiSubscriptionResult {
  success: boolean
  userId: string | null
  subscription: SubscriptionCheckResult | null
  error?: { code: string; message: string; status: number }
}

/**
 * Require subscription for API route
 * Returns error response if user doesn't have active subscription
 * 
 * Usage in API routes:
 * ```ts
 * const { success, userId, error } = await requireApiSubscription()
 * if (!success) {
 *   return NextResponse.json({ error: error!.code }, { status: error!.status })
 * }
 * // Continue with handler logic
 * ```
 */
export async function requireApiSubscription(): Promise<ApiSubscriptionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    return {
      success: false,
      userId: null,
      subscription: null,
      error: {
        code: 'authentication_required',
        message: 'Authentication required',
        status: 401,
      },
    }
  }

  const subscription = await checkSubscription(session.user.id)

  if (!subscription.hasSubscription) {
    console.log(`[API Subscription Guard] Denied access to ${session.user.id} (status: ${subscription.status})`)
    return {
      success: false,
      userId: session.user.id,
      subscription,
      error: {
        code: 'subscription_required',
        message: 'Active subscription required. Please subscribe to access this feature.',
        status: 403,
      },
    }
  }

  return {
    success: true,
    userId: session.user.id,
    subscription,
  }
}

/**
 * Create a standard subscription error response
 */
export function createSubscriptionErrorResponse(
  code: string = 'subscription_required',
  message: string = 'Active subscription required',
  status: number = 403
) {
  return NextResponse.json(
    { error: code, message },
    { status }
  )
}
