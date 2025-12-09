/**
 * Rate Limiting Utility
 *
 * Implements sliding window rate limiting using Upstash Redis
 * Prevents API abuse with configurable limits per IP/user
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'
import { getRedisClient } from './client'

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
} as const

type RateLimitType = keyof typeof RATE_LIMITS

// In-memory cache for rate limiters (Edge runtime compatible)
const rateLimiters = new Map<string, Ratelimit>()

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
 * Uses IP address as primary identifier
 */
function getClientIdentifier(req: NextRequest): string {
  // Try different headers for client IP
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Fallback to a default identifier
  return 'unknown'
}

/**
 * Check rate limit for a request
 *
 * @param req - Next.js request object
 * @param type - Type of rate limit to check
 * @returns Result object with success status and metadata
 */
export async function checkRateLimit(
  req: NextRequest,
  type: RateLimitType
): Promise<{
  success: boolean
  limit?: number
  remaining?: number
  reset?: number
  message?: string
}> {
  const limiter = getRateLimiter(type)

  // If Redis is not configured, allow all requests
  if (!limiter) {
    return { success: true, limit: 1000, remaining: 999, reset: Date.now() + 60000 }
  }

  const identifier = getClientIdentifier(req)

  try {
    const result = await limiter.limit(identifier)

    const config = RATE_LIMITS[type]
    const resetTime = result.reset

    return {
      success: result.success,
      limit: config.limit,
      remaining: result.remaining,
      reset: resetTime,
      message: config.message,
    }
  } catch (error) {
    console.error('[RateLimit] Error checking limit:', error)
    // On error, allow the request but log the error
    return { success: true, limit: 1000, remaining: 999, reset: Date.now() + 60000 }
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
    const retryAfterSeconds = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000))
    headers.set('Retry-After', retryAfterSeconds.toString())
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
 */
export async function rateLimitMiddleware(
  req: NextRequest,
  type: RateLimitType
): Promise<Response | null> {
  const result = await checkRateLimit(req, type)
  return createRateLimitResponse(result)
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
      identifier: getClientIdentifier(req),
    }
  }

  const identifier = getClientIdentifier(req)

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
