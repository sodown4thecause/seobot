/**
 * DataForSEO Rate Limiter
 *
 * Token bucket rate limiting using Upstash Redis.
 * Enforces per-endpoint rate limits to prevent 429 errors.
 *
 * @module lib/dataforseo/rate-limiter
 * @see https://docs.dataforseo.com/v3/appendix/errors
 */

import {
  getRateLimitForEndpoint,
  getRateLimitTier,
  RATE_LIMITS,
  type RateLimitTier,
} from '@/lib/constants/dataforseo-limits'
import { getRedisClient, cacheIncrement } from '@/lib/redis/client'

// ============================================================================
// Error Types
// ============================================================================

export class RateLimitExceededError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly tier: RateLimitTier,
    public readonly limit: number,
    public readonly retryAfter: number
  ) {
    super(
      `Rate limit exceeded for ${endpoint} (${tier} tier): ${limit}/min. Retry after ${retryAfter}ms`
    )
    this.name = 'RateLimitExceededError'
  }
}

export class RateLimiterDisabledError extends Error {
  constructor() {
    super('Rate limiter is disabled - Redis not configured')
    this.name = 'RateLimiterDisabledError'
  }
}

// ============================================================================
// Rate Limiter Configuration
// ============================================================================

interface RateLimiterConfig {
  /** Enable rate limiting (default: true) */
  enabled: boolean
  /** Buffer percentage to stay under limit (default: 0.9 = 90%) */
  safetyBuffer: number
  /** Time window in seconds (default: 60) */
  windowSeconds: number
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  enabled: true,
  safetyBuffer: 0.9,
  windowSeconds: 60,
}

// ============================================================================
// Rate Limiter Implementation
// ============================================================================

export class DataForSEORateLimiter {
  private config: RateLimiterConfig

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Check if rate limit allows a request
   * @param endpoint - DataForSEO endpoint
   * @returns True if request is allowed
   */
  async checkLimit(endpoint: string): Promise<boolean> {
    if (!this.config.enabled) {
      return true
    }

    const redis = getRedisClient()
    if (!redis) {
      console.warn('[RateLimiter] Redis not configured, skipping rate limit check')
      return true
    }

    const limit = getRateLimitForEndpoint(endpoint)
    const key = this.getRateLimitKey(endpoint)

    try {
      const current = await redis.get(key)
      const count = current ? parseInt(current as string, 10) : 0

      // Apply safety buffer (e.g., 90% of actual limit)
      const effectiveLimit = Math.floor(limit * this.config.safetyBuffer)

      return count < effectiveLimit
    } catch (error) {
      console.error(`[RateLimiter] Failed to check limit for ${endpoint}:`, error)
      // Fail open - allow request if we can't check
      return true
    }
  }

  /**
   * Consume a token for an endpoint
   * @param endpoint - DataForSEO endpoint
   * @throws RateLimitExceededError if limit exceeded
   */
  async consumeToken(endpoint: string): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    const redis = getRedisClient()
    if (!redis) {
      console.warn('[RateLimiter] Redis not configured, skipping token consumption')
      return
    }

    const limit = getRateLimitForEndpoint(endpoint)
    const tier = getRateLimitTier(endpoint)
    const key = this.getRateLimitKey(endpoint)

    try {
      // Increment counter
      const count = await cacheIncrement(key, this.config.windowSeconds)

      // Apply safety buffer
      const effectiveLimit = Math.floor(limit * this.config.safetyBuffer)

      if (count > effectiveLimit) {
        // Calculate retry-after based on time window
        const retryAfter = this.getRetryAfter()

        throw new RateLimitExceededError(
          endpoint,
          tier,
          limit,
          retryAfter
        )
      }
    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        throw error
      }

      console.error(`[RateLimiter] Failed to consume token for ${endpoint}:`, error)
      // Fail open on Redis errors
    }
  }

  /**
   * Get remaining tokens for an endpoint
   * @param endpoint - DataForSEO endpoint
   * @returns Number of remaining tokens
   */
  async getRemainingTokens(endpoint: string): Promise<number> {
    if (!this.config.enabled) {
      return Infinity
    }

    const redis = getRedisClient()
    if (!redis) {
      return Infinity
    }

    const limit = getRateLimitForEndpoint(endpoint)
    const key = this.getRateLimitKey(endpoint)

    try {
      const current = await redis.get(key)
      const count = current ? parseInt(current as string, 10) : 0
      const effectiveLimit = Math.floor(limit * this.config.safetyBuffer)

      return Math.max(0, effectiveLimit - count)
    } catch (error) {
      console.error(`[RateLimiter] Failed to get remaining tokens for ${endpoint}:`, error)
      return 0
    }
  }

  /**
   * Get time until rate limit resets
   * @returns Milliseconds until window resets
   */
  getRetryAfter(): number {
    const now = Date.now()
    const windowMs = this.config.windowSeconds * 1000
    const nextWindow = Math.ceil(now / windowMs) * windowMs
    return nextWindow - now
  }

  /**
   * Get current usage for an endpoint
   * @param endpoint - DataForSEO endpoint
   * @returns Current request count in window
   */
  async getCurrentUsage(endpoint: string): Promise<number> {
    const redis = getRedisClient()
    if (!redis) {
      return 0
    }

    const key = this.getRateLimitKey(endpoint)

    try {
      const current = await redis.get(key)
      return current ? parseInt(current as string, 10) : 0
    } catch (error) {
      console.error(`[RateLimiter] Failed to get usage for ${endpoint}:`, error)
      return 0
    }
  }

  /**
   * Generate rate limit key for Redis
   * Keys are bucketed by minute for per-minute limits
   */
  private getRateLimitKey(endpoint: string): string {
    const now = new Date()
    const minuteBucket = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}`

    return `rate_limit:${endpoint}:${minuteBucket}`
  }

  /**
   * Reset rate limit for an endpoint (for testing)
   * @param endpoint - DataForSEO endpoint
   */
  async resetLimit(endpoint: string): Promise<void> {
    const redis = getRedisClient()
    if (!redis) {
      return
    }

    const key = this.getRateLimitKey(endpoint)

    try {
      await redis.del(key)
    } catch (error) {
      console.error(`[RateLimiter] Failed to reset limit for ${endpoint}:`, error)
    }
  }

  /**
   * Get rate limiter status
   */
  getStatus(): {
    enabled: boolean
    configured: boolean
    windowSeconds: number
    safetyBuffer: number
  } {
    const redis = getRedisClient()
    return {
      enabled: this.config.enabled,
      configured: redis !== null,
      windowSeconds: this.config.windowSeconds,
      safetyBuffer: this.config.safetyBuffer,
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * Singleton rate limiter instance
 * Use this for all rate limiting operations
 */
export const rateLimiter = new DataForSEORateLimiter()

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check rate limit and consume token in one call
 * @param endpoint - DataForSEO endpoint
 * @throws RateLimitExceededError if limit exceeded
 */
export async function checkAndConsume(endpoint: string): Promise<void> {
  await rateLimiter.consumeToken(endpoint)
}

/**
 * Check rate limit without consuming token
 * @param endpoint - DataForSEO endpoint
 * @returns True if request would be allowed
 */
export async function wouldAllowRequest(endpoint: string): Promise<boolean> {
  return rateLimiter.checkLimit(endpoint)
}

/**
 * Get formatted rate limit info for an endpoint
 * @param endpoint - DataForSEO endpoint
 */
export async function getRateLimitInfo(endpoint: string): Promise<{
  endpoint: string
  tier: RateLimitTier
  limit: number
  effectiveLimit: number
  current: number
  remaining: number
  retryAfter: number
}> {
  const tier = getRateLimitTier(endpoint)
  const limit = getRateLimitForEndpoint(endpoint)
  const current = await rateLimiter.getCurrentUsage(endpoint)
  const remaining = await rateLimiter.getRemainingTokens(endpoint)
  const retryAfter = rateLimiter.getRetryAfter()

  return {
    endpoint,
    tier,
    limit,
    effectiveLimit: Math.floor(limit * rateLimiter['config'].safetyBuffer),
    current,
    remaining,
    retryAfter,
  }
}
