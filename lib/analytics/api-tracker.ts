/**
 * API Analytics Tracker
 * 
 * Tracks API calls to external services.
 * NOTE: This requires api_usage_logs table in the database schema.
 * Currently logs to console only until the table is added to lib/db/schema.ts
 * 
 * TODO: Add api_usage_logs table to lib/db/schema.ts and implement with Drizzle ORM
 */

export type APIService =
  | 'dataforseo'
  | 'perplexity'
  | 'openai'
  | 'firecrawl'
  | 'rytr'
  | 'winston'
  | 'jina'
  | 'rate-limit'
  | 'gemini'

interface APICallMetadata {
  service: APIService
  endpoint: string
  method: string
  statusCode?: number
  tokensUsed?: number
  costUSD?: number
  durationMs?: number
  metadata?: Record<string, any>
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

  // For other services, use first available cost
  const firstCost = Object.values(costs)[0]
  return (tokensOrUnits / 1000) * firstCost
}

/**
 * Track an API call
 * Currently logs to console - will save to database when api_usage_logs table exists
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

    // Log to console (database logging disabled until table is added)
    console.log(`[API Tracker] ${metadata.service}:${metadata.endpoint}`, {
      userId,
      method: metadata.method,
      statusCode: metadata.statusCode,
      tokensUsed: metadata.tokensUsed ?? 0,
      costUSD: cost,
      durationMs: metadata.durationMs,
    })

    // TODO: When api_usage_logs table is added to schema, insert here:
    // await db.insert(apiUsageLogs).values({
    //   userId,
    //   service: metadata.service,
    //   endpoint: metadata.endpoint,
    //   method: metadata.method,
    //   statusCode: metadata.statusCode,
    //   tokensUsed: metadata.tokensUsed ?? 0,
    //   costUsd: cost,
    //   durationMs: metadata.durationMs,
    //   metadata: metadata.metadata ?? {},
    // })

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
  } catch (error: any) {
    statusCode = error.status ?? 500
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
