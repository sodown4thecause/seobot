import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiting middleware using sliding window algorithm
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

// In-memory store for rate limit tracking
const store = new Map<string, RequestEntry>();

/**
 * Clean up old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  const maxAge = 3600000; // 1 hour

  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter(
      (timestamp) => now - timestamp < maxAge
    );

    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 300000); // Clean every 5 minutes

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
    const key = keyGenerator(request);
    const now = Date.now();

    // Get or create entry
    let entry = store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      store.set(key, entry);
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
 */
export function getRateLimitStats(): {
  totalKeys: number;
  totalRequests: number;
  keys: Array<{ key: string; requests: number; lastRequest: number }>;
} {
  const keys: Array<{ key: string; requests: number; lastRequest: number }> =
    [];
  let totalRequests = 0;

  for (const [key, entry] of store.entries()) {
    const requests = entry.timestamps.length;
    const lastRequest =
      requests > 0 ? entry.timestamps[entry.timestamps.length - 1] : 0;

    keys.push({ key, requests, lastRequest });
    totalRequests += requests;
  }

  return {
    totalKeys: store.size,
    totalRequests,
    keys: keys.sort((a, b) => b.requests - a.requests).slice(0, 50), // Top 50
  };
}

/**
 * Clear rate limit for a specific key (admin function)
 */
export function clearRateLimit(key: string): boolean {
  return store.delete(key);
}

/**
 * Clear all rate limits (admin function)
 */
export function clearAllRateLimits(): void {
  store.clear();
}
