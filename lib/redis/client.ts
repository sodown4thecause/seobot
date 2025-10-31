/**
 * Redis Client for Caching
 *
 * Edge-compatible Redis client using Upstash Redis
 * Provides caching for embeddings, search results, and API responses
 */

import { Redis } from '@upstash/redis'

// Singleton Redis client
let redis: Redis | null = null

/**
 * Initialize Redis client
 * Returns null if Redis is not configured (graceful degradation)
 */
export function getRedisClient(): Redis | null {
  if (redis !== null) {
    return redis
  }

  try {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      console.warn('[Redis] Not configured - UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing')
      redis = null
      return null
    }

    redis = new Redis({
      url,
      token,
    })

    console.log('[Redis] Client initialized')
    return redis
  } catch (error) {
    console.error('[Redis] Failed to initialize:', error)
    redis = null
    return null
  }
}

/**
 * Cache key prefixes for different data types
 */
export const CACHE_PREFIXES = {
  EMBEDDING: 'embedding:',
  FRAMEWORK_SEARCH: 'framework:search:',
  API_RESPONSE: 'api:response:',
  DATAFORSEO: 'dataforseo:',
  USER_ANALYTICS: 'analytics:user:',
} as const

/**
 * Standard TTL values (in seconds)
 */
export const CACHE_TTL = {
  EMBEDDING: 60 * 60 * 24 * 30, // 30 days (embeddings rarely change)
  FRAMEWORK_SEARCH: 60 * 10, // 10 minutes
  API_RESPONSE: 60 * 60 * 24, // 24 hours
  DATAFORSEO: 60 * 60 * 24 * 7, // 7 days
  USER_ANALYTICS: 60 * 60, // 1 hour
} as const

/**
 * Set value in Redis with TTL
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<void> {
  const client = getRedisClient()
  if (!client) {
    return
  }

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value))
  } catch (error) {
    console.error(`[Redis] Failed to set cache for key ${key}:`, error)
  }
}

/**
 * Get value from Redis
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient()
  if (!client) {
    return null
  }

  try {
    const value = await client.get(key)
    if (value === null) {
      return null
    }
    return JSON.parse(value as string) as T
  } catch (error) {
    console.error(`[Redis] Failed to get cache for key ${key}:`, error)
    return null
  }
}

/**
 * Check if key exists in Redis
 */
export async function cacheExists(key: string): Promise<boolean> {
  const client = getRedisClient()
  if (!client) {
    return false
  }

  try {
    const result = await client.exists(key)
    return result === 1
  } catch (error) {
    console.error(`[Redis] Failed to check existence for key ${key}:`, error)
    return false
  }
}

/**
 * Delete key from Redis
 */
export async function cacheDelete(key: string): Promise<void> {
  const client = getRedisClient()
  if (!client) {
    return
  }

  try {
    await client.del(key)
  } catch (error) {
    console.error(`[Redis] Failed to delete key ${key}:`, error)
  }
}

/**
 * Increment counter in Redis
 */
export async function cacheIncrement(
  key: string,
  ttlSeconds?: number
): Promise<number> {
  const client = getRedisClient()
  if (!client) {
    return 0
  }

  try {
    const result = await client.incr(key)
    if (ttlSeconds && result === 1) {
      await client.expire(key, ttlSeconds)
    }
    return result
  } catch (error) {
    console.error(`[Redis] Failed to increment key ${key}:`, error)
    return 0
  }
}

/**
 * Multi-operation for batch caching
 */
export async function cacheSetBatch(
  entries: Array<{ key: string; value: unknown; ttlSeconds?: number }>
): Promise<void> {
  const client = getRedisClient()
  if (!client) {
    return
  }

  try {
    const pipeline = client.pipeline()

    for (const entry of entries) {
      if (entry.ttlSeconds) {
        pipeline.setex(entry.key, entry.ttlSeconds, JSON.stringify(entry.value))
      } else {
        pipeline.set(entry.key, JSON.stringify(entry.value))
      }
    }

    await pipeline.exec()
  } catch (error) {
    console.error('[Redis] Failed to set batch:', error)
  }
}

/**
 * Get multiple values from Redis
 */
export async function cacheGetBatch<T>(
  keys: string[]
): Promise<Record<string, T | null>> {
  const client = getRedisClient()
  if (!client) {
    return {}
  }

  try {
    const values = await client.mget(...keys)
    const result: Record<string, T | null> = {}

    keys.forEach((key, index) => {
      const value = values[index]
      if (value !== null) {
        try {
          result[key] = JSON.parse(value as string) as T
        } catch {
          result[key] = null
        }
      } else {
        result[key] = null
      }
    })

    return result
  } catch (error) {
    console.error('[Redis] Failed to get batch:', error)
    return {}
  }
}

/**
 * Flush all cache (use with caution - for development only)
 */
export async function cacheFlushAll(): Promise<void> {
  const client = getRedisClient()
  if (!client) {
    return
  }

  try {
    await client.flushall()
    console.log('[Redis] Cache flushed')
  } catch (error) {
    console.error('[Redis] Failed to flush cache:', error)
  }
}

/**
 * Get Redis client status
 */
export function getRedisStatus(): {
  enabled: boolean
  configured: boolean
} {
  const client = getRedisClient()
  return {
    enabled: client !== null,
    configured:
      !!process.env.UPSTASH_REDIS_REST_URL &&
      !!process.env.UPSTASH_REDIS_REST_TOKEN,
  }
}
