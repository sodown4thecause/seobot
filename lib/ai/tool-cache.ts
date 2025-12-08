/**
 * Tool Cache for MCP and Codemode Tool Registries
 * 
 * Provides two-level caching (in-memory + Redis) for expensive tool loading operations.
 * This dramatically reduces response time by avoiding repeated MCP server calls.
 */

import { cacheGet, cacheSet, CACHE_PREFIXES, CACHE_TTL } from '@/lib/redis/client'

// In-memory cache for ultra-fast access (first level)
const memoryCache = new Map<string, { data: any; expires: number }>()

// Track in-flight promises to prevent duplicate loads
const inFlightPromises = new Map<string, Promise<any>>()

// Cache keys
const CACHE_KEYS = {
  DATAFORSEO_TOOLS: `${CACHE_PREFIXES.DATAFORSEO}tools`,
  FIRECRAWL_TOOLS: 'mcp:firecrawl:tools',
  WINSTON_TOOLS: 'mcp:winston:tools',
  JINA_TOOLS: 'mcp:jina:tools',
  CODEMODE_REGISTRY: 'codemode:registry',
} as const

// TTL for tool caches (1 hour - tools rarely change)
const TOOL_CACHE_TTL = 60 * 60 // 1 hour in seconds

/**
 * Get cached value from memory or Redis
 */
async function getCached<T>(key: string): Promise<T | null> {
  // Check memory cache first
  const memoryEntry = memoryCache.get(key)
  if (memoryEntry && memoryEntry.expires > Date.now()) {
    return memoryEntry.data as T
  }

  // Check Redis cache
  const redisValue = await cacheGet<T>(key)
  if (redisValue) {
    // Populate memory cache
    memoryCache.set(key, {
      data: redisValue,
      expires: Date.now() + TOOL_CACHE_TTL * 1000,
    })
    return redisValue
  }

  return null
}

/**
 * Set cached value in both memory and Redis
 */
async function setCached<T>(key: string, value: T): Promise<void> {
  // Set in memory cache
  memoryCache.set(key, {
    data: value,
    expires: Date.now() + TOOL_CACHE_TTL * 1000,
  })

  // Set in Redis cache
  await cacheSet(key, value, TOOL_CACHE_TTL)
}

/**
 * Clear cache for a specific key
 */
export async function clearToolCache(key: keyof typeof CACHE_KEYS): Promise<void> {
  const cacheKey = CACHE_KEYS[key]
  memoryCache.delete(cacheKey)
  // Redis deletion is handled by TTL, but we could add explicit deletion if needed
}

/**
 * Clear all tool caches
 */
export function clearAllToolCaches(): void {
  memoryCache.clear()
}

/**
 * Get cached DataForSEO tools or load fresh
 */
export async function getCachedDataForSEOTools(): Promise<Record<string, any>> {
  const cacheKey = CACHE_KEYS.DATAFORSEO_TOOLS
  
  // Check if already loading
  const inFlight = inFlightPromises.get(cacheKey)
  if (inFlight) {
    console.log('[Tool Cache] ⏳ DataForSEO tools already loading, waiting...')
    return inFlight
  }

  // Check cache
  const cached = await getCached<Record<string, any>>(cacheKey)
  if (cached) {
    console.log('[Tool Cache] ✓ DataForSEO tools loaded from cache')
    return cached
  }

  // Start loading and track promise
  console.log('[Tool Cache] Loading fresh DataForSEO tools...')
  const loadPromise = (async () => {
    try {
      const { getDataForSEOTools } = await import('@/lib/mcp/dataforseo-client')
      const tools = await getDataForSEOTools()
      await setCached(cacheKey, tools)
      return tools
    } finally {
      // Remove from in-flight tracking
      inFlightPromises.delete(cacheKey)
    }
  })()
  
  inFlightPromises.set(cacheKey, loadPromise)
  return loadPromise
}

/**
 * Get cached Firecrawl tools or load fresh
 */
export async function getCachedFirecrawlTools(): Promise<Record<string, any>> {
  const cacheKey = CACHE_KEYS.FIRECRAWL_TOOLS
  
  // Check if already loading
  const inFlight = inFlightPromises.get(cacheKey)
  if (inFlight) {
    console.log('[Tool Cache] ⏳ Firecrawl tools already loading, waiting...')
    return inFlight
  }

  // Check cache
  const cached = await getCached<Record<string, any>>(cacheKey)
  if (cached) {
    console.log('[Tool Cache] ✓ Firecrawl tools loaded from cache')
    return cached
  }

  // Start loading and track promise
  console.log('[Tool Cache] Loading fresh Firecrawl tools...')
  const loadPromise = (async () => {
    try {
      const { getFirecrawlTools } = await import('@/lib/mcp/firecrawl-client')
      const tools = await getFirecrawlTools()
      await setCached(cacheKey, tools)
      return tools
    } finally {
      inFlightPromises.delete(cacheKey)
    }
  })()
  
  inFlightPromises.set(cacheKey, loadPromise)
  return loadPromise
}

/**
 * Get cached Winston tools or load fresh
 */
export async function getCachedWinstonTools(): Promise<Record<string, any>> {
  const cacheKey = CACHE_KEYS.WINSTON_TOOLS
  
  // Check if already loading
  const inFlight = inFlightPromises.get(cacheKey)
  if (inFlight) {
    console.log('[Tool Cache] ⏳ Winston tools already loading, waiting...')
    return inFlight
  }

  // Check cache
  const cached = await getCached<Record<string, any>>(cacheKey)
  if (cached) {
    console.log('[Tool Cache] ✓ Winston tools loaded from cache')
    return cached
  }

  // Start loading and track promise
  console.log('[Tool Cache] Loading fresh Winston tools...')
  const loadPromise = (async () => {
    try {
      const { getWinstonTools } = await import('@/lib/mcp/winston-client')
      const tools = await getWinstonTools()
      await setCached(cacheKey, tools)
      return tools
    } finally {
      inFlightPromises.delete(cacheKey)
    }
  })()
  
  inFlightPromises.set(cacheKey, loadPromise)
  return loadPromise
}

/**
 * Get cached Jina tools or load fresh
 */
export async function getCachedJinaTools(): Promise<Record<string, any>> {
  const cacheKey = CACHE_KEYS.JINA_TOOLS
  
  // Check if already loading
  const inFlight = inFlightPromises.get(cacheKey)
  if (inFlight) {
    console.log('[Tool Cache] ⏳ Jina tools already loading, waiting...')
    return inFlight
  }

  // Check cache
  const cached = await getCached<Record<string, any>>(cacheKey)
  if (cached) {
    console.log('[Tool Cache] ✓ Jina tools loaded from cache')
    return cached
  }

  // Start loading and track promise
  console.log('[Tool Cache] Loading fresh Jina tools...')
  const loadPromise = (async () => {
    try {
      const { getJinaTools } = await import('@/lib/mcp/jina-client')
      const tools = await getJinaTools()
      await setCached(cacheKey, tools)
      return tools
    } finally {
      inFlightPromises.delete(cacheKey)
    }
  })()
  
  inFlightPromises.set(cacheKey, loadPromise)
  return loadPromise
}

/**
 * Get cached codemode registry or build fresh
 * Note: Codemode module is not yet implemented, returns empty registry
 */
export async function getCachedCodemodeRegistry(): Promise<Record<string, unknown>> {
  // TODO: Implement codemode module when needed
  console.log('[Tool Cache] Codemode registry not yet implemented, returning empty')
  return {}
}

/**
 * Prewarm all tool caches (for background initialization)
 */
export async function prewarmToolCaches(): Promise<void> {
  console.log('[Tool Cache] Starting prewarm...')
  const startTime = Date.now()

  // Load all tools in parallel
  const results = await Promise.allSettled([
    getCachedDataForSEOTools().catch((err) => {
      console.warn('[Tool Cache] Failed to prewarm DataForSEO tools:', err)
      return {}
    }),
    getCachedFirecrawlTools().catch((err) => {
      console.warn('[Tool Cache] Failed to prewarm Firecrawl tools:', err)
      return {}
    }),
    getCachedWinstonTools().catch((err) => {
      console.warn('[Tool Cache] Failed to prewarm Winston tools:', err)
      return {}
    }),
    getCachedJinaTools().catch((err) => {
      console.warn('[Tool Cache] Failed to prewarm Jina tools:', err)
      return {}
    }),
    getCachedCodemodeRegistry().catch((err) => {
      console.warn('[Tool Cache] Failed to prewarm codemode registry:', err)
      return {}
    }),
  ])

  const duration = Date.now() - startTime
  const successCount = results.filter((r) => r.status === 'fulfilled').length
  
  console.log(`[Tool Cache] Prewarm completed in ${duration}ms (${successCount}/5 successful)`)
}

