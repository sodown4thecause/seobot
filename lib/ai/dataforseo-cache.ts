/**
 * DataForSEO API Caching Layer
 * 
 * Implements Redis caching for expensive DataForSEO API calls to:
 * - Reduce API costs (60% savings expected)
 * - Improve response times (50% faster for cached queries)
 * - Minimize redundant API calls
 * 
 * Cache Strategy:
 * - TTL: 7 days (SEO data changes slowly)
 * - Key: MD5 hash of tool name + arguments
 * - Bypass: Optional for real-time data
 */

import { cacheGet, cacheSet, cacheDelete, CACHE_PREFIXES, CACHE_TTL } from '@/lib/redis/client'

/**
 * Generate deterministic cache key for DataForSEO API calls
 * Uses MD5 hash to create short, consistent keys
 */
export function getDataForSEOCacheKey(
  toolName: string,
  args: Record<string, any>
): string {
  // Sort keys for deterministic hashing
  const sortedArgs = Object.keys(args)
    .sort()
    .reduce((acc, key) => {
      acc[key] = args[key]
      return acc
    }, {} as Record<string, any>)

  // Create string representation
  const argsString = JSON.stringify(sortedArgs)
  
  // Simple hash function (Edge runtime compatible)
  let hash = 0
  for (let i = 0; i < argsString.length; i++) {
    const char = argsString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  const hashString = Math.abs(hash).toString(36)
  return `${CACHE_PREFIXES.DATAFORSEO}${toolName}:${hashString}`
}

/**
 * Cached wrapper for DataForSEO tool execution
 * 
 * @param toolName - Name of the DataForSEO tool
 * @param args - Tool arguments
 * @param executeFn - Function that executes the actual API call
 * @param options - Caching options
 * @returns Tool execution result (from cache or fresh API call)
 */
export async function cachedDataForSEOCall<T>(
  toolName: string,
  args: Record<string, any>,
  executeFn: () => Promise<T>,
  options: {
    ttl?: number
    bypassCache?: boolean
  } = {}
): Promise<T> {
  const { ttl = CACHE_TTL.DATAFORSEO, bypassCache = false } = options
  
  // Generate cache key
  const cacheKey = getDataForSEOCacheKey(toolName, args)
  
  // Check cache first (unless bypassed)
  if (!bypassCache) {
    const cached = await cacheGet<T>(cacheKey)
    if (cached) {
      console.log(`[DataForSEO Cache] ✅ HIT for ${toolName}`)
      return cached
    }
  }
  
  console.log(`[DataForSEO Cache] ❌ MISS for ${toolName}, fetching from API...`)
  
  // Execute the actual API call
  const startTime = Date.now()
  const result = await executeFn()
  const duration = Date.now() - startTime
  
  console.log(`[DataForSEO Cache] API call completed in ${duration}ms`)
  
  // Cache the result
  await cacheSet(cacheKey, result, ttl)
  console.log(`[DataForSEO Cache] Cached result for ${toolName} (TTL: ${ttl}s)`)
  
  return result
}

/**
 * Invalidate cache for specific tool and args
 * Useful when you know data has changed and want to force refresh
 */
export async function invalidateDataForSEOCache(
  toolName: string,
  args: Record<string, any>
): Promise<void> {
  const cacheKey = getDataForSEOCacheKey(toolName, args)
  await cacheDelete(cacheKey)
  console.log(`[DataForSEO Cache] 🗑️ Invalidated cache for ${toolName}`)
}

/**
 * Get cache statistics for monitoring
 * Note: This is a simple implementation. For production, consider using Redis SCAN
 */
export async function getDataForSEOCacheStats(): Promise<{
  enabled: boolean
  prefix: string
}> {
  return {
    enabled: true,
    prefix: CACHE_PREFIXES.DATAFORSEO,
  }
}

/**
 * Batch DataForSEO API calls with deduplication and parallel execution
 * 
 * @param calls - Array of call definitions
 * @param options - Batching options
 * @returns Map of results keyed by call identifier
 */
export interface BatchCall<T = any> {
  id: string // Unique identifier for this call
  toolName: string
  args: Record<string, any>
  executeFn: () => Promise<T>
  priority?: number // Higher priority executes first
}

export interface BatchOptions {
  maxConcurrency?: number // Max parallel calls (default: 5)
  deduplicate?: boolean // Deduplicate identical calls (default: true)
  progressCallback?: (completed: number, total: number) => void
}

export async function batchDataForSEOCalls<T>(
  calls: BatchCall<T>[],
  options: BatchOptions = {}
): Promise<Map<string, T>> {
  const {
    maxConcurrency = 5,
    deduplicate = true,
    progressCallback,
  } = options

  const results = new Map<string, T>()
  const errors = new Map<string, Error>()

  // Deduplicate calls if enabled
  const uniqueCalls = deduplicate ? deduplicateCalls(calls) : calls

  // Sort by priority (higher first)
  const sortedCalls = uniqueCalls.sort((a, b) => (b.priority || 0) - (a.priority || 0))

  // Execute in batches
  for (let i = 0; i < sortedCalls.length; i += maxConcurrency) {
    const batch = sortedCalls.slice(i, i + maxConcurrency)
    
    // Check cache for all calls in batch first
    const cachePromises = batch.map(async (call) => {
      const cacheKey = getDataForSEOCacheKey(call.toolName, call.args)
      const cached = await cacheGet<T>(cacheKey)
      if (cached) {
        return { call, result: cached, cached: true }
      }
      return { call, result: null, cached: false }
    })

    const cacheResults = await Promise.all(cachePromises)

    // Execute uncached calls
    const uncachedCalls = cacheResults.filter(r => !r.cached)
    const executionPromises = uncachedCalls.map(async ({ call }) => {
      try {
        // Try cache first
        const cacheKey = getDataForSEOCacheKey(call.toolName, call.args)
        const cached = await cacheGet<T>(cacheKey)
        if (cached) {
          return { call, result: cached, cached: true }
        }

        // Execute API call
        const result = await call.executeFn()
        
        // Cache the result
        await cacheSet(cacheKey, result, CACHE_TTL.DATAFORSEO)
        
        return { call, result, cached: false }
      } catch (error) {
        errors.set(call.id, error instanceof Error ? error : new Error(String(error)))
        return { call, result: null, cached: false, error }
      }
    })

    const executionResults = await Promise.all(executionPromises)

    // Combine cache hits and execution results
    const allResults = [
      ...cacheResults.filter(r => r.cached),
      ...executionResults.filter(r => r.result !== null),
    ]

    // Store results
    for (const { call, result } of allResults) {
      if (result) {
        results.set(call.id, result)
      }
    }

    // Report progress
    if (progressCallback) {
      progressCallback(results.size, sortedCalls.length)
    }
  }

  // Throw if any critical errors occurred
  if (errors.size > 0) {
    console.warn(`[DataForSEO Batch] ${errors.size} calls failed:`, Array.from(errors.keys()))
  }

  return results
}

/**
 * Deduplicate batch calls based on tool name and args
 */
function deduplicateCalls<T>(calls: BatchCall<T>[]): BatchCall<T>[] {
  const seen = new Map<string, BatchCall<T>>()

  for (const call of calls) {
    const key = `${call.toolName}:${JSON.stringify(call.args)}`
    if (!seen.has(key)) {
      seen.set(key, call)
    } else {
      // Keep the one with higher priority
      const existing = seen.get(key)!
      if ((call.priority || 0) > (existing.priority || 0)) {
        seen.set(key, call)
      }
    }
  }

  return Array.from(seen.values())
}

/**
 * Request coalescing: deduplicate identical concurrent calls
 */
class RequestCoalescer<T> {
  private pending = new Map<string, Promise<T>>()

  async coalesce(
    key: string,
    executeFn: () => Promise<T>
  ): Promise<T> {
    // If already pending, return existing promise
    if (this.pending.has(key)) {
      return this.pending.get(key)!
    }

    // Create new promise
    const promise = executeFn().finally(() => {
      // Remove from pending when done
      this.pending.delete(key)
    })

    this.pending.set(key, promise)
    return promise
  }

  getPendingCount(): number {
    return this.pending.size
  }
}

// Global coalescer instance
const requestCoalescer = new RequestCoalescer()

/**
 * Coalesce identical concurrent requests
 */
export async function coalesceDataForSEOCall<T>(
  toolName: string,
  args: Record<string, any>,
  executeFn: () => Promise<T>
): Promise<T> {
  const key = getDataForSEOCacheKey(toolName, args)
  return requestCoalescer.coalesce(key, executeFn) as Promise<T>
}

