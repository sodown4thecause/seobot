/**
 * DataForSEO API Client
 *
 * Base client for making requests to DataForSEO API
 * Used by all modules in the dataforseo package
 */

import { serverEnv } from '@/lib/config/env'
import type { DataForSEOResponse } from './types'
import type { ApiError } from '@/lib/types/api-responses'
import { BASE_URL } from './constants'
import { getRedisClient, cacheGet, cacheSet, CACHE_PREFIXES } from '@/lib/redis/client'

// ============================================================================
// CLIENT CONFIGURATION
// ============================================================================

function getAuthHeader(): string {
  const auth = Buffer.from(
    `${serverEnv.DATAFORSEO_LOGIN}:${serverEnv.DATAFORSEO_PASSWORD}`
  ).toString('base64')
  return `Basic ${auth}`
}

// ============================================================================
// CACHE HELPERS
// ============================================================================

function getCacheKey(endpoint: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key]
      return result
    }, {} as Record<string, any>)

  const paramString = JSON.stringify(sortedParams)
  const hash = Buffer.from(paramString).toString('base64').slice(0, 16)
  return `${CACHE_PREFIXES.DATAFORSEO}${endpoint}:${hash}`
}

// ============================================================================
// REQUEST EXECUTION
// ============================================================================

async function doFetch<T>(
  endpoint: string,
  params: Record<string, any>,
  cacheTTL?: number
): Promise<DataForSEOResponse<T>> {
  try {
    // Check Redis cache first
    const cacheKey = getCacheKey(endpoint, params)
    const redis = getRedisClient()

    if (redis && cacheTTL) {
      const cached = await cacheGet<DataForSEOResponse<T>>(cacheKey)
      if (cached) {
        console.log(`[DataForSEO] Cache hit for ${endpoint}`)
        return cached
      }
    }

    // Make API request
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([params]),
    })

    if (!res.ok) {
      const text = await res.text()
      const error: ApiError = {
        code: 'DATAFORSEO_HTTP_ERROR',
        message: `HTTP ${res.status}: ${text}`,
        statusCode: res.status,
      }
      return { success: false, error }
    }

    const json = (await res.json()) as { tasks: Array<{ id?: string; status?: string; result?: T; error?: ApiError }> }
    const result: DataForSEOResponse<T> = { success: true, data: json }

    // Cache successful responses
    if (redis && cacheTTL && result.success) {
      await cacheSet(cacheKey, result, cacheTTL)
    }

    return result
  } catch (e: any) {
    const error: ApiError = {
      code: 'DATAFORSEO_NETWORK_ERROR',
      message: e?.message ?? 'Network error',
      statusCode: 0,
    }
    return { success: false, error }
  }
}

// ============================================================================
// WRAPPER FUNCTIONS FOR DIFFERENT CACHE TTL
// ============================================================================

export async function fetchWithShortCache<T>(
  endpoint: string,
  params: Record<string, any>
): Promise<DataForSEOResponse<T>> {
  return doFetch<T>(endpoint, params, 60 * 60) // 1 hour
}

export async function fetchWithMediumCache<T>(
  endpoint: string,
  params: Record<string, any>
): Promise<DataForSEOResponse<T>> {
  return doFetch<T>(endpoint, params, 60 * 60 * 12) // 12 hours
}

export async function fetchWithLongCache<T>(
  endpoint: string,
  params: Record<string, any>
): Promise<DataForSEOResponse<T>> {
  return doFetch<T>(endpoint, params, 60 * 60 * 24) // 24 hours
}

export async function fetchWithVeryLongCache<T>(
  endpoint: string,
  params: Record<string, any>
): Promise<DataForSEOResponse<T>> {
  return doFetch<T>(endpoint, params, 60 * 60 * 24 * 7) // 7 days
}

export async function fetchWithoutCache<T>(
  endpoint: string,
  params: Record<string, any>
): Promise<DataForSEOResponse<T>> {
  return doFetch<T>(endpoint, params, undefined)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build request parameters with defaults
 */
export function buildParams(
  baseParams: Record<string, any>,
  defaults: Record<string, any> = {}
): Record<string, any> {
  return {
    ...defaults,
    ...baseParams,
  }
}

/**
 * Format error message from API response
 */
export function formatError(error: ApiError): string {
  return `${error.code}: ${error.message}`
}

/**
 * Check if response is successful
 */
export function isSuccess<T>(response: DataForSEOResponse<T>): response is DataForSEOResponse<T> & {
  success: true
  data: T
} {
  return response.success === true && !!response.data
}

/**
 * Extract result from successful response
 */
export function extractResult<T>(response: DataForSEOResponse<T>): T | null {
  if (!isSuccess(response)) {
    return null
  }
  return response.data
}

/**
 * Get first task result from response
 */
export function getFirstTaskResult<T>(response: DataForSEOResponse<T>): T | null {
  if (!isSuccess(response) || !response.data?.tasks?.[0]?.result) {
    return null
  }
  return response.data.tasks[0].result
}

// ============================================================================
// EXPORTS
// ============================================================================

export const dataForSEOClient = {
  fetchWithShortCache,
  fetchWithMediumCache,
  fetchWithLongCache,
  fetchWithVeryLongCache,
  fetchWithoutCache,
  buildParams,
  formatError,
  isSuccess,
  extractResult,
  getFirstTaskResult,
}

export default dataForSEOClient
