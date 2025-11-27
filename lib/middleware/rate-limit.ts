import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { getRedisClient } from '@/lib/redis/client';

/**
 * Rate limiting middleware using sliding window algorithm with Upstash Redis
 *
 * This implementation uses Redis for distributed rate limiting that works
 * across all serverless instances, solving the problem of in-memory storage
 * in serverless/multi-instance environments.
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  statusCode?: number;
  keyGenerator?: (request: NextRequest) => string;
}

interface RequestEntry {
  timestamps: number[];
}

/**
 * Default key generator - uses IP address or user ID
 */
function defaultKeyGenerator(request: NextRequest): string {
  // Try to get user ID from auth header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const userId = authHeader.split(' ')[1]?.substring(0, 20);
    if (userId) {
      return `user:${userId}`;
    }
  }

  // Fall back to IP address
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Get rate limit entry from Redis
 */
async function getEntry(redis: Redis, key: string): Promise<RequestEntry | null> {
  try {
    const data = await redis.get<RequestEntry>(`ratelimit:${key}`);
    return data;
  } catch (error) {
    console.error('[RateLimit] Error getting entry from Redis:', error);
    return null;
  }
}

/**
 * Set rate limit entry in Redis with TTL
 */
async function setEntry(
  redis: Redis,
  key: string,
  entry: RequestEntry,
  ttlSeconds: number
): Promise<void> {
  try {
    await redis.setex(`ratelimit:${key}`, ttlSeconds, JSON.stringify(entry));
  } catch (error) {
    console.error('[RateLimit] Error setting entry in Redis:', error);
  }
}

/**
 * Create a rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
    statusCode = 429,
    keyGenerator = defaultKeyGenerator,
  } = config;

  return async (
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const redis = getRedisClient();
    const key = keyGenerator(request);
    const now = Date.now();

    // If Redis is not configured, fall back to allowing the request
    // This provides graceful degradation
    if (!redis) {
      console.warn('[RateLimit] Redis not configured, skipping rate limiting');
      const response = await handler();
      response.headers.set('X-RateLimit-Limit', String(maxRequests));
      response.headers.set('X-RateLimit-Remaining', String(maxRequests));
      response.headers.set('X-RateLimit-Reset', String(now + windowMs));
      return response;
    }

    try {
      // Get or create entry from Redis
      let entry = await getEntry(redis, key);
      if (!entry) {
        entry = { timestamps: [] };
      }

      // Remove timestamps outside the window
      entry.timestamps = entry.timestamps.filter(
        (timestamp) => now - timestamp < windowMs
      );

      // Check if limit exceeded
      if (entry.timestamps.length >= maxRequests) {
        const oldestTimestamp = entry.timestamps[0];
        const resetTime = oldestTimestamp + windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);

        return NextResponse.json(
          {
            error: message,
            retryAfter,
          },
          {
            status: statusCode,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(maxRequests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(resetTime),
            },
          }
        );
      }

      // Add current request timestamp
      entry.timestamps.push(now);

      // Save to Redis with TTL (use window + 1 hour for safety)
      const ttlSeconds = Math.ceil((windowMs + 3600000) / 1000);
      await setEntry(redis, key, entry, ttlSeconds);

      // Call the handler
      const response = await handler();

      // Add rate limit headers to response
      response.headers.set('X-RateLimit-Limit', String(maxRequests));
      response.headers.set(
        'X-RateLimit-Remaining',
        String(maxRequests - entry.timestamps.length)
      );
      response.headers.set('X-RateLimit-Reset', String(now + windowMs));

      return response;
    } catch (error) {
      // On Redis error, allow the request but log the error
      console.error('[RateLimit] Error in rate limiting:', error);
      const response = await handler();
      response.headers.set('X-RateLimit-Limit', String(maxRequests));
      response.headers.set('X-RateLimit-Remaining', String(maxRequests));
      response.headers.set('X-RateLimit-Reset', String(now + windowMs));
      return response;
    }
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */

// Strict rate limiter for expensive operations (e.g., AI generation)
export const strictRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 5,
  message: 'Rate limit exceeded. Maximum 5 requests per minute.',
});

// Standard rate limiter for regular API calls
export const standardRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 30,
  message: 'Rate limit exceeded. Maximum 30 requests per minute.',
});

// Relaxed rate limiter for read operations
export const relaxedRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  message: 'Rate limit exceeded. Maximum 100 requests per minute.',
});

/**
 * Rate limiter specifically for external API calls
 * Helps prevent hitting provider rate limits
 */
export const externalAPIRateLimiter = createRateLimiter({
  windowMs: 1000, // 1 second
  maxRequests: 2,
  message: 'Too many external API calls. Please slow down.',
  keyGenerator: (request) => {
    // Rate limit by service instead of user
    const pathname = request.nextUrl.pathname;
    return `service:${pathname}`;
  },
});

/**
 * Wrapper to apply rate limiting to API route handlers
 */
export function withRateLimit<T extends NextRequest>(
  handler: (request: T) => Promise<NextResponse>,
  limiter: (
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ) => Promise<NextResponse> = standardRateLimiter
) {
  return async (request: T): Promise<NextResponse> => {
    return limiter(request, () => handler(request));
  };
}

/**
 * Get rate limit statistics
 * Note: This function scans Redis keys which can be expensive.
 * Use sparingly and only for admin/monitoring purposes.
 */
export async function getRateLimitStats(): Promise<{
  totalKeys: number;
  totalRequests: number;
  keys: Array<{ key: string; requests: number; lastRequest: number }>;
}> {
  const redis = getRedisClient();

  if (!redis) {
    console.warn('[RateLimit] Redis not configured, returning empty stats');
    return {
      totalKeys: 0,
      totalRequests: 0,
      keys: [],
    };
  }

  try {
    // Scan for all rate limit keys
    const allKeys: string[] = [];
    let cursor = 0;

    do {
      const result = await redis.scan(cursor, {
        match: 'ratelimit:*',
        count: 100,
      });
      cursor = result[0];
      allKeys.push(...result[1]);
    } while (cursor !== 0);

    const keys: Array<{ key: string; requests: number; lastRequest: number }> = [];
    let totalRequests = 0;

    // Get data for each key
    for (const fullKey of allKeys) {
      const entry = await redis.get<RequestEntry>(fullKey);
      if (entry && entry.timestamps) {
        const requests = entry.timestamps.length;
        const lastRequest =
          requests > 0 ? entry.timestamps[entry.timestamps.length - 1] : 0;

        // Remove the 'ratelimit:' prefix for display
        const displayKey = fullKey.replace('ratelimit:', '');
        keys.push({ key: displayKey, requests, lastRequest });
        totalRequests += requests;
      }
    }

    return {
      totalKeys: allKeys.length,
      totalRequests,
      keys: keys.sort((a, b) => b.requests - a.requests).slice(0, 50), // Top 50
    };
  } catch (error) {
    console.error('[RateLimit] Error getting stats:', error);
    return {
      totalKeys: 0,
      totalRequests: 0,
      keys: [],
    };
  }
}

/**
 * Clear rate limit for a specific key (admin function)
 */
export async function clearRateLimit(key: string): Promise<boolean> {
  const redis = getRedisClient();

  if (!redis) {
    console.warn('[RateLimit] Redis not configured');
    return false;
  }

  try {
    const result = await redis.del(`ratelimit:${key}`);
    return result > 0;
  } catch (error) {
    console.error('[RateLimit] Error clearing rate limit:', error);
    return false;
  }
}

/**
 * Clear all rate limits (admin function)
 * Warning: This will scan and delete all rate limit keys
 */
export async function clearAllRateLimits(): Promise<number> {
  const redis = getRedisClient();

  if (!redis) {
    console.warn('[RateLimit] Redis not configured');
    return 0;
  }

  try {
    // Scan for all rate limit keys
    const allKeys: string[] = [];
    let cursor = 0;

    do {
      const result = await redis.scan(cursor, {
        match: 'ratelimit:*',
        count: 100,
      });
      cursor = result[0];
      allKeys.push(...result[1]);
    } while (cursor !== 0);

    // Delete all keys
    if (allKeys.length > 0) {
      await redis.del(...allKeys);
    }

    return allKeys.length;
  } catch (error) {
    console.error('[RateLimit] Error clearing all rate limits:', error);
    return 0;
  }
}
