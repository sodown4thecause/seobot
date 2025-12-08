/**
 * Rate Limiting Utility
 *
 * Implements sliding window rate limiting using Upstash Redis
 * Prevents API abuse with configurable limits per IP/user
 */

import { Ratelimit } from '@upstash/ratelimit'
import { NextRequest } from 'next/server'
import { getRedisClient } from './client'
import { createClient } from '@/lib/supabase/server'
import { trackAPICall } from '@/lib/analytics/api-tracker'

// Configure rate limits for different endpoints
export const RATE_LIMITS = {
  // Chat: 10 requests per minute per IP
  CHAT: {
    limit: 10,
    window: '1 m',
    message: 'Too many chat requests. Please wait before sending another message.',
  },
  // Content generation: 5 requests per minute per IP
  CONTENT_GENERATION: {
    limit: 5,
    window: '1 m',
    message: 'Too many content generation requests. Please wait before generating more content.',
  },
  // Export: 20 requests per minute per IP
  EXPORT: {
    limit: 20,
    window: '1 m',
    message: 'Too many export requests. Please wait before exporting again.',
  },
  // Keywords research: 10 requests per hour per IP
  KEYWORDS: {
    limit: 10,
    window: '1 h',
    message: 'Too many keyword research requests. Please try again later.',
  },
  // Competitors: 5 requests per hour per IP
  COMPETITORS: {
    limit: 5,
    window: '1 h',
    message: 'Too many competitor analysis requests. Please try again later.',
  },
  // General API: 100 requests per minute per IP
  GENERAL: {
    limit: 100,
    window: '1 m',
    message: 'Too many requests. Please slow down.',
  },
  // AEO Audit: 1 audit per day per IP (free tool rate limit - each audit costs ~$0.40 in API fees)
  AEO_AUDIT: {
    limit: 1,
    window: '1 d',
    message: 'You have already used your free audit today. Sign up for a free account to get more audits!',
  },
} as const

type RateLimitType = keyof typeof RATE_LIMITS

// In-memory cache for rate limiters (Edge runtime compatible)
const rateLimiters = new Map<string, Ratelimit>()

// In-memory rate limit storage for fallback (when Redis is not available)
interface InMemoryRateLimitEntry {
  timestamps: number[]
  windowMs: number
}

const inMemoryRateLimits = new Map<string, InMemoryRateLimitEntry>()

/**
 * Parse window string to milliseconds
 */
function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*([smhd])$/)
  if (!match) return 60000 // Default to 1 minute
  
  const [, value, unit] = match
  const num = parseInt(value, 10)
  
  switch (unit) {
    case 's': return num * 1000
    case 'm': return num * 60 * 1000
    case 'h': return num * 60 * 60 * 1000
    case 'd': return num * 24 * 60 * 60 * 1000
    default: return 60000
  }
}

/**
 * In-memory rate limiting fallback (sliding window)
 */
function checkInMemoryRateLimit(
  identifier: string,
  type: RateLimitType
): { success: boolean; remaining: number; reset: number } {
  const config = RATE_LIMITS[type]
  const windowMs = parseWindow(config.window)
  const now = Date.now()
  const key = `${type}:${identifier}`
  
  let entry = inMemoryRateLimits.get(key)
  
  if (!entry || entry.windowMs !== windowMs) {
    entry = { timestamps: [], windowMs }
    inMemoryRateLimits.set(key, entry)
  }
  
  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(
    (ts) => now - ts < windowMs
  )
  
  // Check if limit exceeded
  if (entry.timestamps.length >= config.limit) {
    const oldestTimestamp = entry.timestamps[0]
    const reset = oldestTimestamp + windowMs
    return {
      success: false,
      remaining: 0,
      reset,
    }
  }
  
  // Add current request
  entry.timestamps.push(now)
  
  // Clean up old entries periodically (every 1000 requests)
  if (inMemoryRateLimits.size > 1000) {
    const keysToDelete: string[] = []
    for (const [k, e] of inMemoryRateLimits.entries()) {
      e.timestamps = e.timestamps.filter((ts) => now - ts < e.windowMs)
      if (e.timestamps.length === 0) {
        keysToDelete.push(k)
      }
    }
    keysToDelete.forEach((k) => inMemoryRateLimits.delete(k))
  }
  
  return {
    success: true,
    remaining: config.limit - entry.timestamps.length,
    reset: now + windowMs,
  }
}

/**
 * Get or create a rate limiter for a specific type
 */
function getRateLimiter(type: RateLimitType): Ratelimit | null {
  const redis = getRedisClient()
  if (!redis) {
    console.warn('[RateLimit] Redis not configured, skipping rate limiting')
    return null
  }

  const config = RATE_LIMITS[type]
  const key = `${type}:${config.window}:${config.limit}`

  if (!rateLimiters.has(key)) {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, config.window),
      analytics: true,
      prefix: `ratelimit:${key}`,
    })

    rateLimiters.set(key, limiter)
  }

  return rateLimiters.get(key) || null
}

/**
 * Get client identifier from request
 * Prioritizes user ID from auth, falls back to IP address
 */
async function getClientIdentifier(req: NextRequest, userId?: string | null): Promise<string> {
  // Prefer user ID if available (more accurate for authenticated users)
  if (userId) {
    return `user:${userId}`
  }

  // Try to get user from Supabase auth if not provided
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) {
      return `user:${user.id}`
    }
  } catch (error) {
    // Auth check failed, fall back to IP
  }

  // Fall back to IP address
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip')

  if (forwarded) {
    return `ip:${forwarded.split(',')[0].trim()}`
  }

  if (realIp) {
    return `ip:${realIp}`
  }

  if (cfConnectingIp) {
    return `ip:${cfConnectingIp}`
  }

  // Fallback to a default identifier
  return 'ip:unknown'
}

/**
 * Check rate limit for a request
 *
 * @param req - Next.js request object
 * @param type - Type of rate limit to check
 * @param userId - Optional user ID (if already available from auth)
 * @returns Result object with success status and metadata
 */
export async function checkRateLimit(
  req: NextRequest,
  type: RateLimitType,
  userId?: string | null
): Promise<{
  success: boolean
  limit?: number
  remaining?: number
  reset?: number
  message?: string
  identifier?: string
}> {
  const config = RATE_LIMITS[type]
  const identifier = await getClientIdentifier(req, userId)
  const limiter = getRateLimiter(type)

  // If Redis is not configured, use in-memory fallback
  if (!limiter) {
    const inMemoryResult = checkInMemoryRateLimit(identifier, type)
    return {
      success: inMemoryResult.success,
      limit: config.limit,
      remaining: inMemoryResult.remaining,
      reset: inMemoryResult.reset,
      message: config.message,
      identifier,
    }
  }

  try {
    const result = await limiter.limit(identifier)
    const resetTime = result.reset

    // Log rate limit hit to api_usage_logs if user is authenticated
    if (userId && !result.success) {
      try {
        await trackAPICall(userId, {
          service: 'rate-limit',
          endpoint: `rate-limit:${type}`,
          method: req.method,
          statusCode: 429,
          durationMs: 0,
          metadata: {
            rateLimitType: type,
            identifier,
            limit: config.limit,
            remaining: result.remaining,
            reset: resetTime,
          },
        })
      } catch (logError) {
        // Don't fail rate limiting if logging fails
        console.error('[RateLimit] Failed to log rate limit hit:', logError)
      }
    }

    return {
      success: result.success,
      limit: config.limit,
      remaining: result.remaining,
      reset: resetTime,
      message: config.message,
      identifier,
    }
  } catch (error) {
    console.error('[RateLimit] Error checking limit:', error)
    // On error, fall back to in-memory rate limiting
    const inMemoryResult = checkInMemoryRateLimit(identifier, type)
    return {
      success: inMemoryResult.success,
      limit: config.limit,
      remaining: inMemoryResult.remaining,
      reset: inMemoryResult.reset,
      message: config.message,
      identifier,
    }
  }
}

/**
 * Create a rate limit response
 */
export function createRateLimitResponse(result: {
  success: boolean
  limit?: number
  remaining?: number
  reset?: number
  message?: string
}) {
  if (result.success) {
    return null // No response needed, request can proceed
  }

  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  if (result.limit !== undefined) {
    headers.set('X-RateLimit-Limit', result.limit.toString())
  }

  if (result.remaining !== undefined) {
    headers.set('X-RateLimit-Remaining', result.remaining.toString())
  }

  if (result.reset !== undefined) {
    headers.set('X-RateLimit-Reset', Math.ceil(result.reset / 1000).toString())
  }

  return new Response(
    JSON.stringify({
      error: result.message || 'Rate limit exceeded',
      retryAfter: result.reset ? Math.ceil((result.reset - Date.now()) / 1000) : undefined,
    }),
    {
      status: 429, // Too Many Requests
      headers,
    }
  )
}

/**
 * Rate limiting middleware for API routes
 *
 * Usage:
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await rateLimitMiddleware(req, 'CHAT')
 *   if (rateLimitResult) return rateLimitResult
 *
 *   // Your route logic here
 * }
 * 
 * @param req - Next.js request object
 * @param type - Type of rate limit to apply
 * @param userId - Optional user ID (if already available from auth, improves accuracy)
 */
export async function rateLimitMiddleware(
  req: NextRequest,
  type: RateLimitType,
  userId?: string | null
): Promise<Response | null> {
  const result = await checkRateLimit(req, type, userId)
  const response = createRateLimitResponse(result)
  
  // Add Retry-After header if rate limited
  if (response && result.reset) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
    response.headers.set('Retry-After', retryAfter.toString())
  }
  
  return response
}

/**
 * Get rate limit status (for monitoring/dashboard)
 */
export async function getRateLimitStatus(
  req: NextRequest,
  type: RateLimitType
): Promise<{
  limited: boolean
  limit: number
  remaining: number
  reset: number
  identifier: string
}> {
  const limiter = getRateLimiter(type)

  if (!limiter) {
    return {
      limited: false,
      limit: 1000,
      remaining: 999,
      reset: Date.now() + 60000,
      identifier: await getClientIdentifier(req),
    }
  }

  const identifier = await getClientIdentifier(req)

  try {
    const result = await limiter.limit(identifier)
    const config = RATE_LIMITS[type]

    return {
      limited: !result.success,
      limit: config.limit,
      remaining: result.remaining,
      reset: result.reset,
      identifier,
    }
  } catch (error) {
    console.error('[RateLimit] Error getting status:', error)
    const config = RATE_LIMITS[type]
    return {
      limited: false,
      limit: config.limit,
      remaining: 0,
      reset: Date.now() + 60000,
      identifier,
    }
  }
}

/**
 * Get rate limit statistics across all rate limiters
 * Note: This function scans Redis keys which can be expensive.
 * Use sparingly and only for admin/monitoring purposes.
 */
export async function getRateLimitStats(): Promise<{
  totalKeys: number
  totalRequests: number
  keys: Array<{ key: string; requests: number; lastRequest: number }>
}> {
  const redis = getRedisClient()

  if (!redis) {
    console.warn('[RateLimit] Redis not configured, returning empty stats')
    return {
      totalKeys: 0,
      totalRequests: 0,
      keys: [],
    }
  }

  try {
    // Scan for all rate limit keys
    const allKeys: string[] = []
    let cursor = 0

    do {
      const result: [string, string[]] = await redis.scan(cursor, {
        match: 'ratelimit:*',
        count: 100,
      })
      cursor = parseInt(result[0], 10)
      allKeys.push(...result[1])
    } while (cursor !== 0)

    const keys: Array<{ key: string; requests: number; lastRequest: number }> = []
    let totalRequests = 0

    // Get analytics data for each rate limiter
    for (const fullKey of allKeys) {
      try {
        // Try to get analytics data if available
        const analyticsKey = fullKey.replace('ratelimit:', 'ratelimit:analytics:')
        const analytics = await redis.get<{ count: number; lastUsed: number }>(analyticsKey)

        if (analytics) {
          const displayKey = fullKey.replace('ratelimit:', '')
          keys.push({
            key: displayKey,
            requests: analytics.count || 0,
            lastRequest: analytics.lastUsed || 0,
          })
          totalRequests += analytics.count || 0
        }
      } catch (error) {
        // Skip keys that can't be read
        console.warn('[RateLimit] Error reading key:', fullKey, error)
      }
    }

    return {
      totalKeys: allKeys.length,
      totalRequests,
      keys: keys.sort((a, b) => b.requests - a.requests).slice(0, 50), // Top 50
    }
  } catch (error) {
    console.error('[RateLimit] Error getting stats:', error)
    return {
      totalKeys: 0,
      totalRequests: 0,
      keys: [],
    }
  }
}

/**
 * Clear rate limit for a specific identifier
 * @param identifier - The identifier to clear (e.g., IP address or user ID)
 * @param type - The rate limit type to clear
 */
export async function clearRateLimit(identifier: string, type?: RateLimitType): Promise<boolean> {
  const redis = getRedisClient()

  if (!redis) {
    console.warn('[RateLimit] Redis not configured')
    return false
  }

  try {
    if (type) {
      // Clear specific rate limit type for identifier
      const config = RATE_LIMITS[type]
      const key = `${type}:${config.window}:${config.limit}`
      const fullKey = `ratelimit:${key}:${identifier}`
      const result = await redis.del(fullKey)
      return result > 0
    } else {
      // Clear all rate limits for identifier
      const allKeys: string[] = []
      let cursor = 0

      do {
        const result: [string, string[]] = await redis.scan(cursor, {
          match: `ratelimit:*:${identifier}`,
          count: 100,
        })
        cursor = parseInt(result[0], 10)
        allKeys.push(...result[1])
      } while (cursor !== 0)

      if (allKeys.length > 0) {
        await redis.del(...allKeys)
      }

      return allKeys.length > 0
    }
  } catch (error) {
    console.error('[RateLimit] Error clearing rate limit:', error)
    return false
  }
}

/**
 * Clear all rate limits (admin function)
 * Warning: This will scan and delete all rate limit keys
 */
export async function clearAllRateLimits(): Promise<number> {
  const redis = getRedisClient()

  if (!redis) {
    console.warn('[RateLimit] Redis not configured')
    return 0
  }

  try {
    // Scan for all rate limit keys
    const allKeys: string[] = []
    let cursor = 0

    do {
      const result: [string, string[]] = await redis.scan(cursor, {
        match: 'ratelimit:*',
        count: 100,
      })
      cursor = parseInt(result[0], 10)
      allKeys.push(...result[1])
    } while (cursor !== 0)

    // Delete all keys
    if (allKeys.length > 0) {
      await redis.del(...allKeys)
    }

    return allKeys.length
  } catch (error) {
    console.error('[RateLimit] Error clearing all rate limits:', error)
    return 0
  }
}
