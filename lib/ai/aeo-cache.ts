import { cacheGet, cacheSet } from '@/lib/redis/client'

export const AEO_CACHE_PREFIXES = {
  WORKFLOW: 'aeo:workflow:',
  RESEARCH: 'aeo:research:',
  STRATEGY: 'aeo:strategy:',
  PLATFORM_OPTIMIZATION: 'aeo:platform-optimization:',
  PLATFORM_COMPARISON: 'aeo:platform-comparison:',
  CITATION_ANALYSIS: 'aeo:citation-analysis:',
  EEAT_DETECTION: 'aeo:eeat-detection:',
}

export const AEO_CACHE_TTL = {
  WORKFLOW: 60 * 60 * 24 * 7, // 7 days
  RESEARCH: 60 * 60 * 24 * 30, // 30 days
  STRATEGY: 60 * 60 * 24 * 14, // 14 days
  PLATFORM_OPTIMIZATION: 60 * 60 * 6, // 6 hours
  PLATFORM_COMPARISON: 60 * 60 * 6, // 6 hours
  CITATION_ANALYSIS: 60 * 60 * 24, // 24 hours
  EEAT_DETECTION: 60 * 60 * 24, // 24 hours
}

export async function cachedAEOCall<T>(
  prefix: string,
  keyData: Record<string, unknown>,
  fn: () => Promise<T>,
  options?: { ttl?: number }
): Promise<T> {
  // Build cache key from prefix and key data
  const keyHash = JSON.stringify(keyData)
  const key = `${prefix}${Buffer.from(keyHash).toString('base64').substring(0, 32)}`

  // Default TTL to 1 hour if not specified
  const ttl = options?.ttl ?? 60 * 60

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

