/**
 * DataForSEO Rate Limit Constants
 *
 * Per-endpoint rate limits based on official DataForSEO API documentation.
 * Using these limits prevents 429 errors and optimizes cost.
 *
 * @module lib/constants/dataforseo-limits
 * @see https://docs.dataforseo.com/v3/appendix/errors
 */

// ============================================================================
// Rate Limit Tiers (requests per minute)
// ============================================================================

export const RATE_LIMITS = {
  /**
   * Most endpoints: 2000 requests per minute
   * SERP, Backlinks, Domain Analytics, etc.
   */
  GENERAL: 2000,

  /**
   * Live Google Ads: 12 requests per minute
   * High-cost, real-time endpoints
   */
  LIVE_GOOGLE_ADS: 12,

  /**
   * User Data endpoints: 6 requests per minute
   * Business Data, Keywords Data (historical)
   */
  USER_DATA: 6,

  /**
   * Tasks Ready polling: 20 requests per minute
   * Free endpoint for checking task completion
   */
  TASKS_READY: 20,

  /**
   * Database endpoints: max 30 simultaneous requests
   * Backlinks, Bulk operations
   */
  DATABASE_MAX_SIMULTANEOUS: 30,
} as const

export type RateLimitTier = keyof typeof RATE_LIMITS

// ============================================================================
// Method Cost Constants (USD per request/task)
// ============================================================================

export const METHOD_COSTS = {
  /**
   * Standard method: POST task, poll for completion, GET results
   * Cost: $0.001 per task (bulk operations)
   */
  STANDARD: 0.001,

  /**
   * Live method: Real-time results in single request
   * Cost: $0.005 per request (5x more expensive)
   */
  LIVE: 0.005,

  /**
   * Backlinks endpoints (both standard and live)
   * Cost: $0.01 per request
   */
  BACKLINKS: 0.01,

  /**
   * SERP Live endpoints
   * Cost: $0.005 per request
   */
  SERP_LIVE: 0.005,

  /**
   * Keywords Data endpoints
   * Cost: $0.001 per task
   */
  KEYWORDS: 0.001,
} as const

export type MethodType = 'standard' | 'live'

// ============================================================================
// Endpoint to Rate Limit Tier Mapping
// ============================================================================

export const ENDPOINT_TIERS: Record<string, RateLimitTier> = {
  // SERP API - General tier (2000/min)
  'serp/organic/live': 'GENERAL',
  'serp/organic/task_get': 'GENERAL',
  'serp/organic/tasks_ready': 'TASKS_READY',
  'serp/google_ads/live': 'LIVE_GOOGLE_ADS',
  'serp/bing/live': 'GENERAL',
  'serp/yahoo/live': 'GENERAL',

  // Backlinks API - General tier but with simultaneous limit
  'backlinks/backlinks': 'GENERAL',
  'backlinks/summary': 'GENERAL',
  'backlinks/referring_domains': 'GENERAL',
  'backlinks/anchors': 'GENERAL',
  'backlinks/competitors': 'GENERAL',
  'backlinks/domain_pages': 'GENERAL',
  'backlinks/bulk_backlinks': 'GENERAL',
  'backlinks/bulk_referring_domains': 'GENERAL',

  // Domain Analytics - General tier
  'domain_analytics/rank/overview': 'GENERAL',
  'domain_analytics/rank/distribution': 'GENERAL',
  'domain_analytics/technologies': 'GENERAL',

  // Keywords Data - User Data tier (6/min)
  'keywords_data/google/search_volume': 'USER_DATA',
  'keywords_data/google/keywords_for_site': 'USER_DATA',
  'keywords_data/google/trends': 'USER_DATA',
  'keywords_data/bing/search_volume': 'USER_DATA',

  // Business Data - User Data tier (6/min)
  'business_data/business_listings': 'USER_DATA',
  'business_data/reviews': 'USER_DATA',

  // OnPage API - General tier
  'onpage/pages': 'GENERAL',
  'onpage/summary': 'GENERAL',
  'onpage/resources': 'GENERAL',

  // Content Analysis - General tier
  'content_analysis/search': 'GENERAL',
  'content_analysis/summary': 'GENERAL',
  'content_analysis/phrase_trends': 'GENERAL',

  // DataForSEO Labs - General tier
  'dataforseo_labs/bulk_keyword_difficulty': 'GENERAL',
  'dataforseo_labs/bulk_traffic_estimation': 'GENERAL',
  'dataforseo_labs/ranked_keywords': 'GENERAL',

  // App Data - General tier
  'app_data/app_info': 'GENERAL',
  'app_data/app_reviews': 'GENERAL',

  // Merchant API - General tier
  'merchant/google/products': 'GENERAL',

  // AI Optimization - General tier
  'ai_optimization/keyword_data': 'GENERAL',
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get rate limit for an endpoint
 * @param endpoint - DataForSEO endpoint path
 * @returns Requests per minute allowed
 */
export function getRateLimitForEndpoint(endpoint: string): number {
  const tier = ENDPOINT_TIERS[endpoint] || 'GENERAL'
  return RATE_LIMITS[tier]
}

/**
 * Get rate limit tier for an endpoint
 * @param endpoint - DataForSEO endpoint path
 * @returns Rate limit tier name
 */
export function getRateLimitTier(endpoint: string): RateLimitTier {
  return ENDPOINT_TIERS[endpoint] || 'GENERAL'
}

/**
 * Check if endpoint is in database tier (has simultaneous limit)
 * @param endpoint - DataForSEO endpoint path
 * @returns True if endpoint has simultaneous request limit
 */
export function hasSimultaneousLimit(endpoint: string): boolean {
  const databaseEndpoints = [
    'backlinks/backlinks',
    'backlinks/bulk_backlinks',
    'backlinks/bulk_referring_domains',
    'backlinks/domain_pages',
  ]
  return databaseEndpoints.some((e) => endpoint.includes(e))
}

/**
 * Get simultaneous request limit for endpoint
 * @returns Max simultaneous requests (30 for database endpoints)
 */
export function getSimultaneousLimit(): number {
  return RATE_LIMITS.DATABASE_MAX_SIMULTANEOUS
}

/**
 * Calculate cost for an API call
 * @param endpoint - DataForSEO endpoint
 * @param method - 'standard' or 'live'
 * @returns Estimated cost in USD
 */
export function calculateEndpointCost(
  endpoint: string,
  method: MethodType
): number {
  // Backlinks have fixed cost regardless of method
  if (endpoint.includes('backlinks')) {
    return METHOD_COSTS.BACKLINKS
  }

  // SERP live endpoints
  if (endpoint.includes('serp') && method === 'live') {
    return METHOD_COSTS.SERP_LIVE
  }

  // Keywords data
  if (endpoint.includes('keywords_data')) {
    return METHOD_COSTS.KEYWORDS
  }

  // Default by method
  return method === 'live' ? METHOD_COSTS.LIVE : METHOD_COSTS.STANDARD
}

/**
 * Get recommended method based on use case
 * @param useCase - 'scheduled' or 'user-triggered'
 * @returns Recommended method type
 */
export function getRecommendedMethod(useCase: 'scheduled' | 'user-triggered'): MethodType {
  // Scheduled updates should use Standard (cheaper, bulk)
  // User-triggered refreshes can use Live (faster, more expensive)
  return useCase === 'scheduled' ? 'standard' : 'live'
}

// ============================================================================
// Error Code Mapping
// ============================================================================

export const DATAFORSEO_ERROR_CODES = {
  400: 'Bad Request - Invalid parameters',
  401: 'Unauthorized - Invalid credentials',
  402: 'Payment Required - Insufficient balance',
  403: 'Forbidden - Access denied',
  404: 'Not Found - Endpoint or resource not found',
  429: 'Too Many Requests - Rate limit exceeded',
  500: 'Internal Server Error - DataForSEO error',
  502: 'Bad Gateway - DataForSEO unavailable',
  503: 'Service Unavailable - DataForSEO maintenance',
  504: 'Gateway Timeout - Request timeout',
} as const

/**
 * Check if error is retryable
 * @param statusCode - HTTP status code
 * @returns True if request should be retried
 */
export function isRetryableError(statusCode: number): boolean {
  const retryableCodes = [429, 500, 502, 503, 504]
  return retryableCodes.includes(statusCode)
}

/**
 * Get retry delay for rate limit errors
 * @param statusCode - HTTP status code
 * @param retryCount - Current retry attempt
 * @returns Delay in milliseconds
 */
export function getRetryDelay(statusCode: number, retryCount: number): number {
  // Rate limit: wait longer
  if (statusCode === 429) {
    return Math.min(60000, 1000 * Math.pow(2, retryCount)) // Max 60s
  }

  // Server errors: exponential backoff
  return Math.min(30000, 1000 * Math.pow(2, retryCount)) // Max 30s
}
