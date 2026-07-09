/**
 * API Analytics Tracker
 * 
 * Tracks API calls to external services.
 */

import { db } from '@/lib/db'
import { apiUsageEvents, type Json } from '@/lib/db/schema'

export type APIService =
  | 'dataforseo'
  | 'perplexity'
  | 'openai'
  | 'firecrawl'
  | 'rytr'
  | 'winston'
  | 'jina'
  | 'aisa'
  | 'rate-limit'
  | 'gemini'
  | 'exa'
  | 'socialdata'
  | 'grok'

interface APICallMetadata {
  service: APIService
  endpoint: string
  method: string
  statusCode?: number
  tokensUsed?: number
  costUSD?: number
  durationMs?: number
  metadata?: Record<string, unknown>
}

// Cost per 1K tokens/requests for each service
const SERVICE_COSTS: Record<APIService, Record<string, number>> = {
  openai: {
    'gpt-4o-mini-input': 0.00015, // per 1K tokens
    'gpt-4o-mini-output': 0.0006, // per 1K tokens
    'text-embedding-ada-002': 0.0001, // per 1K tokens
  },
  perplexity: {
    'sonar-pro': 0.003, // per 1K tokens
    'sonar': 0.001, // per 1K tokens
  },
  dataforseo: {
    'serp': 0.0025, // per request
    'keywords': 0.001, // per request
    'backlinks': 0.005, // per request
  },
  firecrawl: {
    'scrape': 0.001, // per page
    'crawl': 0.0005, // per page
  },
  jina: {
    'reader': 0.0001, // per request
  },
  aisa: {
    'dataforseo': 0.005, // fallback per request when provider cost is unavailable
    'twitter': 0.001,
    'default': 0.001,
  },
  rytr: {
    'generate': 0.002, // per 1K chars
  },
  winston: {
    'detect': 0.001, // per request
  },
  gemini: {
    'gemini-2.0-flash': 0.0001, // per 1K tokens (input)
    'gemini-2.5-flash': 0.00015, // per 1K tokens (input)
    'gemini-2.5-pro': 0.00125, // per 1K tokens (input)
  },
  'rate-limit': {
    'default': 0, // no cost for rate limit tracking
  },
  exa: {
    'search': 0.001,
  },
  socialdata: {
    'twitter': 0.0035,
    'default': 0.0035,
  },
  grok: {
    'default': 0.002,
  },
}

/**
 * Calculate cost based on service and usage
 */
export function calculateCost(
  service: APIService,
  endpoint: string,
  tokensOrUnits: number
): number {
  const costs = SERVICE_COSTS[service]
  if (!costs) return 0

  // For OpenAI, use specific model costs
  if (service === 'openai') {
    if (endpoint.includes('embedding')) {
      return (tokensOrUnits / 1000) * costs['text-embedding-ada-002']
    }
    // Default to gpt-4o-mini input cost
    return (tokensOrUnits / 1000) * costs['gpt-4o-mini-input']
  }

  const matchedKey = Object.keys(costs).find(key => key !== 'default' && endpoint.includes(key))
  const cost = matchedKey
    ? costs[matchedKey]
    : (costs['default'] ?? Object.values(costs)[0])
  return (tokensOrUnits / 1000) * cost
}

/**
 * Track an API call. Tracking failures are intentionally non-blocking.
 */
export async function trackAPICall(
  userId: string,
  metadata: APICallMetadata
): Promise<void> {
  try {
    // Calculate cost if not provided
    const cost = metadata.costUSD ?? calculateCost(
      metadata.service,
      metadata.endpoint,
      metadata.tokensUsed ?? 1000
    )

    await db.insert(apiUsageEvents).values({
      userId,
      provider: metadata.service,
      endpoint: metadata.endpoint,
      method: metadata.method,
      costUsd: cost,
      metadata: {
        statusCode: metadata.statusCode,
        tokensUsed: metadata.tokensUsed ?? 0,
        durationMs: metadata.durationMs,
        ...(metadata.metadata ?? {}),
      } as Json,
      createdAt: new Date(),
    })

    console.log(`[API Tracker] ${metadata.service}:${metadata.endpoint}`, {
      userId,
      method: metadata.method,
      statusCode: metadata.statusCode,
      tokensUsed: metadata.tokensUsed ?? 0,
      costUSD: cost,
      durationMs: metadata.durationMs,
    })

  } catch (error) {
    console.error('[API Tracker] Failed to log API call:', error)
    // Don't throw - tracking failures shouldn't break the app
  }
}

/**
 * Wrapper for tracking API calls with automatic timing
 */
export async function trackAPICallWithTiming<T>(
  userId: string,
  service: APIService,
  endpoint: string,
  method: string,
  apiCall: () => Promise<T>,
  calculateTokens?: (result: T) => number
): Promise<T> {
  const startTime = Date.now()
  let statusCode = 200
  let result: T | undefined

  try {
    result = await apiCall()
    return result
  } catch (error) {
    statusCode = typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
      ? error.status
      : 500
    throw error
  } finally {
    const durationMs = Date.now() - startTime
    const tokensUsed = result !== undefined && calculateTokens ? calculateTokens(result) : undefined

    await trackAPICall(userId, {
      service,
      endpoint,
      method,
      statusCode,
      tokensUsed,
      durationMs,
    })
  }
}
