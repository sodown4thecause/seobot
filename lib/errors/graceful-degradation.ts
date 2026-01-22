/**
 * Graceful Degradation Service
 * 
 * Provides fallback strategies when APIs fail, including:
 * - Cached result usage
 * - Partial completion handling
 * - Provider-specific fallbacks
 */

import { isRetryable } from './types'
import { cacheGet } from '@/lib/redis/client'
import { dataForSEOCache } from '@/lib/utils/cache'


export interface FallbackStrategy {
  useCache: boolean
  usePartialResults: boolean
  alternativeProvider?: string
  waitAndRetry?: number // milliseconds
}

export interface DegradationResult<T> {
  success: boolean
  data?: T
  cached: boolean
  partial: boolean
  fallbackUsed: string
  error?: string
}

/**
 * Provider-specific fallback strategies
 */
const FALLBACK_STRATEGIES: Record<string, FallbackStrategy> = {
  dataforseo: {
    useCache: true,
    usePartialResults: false,
    waitAndRetry: 5000, // 5 seconds for rate limits
  },
  firecrawl: {
    useCache: true,
    usePartialResults: true, // Can use partial crawl results
    waitAndRetry: 3000,
  },
  perplexity: {
    useCache: true,
    usePartialResults: false,
    alternativeProvider: 'perplexity', // Could fallback to direct search
  },
  jina: {
    useCache: true,
    usePartialResults: true, // Can use partial extraction
    waitAndRetry: 2000,
  },
  openai: {
    useCache: true,
    usePartialResults: false,
    waitAndRetry: 10000, // Longer wait for OpenAI
  },
  gemini: {
    useCache: true,
    usePartialResults: false,
    waitAndRetry: 5000,
  },
}

/**
 * Attempt graceful degradation for a failed API call
 */
export async function attemptGracefulDegradation<T>(
  provider: string,
  operation: string,
  params: Record<string, unknown>,
  error: unknown
): Promise<DegradationResult<T>> {

  const strategy = FALLBACK_STRATEGIES[provider.toLowerCase()] || {
    useCache: true,
    usePartialResults: false,
  }

  // Check if error is retryable
  if (isRetryable(error) && strategy.waitAndRetry) {
    return {
      success: false,
      cached: false,
      partial: false,
      fallbackUsed: 'wait_and_retry',
      error: `Retryable error - wait ${strategy.waitAndRetry}ms before retry`,
    }
  }

  // Try cache fallback
  if (strategy.useCache) {
    const cachedResult = await tryCacheFallback<T>(provider, operation, params)
    if (cachedResult) {
      return {
        success: true,
        data: cachedResult,
        cached: true,
        partial: false,
        fallbackUsed: 'cache',
      }
    }
  }

  // Try partial results if available
  if (strategy.usePartialResults) {
    const partialResult = await tryPartialResults<T>(provider, operation, params, error)
    if (partialResult) {
      return {
        success: true,
        data: partialResult,
        cached: false,
        partial: true,
        fallbackUsed: 'partial_results',
      }
    }
  }

  // No fallback available
  return {
    success: false,
    cached: false,
    partial: false,
    fallbackUsed: 'none',
    error: error instanceof Error ? error.message : 'Unknown error',
  }
}

/**
 * Try to get cached result as fallback
 */
async function tryCacheFallback<T>(
  provider: string,
  operation: string,
  params: Record<string, unknown>
): Promise<T | null> {

  try {
    // Generate cache key similar to how the original call would
    const cacheKey = generateCacheKey(provider, operation, params)

    // Try Redis cache first
    const redisResult = await cacheGet<T>(cacheKey)
    if (redisResult) {
      console.log(`[GracefulDegradation] Cache hit from Redis for ${provider}:${operation}`)
      return redisResult
    }

    // Try in-memory cache
    if (provider === 'dataforseo') {
      const memoryResult = dataForSEOCache.get(cacheKey)
      if (memoryResult) {
        console.log(`[GracefulDegradation] Cache hit from memory for ${provider}:${operation}`)
        return memoryResult as T
      }
    }
  } catch (error) {
    console.warn(`[GracefulDegradation] Cache lookup failed:`, error)
  }

  return null
}

/**
 * Try to extract partial results from error or previous state
 */
async function tryPartialResults<T>(
  provider: string,
  operation: string,
  _params: Record<string, unknown>,
  error: unknown
): Promise<T | null> {
  // For Firecrawl, check if we have partial crawl results
  if (provider === 'firecrawl' && operation.includes('crawl')) {
    // Check if error contains partial data
    if (error && typeof error === 'object' && 'partialData' in error) {
      console.log(`[GracefulDegradation] Using partial results for ${provider}:${operation}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (error as any).partialData as T
    }
  }

  // For Jina, check if we have partial extraction
  if (provider === 'jina' && operation.includes('extract')) {
    if (error && typeof error === 'object' && 'partialData' in error) {
      console.log(`[GracefulDegradation] Using partial extraction for ${provider}:${operation}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (error as any).partialData as T
    }
  }

  return null
}


/**
 * Generate cache key for provider/operation/params
 */
function generateCacheKey(provider: string, operation: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key]
      return acc
    }, {} as Record<string, unknown>)


  const paramsString = JSON.stringify(sortedParams)
  return `${provider}:${operation}:${paramsString}`
}

/**
 * Check if operation can be degraded gracefully
 */
export function canDegradeGracefully(provider: string, error: unknown): boolean {
  const strategy = FALLBACK_STRATEGIES[provider.toLowerCase()]
  if (!strategy) return false

  // Can degrade if cache is available or partial results are allowed
  return strategy.useCache || strategy.usePartialResults
}

/**
 * Get suggested fallback action for an error
 */
export function getFallbackSuggestion(provider: string, error: unknown): string | null {
  const strategy = FALLBACK_STRATEGIES[provider.toLowerCase()]
  if (!strategy) return null

  if (isRetryable(error) && strategy.waitAndRetry) {
    return `Wait ${strategy.waitAndRetry / 1000} seconds and retry`
  }

  if (strategy.useCache) {
    return 'Try using cached results'
  }

  if (strategy.usePartialResults) {
    return 'Partial results may be available'
  }

  return null
}

/**
 * Wrap an API call with graceful degradation
 */
export async function withGracefulDegradation<T>(
  provider: string,
  operation: string,
  apiCall: () => Promise<T>,
  params: Record<string, unknown> = {}
): Promise<DegradationResult<T>> {

  try {
    const result = await apiCall()
    return {
      success: true,
      data: result,
      cached: false,
      partial: false,
      fallbackUsed: 'none',
    }
  } catch (error) {
    console.warn(`[GracefulDegradation] ${provider}:${operation} failed, attempting fallback:`, error)

    const degradationResult = await attemptGracefulDegradation<T>(
      provider,
      operation,
      params,
      error
    )

    if (!degradationResult.success) {
      // If degradation failed, throw original error
      throw error
    }

    return degradationResult
  }
}

