/**
 * Beta Mode Configuration
 * Centralized configuration for beta guardrails
 */

export const BETA_LIMITS = {
  MAX_SPEND_USD: 1.00,
  PAUSE_DURATION_DAYS: 7,
  MAX_RESPONSE_CHARS: 4000,
  UPGRADE_EMAIL: 'support@flowintent.com',
  UPGRADE_MESSAGE: 'You have reached your beta usage limit of $1. Please email us at support@flowintent.com to upgrade your subscription.',
} as const

