/**
 * Subscription Status Types and Constants
 * 
 * Maps to Polar subscription states and provides type-safe status checking
 */

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'inactive'
  | 'canceled'
  | 'revoked'
  | 'paused'
  | 'uncanceled'
  | null
  | undefined

/**
 * Subscription states that grant full dashboard access
 */
export const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  'active',
  'trialing',
  'uncanceled',
]

/**
 * Subscription states that deny dashboard access
 */
export const INACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  'inactive',
  'canceled',
  'revoked',
  'paused',
]

/**
 * Check if a subscription status grants access to paid features
 */
export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  if (!status) return false
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(status)
}

/**
 * Check if a subscription status explicitly denies access
 */
export function isSubscriptionInactive(status: SubscriptionStatus): boolean {
  if (!status) return true
  return INACTIVE_SUBSCRIPTION_STATUSES.includes(status)
}
