import 'server-only'

import { createHash } from 'node:crypto'
import { Redis } from '@upstash/redis'
import { serverEnv } from '@/lib/config/env'

export const RANKINGS_TTL = 21600
export const BACKLINKS_TTL = 172800
export const AUDIT_TTL = 86400
export const COMPETITOR_TTL = 43200

export const DASHBOARD_TTL_BY_TYPE = {
  rankings: RANKINGS_TTL,
  backlinks: BACKLINKS_TTL,
  audit: AUDIT_TTL,
  competitor: COMPETITOR_TTL,
} as const

let redisClient: Redis | null = null

function getClient(): Redis | null {
  if (redisClient) {
    return redisClient
  }

  const url = serverEnv.UPSTASH_REDIS_REST_URL
  const token = serverEnv.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return null
  }

  redisClient = new Redis({ url, token })
  return redisClient
}

function hashValue(value?: string): string {
  if (!value) {
    return 'base'
  }

  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}

export function generateKey(userId: string, dataType: string, params?: string): string {
  return `dashboard:${userId}:${dataType}:${hashValue(params)}`
}

export function getDashboardPatternForUser(userId: string): string {
  return `dashboard:${userId}:*`
}

export async function get<T>(key: string): Promise<T | null> {
  const client = getClient()
  if (!client) {
    return null
  }

  try {
    const value = await client.get(key)
    if (value === null) {
      return null
    }

    return value as T
  } catch (error) {
    console.error(`[Cache] Redis get failed for ${key}:`, error)
    return null
  }
}

export async function set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const client = getClient()
  if (!client) {
    return
  }

  try {
    await client.set(key, value, { ex: ttlSeconds })
  } catch (error) {
    console.error(`[Cache] Redis set failed for ${key}:`, error)
  }
}

export async function del(key: string): Promise<void> {
  const client = getClient()
  if (!client) {
    return
  }

  try {
    await client.del(key)
  } catch (error) {
    console.error(`[Cache] Redis delete failed for ${key}:`, error)
  }
}

export { del as delete }

export async function deletePattern(pattern: string): Promise<void> {
  const client = getClient()
  if (!client) {
    return
  }

  try {
    let cursor = '0'
    do {
      const [nextCursor, keys] = await client.scan(cursor, { match: pattern, count: 100 })
      cursor = nextCursor

      if (keys.length > 0) {
        await client.del(...keys)
      }
    } while (cursor !== '0')
  } catch (error) {
    console.error(`[Cache] Redis deletePattern failed for ${pattern}:`, error)
  }
}

export async function invalidateDashboardCache(userId: string): Promise<void> {
  await deletePattern(getDashboardPatternForUser(userId))
}

type WarmCacheOptions<T> = {
  userId: string
  dataType: keyof typeof DASHBOARD_TTL_BY_TYPE
  params?: string
  fetcher: () => Promise<T>
}

export async function warmDashboardCache<T>(options: WarmCacheOptions<T>): Promise<T> {
  const key = generateKey(options.userId, options.dataType, options.params)
  const ttl = DASHBOARD_TTL_BY_TYPE[options.dataType]
  const freshValue = await options.fetcher()

  await set(key, freshValue, ttl)

  return freshValue
}

export const redisCache = {
  get,
  set,
  delete: del,
  deletePattern,
  invalidateDashboardCache,
  generateKey,
  getDashboardPatternForUser,
  warmDashboardCache,
}
