/**
 * DataForSEO Circuit Breaker
 *
 * Circuit breaker pattern using opossum to prevent cascade failures
 * when DataForSEO API is degraded or unavailable.
 *
 * @module lib/dataforseo/circuit-breaker
 * @see https://github.com/nodeshift/opossum
 */

import CircuitBreaker from 'opossum'
import { getRedisClient, cacheGet, cacheSet } from '@/lib/redis/client'
import { rateLimiter, RateLimitExceededError } from './rate-limiter'
import type { Json } from '@/lib/db/schema'

// ============================================================================
// Circuit Breaker Configuration
// ============================================================================

interface CircuitBreakerConfig {
  /** Timeout for individual requests (ms) */
  timeout: number
  /** Error threshold percentage before opening circuit */
  errorThresholdPercentage: number
  /** Time before attempting to close circuit (ms) */
  resetTimeout: number
  /** Minimum requests before checking error rate */
  volumeThreshold: number
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  timeout: 10000, // 10 seconds
  errorThresholdPercentage: 50, // Open after 50% failure rate
  resetTimeout: 30000, // 30 seconds before half-open
  volumeThreshold: 5, // Minimum 5 requests before checking
}

// ============================================================================
// Circuit Breaker States
// ============================================================================

export type CircuitState = 'closed' | 'open' | 'half-open'

export interface CircuitStatus {
  endpoint: string
  state: CircuitState
  stats: {
    failures: number
    successes: number
    fallbacks: number
    rejects: number
    timeouts: number
  }
  openedAt?: Date
  lastFailure?: Date
}

// ============================================================================
// Circuit Breaker Registry
// ============================================================================

/**
 * Map of circuit breakers by endpoint
 */
const circuits = new Map<string, CircuitBreaker>()

/**
 * Map of circuit status by endpoint
 */
const circuitStatuses = new Map<string, CircuitStatus>()

// ============================================================================
// Circuit Breaker Factory
// ============================================================================

/**
 * Create or get circuit breaker for an endpoint
 */
function getCircuitBreaker(
  endpoint: string,
  config: Partial<CircuitBreakerConfig> = {}
): CircuitBreaker {
  if (circuits.has(endpoint)) {
    return circuits.get(endpoint)!
  }

  const fullConfig = { ...DEFAULT_CONFIG, ...config }

  // Create the circuit breaker
  const breaker = new CircuitBreaker(
    async (fn: () => Promise<unknown>) => fn(),
    {
      timeout: fullConfig.timeout,
      errorThresholdPercentage: fullConfig.errorThresholdPercentage,
      resetTimeout: fullConfig.resetTimeout,
      volumeThreshold: fullConfig.volumeThreshold,
      name: `dataforseo-${endpoint}`,
    }
  )

  // Initialize status
  circuitStatuses.set(endpoint, {
    endpoint,
    state: 'closed',
    stats: {
      failures: 0,
      successes: 0,
      fallbacks: 0,
      rejects: 0,
      timeouts: 0,
    },
  })

  // Event handlers
  breaker.on('open', () => {
    const status = circuitStatuses.get(endpoint)
    if (status) {
      status.state = 'open'
      status.openedAt = new Date()
    }
    console.warn(`[CircuitBreaker] Circuit OPEN for ${endpoint}`)
  })

  breaker.on('halfOpen', () => {
    const status = circuitStatuses.get(endpoint)
    if (status) {
      status.state = 'half-open'
    }
    console.log(`[CircuitBreaker] Circuit HALF-OPEN for ${endpoint} - testing...`)
  })

  breaker.on('close', () => {
    const status = circuitStatuses.get(endpoint)
    if (status) {
      status.state = 'closed'
      status.openedAt = undefined
    }
    console.log(`[CircuitBreaker] Circuit CLOSED for ${endpoint} - healthy`)
  })

  breaker.on('fallback', (result) => {
    const status = circuitStatuses.get(endpoint)
    if (status) {
      status.stats.fallbacks++
    }
    console.log(`[CircuitBreaker] Fallback executed for ${endpoint}`)
  })

  breaker.on('failure', (error) => {
    const status = circuitStatuses.get(endpoint)
    if (status) {
      status.stats.failures++
      status.lastFailure = new Date()
    }
    console.error(`[CircuitBreaker] Failure for ${endpoint}:`, error)
  })

  breaker.on('success', () => {
    const status = circuitStatuses.get(endpoint)
    if (status) {
      status.stats.successes++
    }
  })

  breaker.on('timeout', () => {
    const status = circuitStatuses.get(endpoint)
    if (status) {
      status.stats.timeouts++
    }
    console.warn(`[CircuitBreaker] Timeout for ${endpoint}`)
  })

  breaker.on('reject', () => {
    const status = circuitStatuses.get(endpoint)
    if (status) {
      status.stats.rejects++
    }
    console.warn(`[CircuitBreaker] Request rejected for ${endpoint} (circuit open)`)
  })

  circuits.set(endpoint, breaker)
  return breaker
}

// ============================================================================
// Fallback Functions
// ============================================================================

/**
 * Get cached data from Redis as fallback
 */
async function getCachedFallback(
  userId: string,
  dataType: string
): Promise<Json | null> {
  try {
    const cacheKey = `dashboard:${userId}:${dataType}`
    const cached = await cacheGet<Json>(cacheKey)

    if (cached) {
      console.log(`[CircuitBreaker] Fallback: Using cached data for ${dataType}`)
      return cached
    }

    return null
  } catch (error) {
    console.error('[CircuitBreaker] Failed to get cached fallback:', error)
    return null
  }
}

/**
 * Create empty result with warning flag
 */
function createEmptyResult(dataType: string): Json {
  return {
    _warning: `Data unavailable - DataForSEO API temporarily unavailable for ${dataType}`,
    _fallback: true,
    _timestamp: new Date().toISOString(),
    data: {},
  }
}

// ============================================================================
// Main Execution Function
// ============================================================================

interface CallContext {
  userId: string
  jobId?: string
  dataType: string
}

/**
 * Execute DataForSEO API call with rate limiting and circuit breaker
 *
 * @param endpoint - DataForSEO endpoint
 * @param fn - Function to execute
 * @param context - Call context (userId, jobId, dataType)
 * @returns API response data
 */
export async function callWithCircuitBreaker<T extends Json>(
  endpoint: string,
  fn: () => Promise<T>,
  context: CallContext
): Promise<T> {
  const { userId, jobId, dataType } = context

  // Step 1: Check rate limit before attempting call
  try {
    await rateLimiter.consumeToken(endpoint)
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      // Rate limit exceeded - try cached fallback
      const cached = await getCachedFallback(userId, dataType)
      if (cached) {
        return cached as T
      }

      // No cached data - throw rate limit error
      throw error
    }

    // Other rate limiter errors - log and continue
    console.error('[CircuitBreaker] Rate limiter error:', error)
  }

  // Step 2: Get or create circuit breaker
  const breaker = getCircuitBreaker(endpoint)

  // Step 3: Define fallback function
  const fallback = async (): Promise<T> => {
    console.warn(`[CircuitBreaker] Executing fallback for ${endpoint}`)

    // Try to get cached data
    const cached = await getCachedFallback(userId, dataType)
    if (cached) {
      return cached as T
    }

    // Return empty result with warning
    return createEmptyResult(dataType) as T
  }

  // Step 4: Execute with circuit breaker
  try {
    const result = await breaker.fire(fn)

    // Cache successful result
    try {
      const cacheKey = `dashboard:${userId}:${dataType}`
      await cacheSet(cacheKey, result, 60 * 60 * 24) // 24 hour TTL
    } catch (cacheError) {
      console.error('[CircuitBreaker] Failed to cache result:', cacheError)
    }

    return result as T
  } catch (error) {
    // Circuit breaker triggered - fallback should have been called
    console.error(`[CircuitBreaker] Call failed for ${endpoint}:`, error)

    // Try fallback manually
    return fallback()
  }
}

// ============================================================================
// Status and Monitoring
// ============================================================================

/**
 * Get circuit breaker status for an endpoint
 */
export function getCircuitStatus(endpoint: string): CircuitStatus | null {
  return circuitStatuses.get(endpoint) || null
}

/**
 * Get all circuit breaker statuses
 */
export function getAllCircuitStatuses(): CircuitStatus[] {
  return Array.from(circuitStatuses.values())
}

/**
 * Force open a circuit (for testing or emergency)
 */
export function forceOpenCircuit(endpoint: string): void {
  const breaker = circuits.get(endpoint)
  if (breaker) {
    breaker.open()
  }
}

/**
 * Force close a circuit (for testing or recovery)
 */
export function forceCloseCircuit(endpoint: string): void {
  const breaker = circuits.get(endpoint)
  if (breaker) {
    breaker.close()
  }
}

/**
 * Shutdown all circuit breakers
 */
export function shutdownCircuits(): void {
  circuits.forEach((breaker, endpoint) => {
    breaker.shutdown()
    console.log(`[CircuitBreaker] Shutdown circuit for ${endpoint}`)
  })
  circuits.clear()
  circuitStatuses.clear()
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if circuit is open for an endpoint
 */
export function isCircuitOpen(endpoint: string): boolean {
  const breaker = circuits.get(endpoint)
  if (!breaker) {
    return false
  }

  return breaker.opened
}

/**
 * Get circuit breaker stats
 */
export function getCircuitStats(endpoint: string): {
  state: CircuitState
  stats: CircuitStatus['stats']
} | null {
  const status = circuitStatuses.get(endpoint)
  if (!status) {
    return null
  }

  return {
    state: status.state,
    stats: status.stats,
  }
}

/**
 * Health check for DataForSEO endpoints
 * Returns healthy if most circuits are closed
 */
export function getOverallHealth(): {
  healthy: boolean
  openCircuits: number
  totalCircuits: number
  healthPercentage: number
} {
  const statuses = getAllCircuitStatuses()
  const total = statuses.length

  if (total === 0) {
    return {
      healthy: true,
      openCircuits: 0,
      totalCircuits: 0,
      healthPercentage: 100,
    }
  }

  const openCount = statuses.filter((s) => s.state === 'open').length
  const healthPercentage = ((total - openCount) / total) * 100

  return {
    healthy: openCount === 0 || healthPercentage >= 80,
    openCircuits: openCount,
    totalCircuits: total,
    healthPercentage,
  }
}
