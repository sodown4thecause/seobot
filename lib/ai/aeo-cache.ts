import { cacheGet, cacheSet } from '@/lib/redis/client'

export const AEO_CACHE_PREFIXES = {
  WORKFLOW: 'aeo:workflow:',
  RESEARCH: 'aeo:research:',
  STRATEGY: 'aeo:strategy:',
}

export const AEO_CACHE_TTL = {
  WORKFLOW: 60 * 60 * 24 * 7, // 7 days
  RESEARCH: 60 * 60 * 24 * 30, // 30 days
  STRATEGY: 60 * 60 * 24 * 14, // 14 days
}

export async function cachedAEOCall<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number
): Promise<T> {
  // Try to get from cache
  const cached = await cacheGet<T>(key)
  if (cached) {
    console.log(`[AEO Cache] HIT: ${key}`)
    return cached
  }

  // Execute function
  console.log(`[AEO Cache] MISS: ${key}`)
  const result = await fn()

  // Cache result
  await cacheSet(key, result, ttl)
  
  return result
}

