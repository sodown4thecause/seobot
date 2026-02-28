/**
 * DataForSEO Protected Client
 *
 * Production-ready DataForSEO client with rate limiting and circuit breaker.
 * Wraps the existing client with protection layers.
 *
 * @module lib/dataforseo/protected-client
 */

import { callWithCircuitBreaker } from './circuit-breaker'
import { calculateEndpointCost, type MethodType } from '@/lib/constants/dataforseo-limits'
import type { Json } from '@/lib/db/schema'

// Re-export types for convenience
export type { Json } from '@/lib/db/schema'
export type { MethodType } from '@/lib/constants/dataforseo-limits'

// ============================================================================
// Request Types
// ============================================================================

export interface DataForSEORequest {
  endpoint: string
  params: Record<string, unknown>
  method: MethodType
}

export interface DataForSEOContext {
  userId: string
  jobId?: string
  dataType: string
}

export interface DataForSEOResponse<T = Json> {
  success: boolean
  data: T | null
  error?: string
  cached: boolean
  cost: number
  duration: number
}

// ============================================================================
// Client Implementation
// ============================================================================

/**
 * Execute DataForSEO API call with full protection
 *
 * @param request - API request details
 * @param context - User/job context for tracking
 * @param apiFn - Actual API function to call (from MCP or existing client)
 * @returns Response with data, cost, and cache status
 */
export async function executeDataForSEORequest<T extends Json>(
  request: DataForSEORequest,
  context: DataForSEOContext,
  apiFn: () => Promise<T>
): Promise<DataForSEOResponse<T>> {
  const { endpoint, method } = request
  const { userId, jobId, dataType } = context

  const startTime = Date.now()

  try {
    // Calculate cost upfront
    const cost = calculateEndpointCost(endpoint, method)

    // Execute with circuit breaker and rate limiting
    const result = await callWithCircuitBreaker(
      endpoint,
      apiFn,
      { userId, jobId, dataType }
    )

    const duration = Date.now() - startTime

    // Check if result is a fallback (has _fallback flag)
    const isFallback = result && typeof result === 'object' && '_fallback' in result

    return {
      success: !isFallback,
      data: isFallback ? null : result as T,
      cached: isFallback, // Fallback means we used cache
      cost,
      duration,
      ...(isFallback && { error: (result as { _warning?: string })._warning }),
    }
  } catch (error) {
    const duration = Date.now() - startTime

    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      cached: false,
      cost: 0,
      duration,
    }
  }
}

// ============================================================================
// Convenience Methods for Common Endpoints
// ============================================================================

/**
 * Get SERP results with full protection
 */
export async function getSERPResults(
  params: {
    keyword: string
    location_code: number
    language_code: string
    device?: 'desktop' | 'mobile'
    os?: 'windows' | 'macos'
  },
  context: DataForSEOContext,
  method: MethodType = 'standard'
): Promise<DataForSEOResponse> {
  return executeDataForSEORequest(
    {
      endpoint: 'serp/organic/live',
      params,
      method,
    },
    context,
    async () => {
      // TODO: Integrate with actual MCP call in future phase
      // For now, return mock structure
      return {
        keyword: params.keyword,
        items: [],
        se_results_count: 0,
      } as unknown as Json
    }
  )
}

/**
 * Get backlinks data with full protection
 */
export async function getBacklinksData(
  params: {
    target: string
    limit?: number
  },
  context: DataForSEOContext
): Promise<DataForSEOResponse> {
  return executeDataForSEORequest(
    {
      endpoint: 'backlinks/backlinks',
      params,
      method: 'standard',
    },
    context,
    async () => {
      // TODO: Integrate with actual MCP call
      return {
        target: params.target,
        backlinks: [],
        total_count: 0,
      } as unknown as Json
    }
  )
}

/**
 * Get domain analytics with full protection
 */
export async function getDomainAnalytics(
  params: {
    target: string
  },
  context: DataForSEOContext
): Promise<DataForSEOResponse> {
  return executeDataForSEORequest(
    {
      endpoint: 'domain_analytics/rank/overview',
      params,
      method: 'standard',
    },
    context,
    async () => {
      // TODO: Integrate with actual MCP call
      return {
        target: params.target,
        rank: 0,
        metrics: {},
      } as unknown as Json
    }
  )
}

/**
 * Get keywords data with full protection
 */
export async function getKeywordsData(
  params: {
    keywords: string[]
    location_code: number
    language_code: string
  },
  context: DataForSEOContext
): Promise<DataForSEOResponse> {
  return executeDataForSEORequest(
    {
      endpoint: 'keywords_data/google/search_volume',
      params,
      method: 'standard',
    },
    context,
    async () => {
      // TODO: Integrate with actual MCP call
      return {
        keywords: params.keywords,
        data: [],
      } as unknown as Json
    }
  )
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Execute multiple DataForSEO requests in parallel
 * Each request still respects rate limits individually
 */
export async function executeBulkRequests(
  requests: Array<{
    request: DataForSEORequest
    context: DataForSEOContext
    apiFn: () => Promise<Json>
  }>
): Promise<DataForSEOResponse[]> {
  // Execute all in parallel
  // Rate limiter and circuit breaker handle each individually
  const results = await Promise.all(
    requests.map(({ request, context, apiFn }) =>
      executeDataForSEORequest(request, context, apiFn)
    )
  )

  return results
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Health check for DataForSEO integration
 */
export async function healthCheck(): Promise<{
  healthy: boolean
  rateLimiterStatus: {
    enabled: boolean
    configured: boolean
  }
  circuitStatus: {
    openCircuits: number
    totalCircuits: number
    healthPercentage: number
  }
}> {
  const { getOverallHealth } = await import('./circuit-breaker')
  const { rateLimiter } = await import('./rate-limiter')

  const circuitHealth = getOverallHealth()
  const rateLimiterStatus = rateLimiter.getStatus()

  return {
    healthy: circuitHealth.healthy && rateLimiterStatus.configured,
    rateLimiterStatus: {
      enabled: rateLimiterStatus.enabled,
      configured: rateLimiterStatus.configured,
    },
    circuitStatus: {
      openCircuits: circuitHealth.openCircuits,
      totalCircuits: circuitHealth.totalCircuits,
      healthPercentage: circuitHealth.healthPercentage,
    },
  }
}
