/**
 * DataForSEO API Constants
 *
 * Centralized endpoint definitions and configurations
 */

export const BASE_URL = 'https://api.dataforseo.com/v3'

export const DEFAULT_LOCATION_CODE = 2840 // United States
export const DEFAULT_LANGUAGE_CODE = 'en'
export const DEFAULT_DEVICE = 'desktop'

// ============================================================================
// KEYWORD ENDPOINTS
// ============================================================================

export const KEYWORD_ENDPOINTS = {
  SEARCH_VOLUME: '/keywords_data/google/search_volume/live',
  SUGGESTIONS: '/dataforseo_labs/google/keywords_for_keywords/live',
  DIFFICULTY: '/dataforseo_labs/google/keyword_difficulty/live',
  IDEAS: '/dataforseo_labs/google/keyword_ideas/live',
  RELATED: '/dataforseo_labs/google/related_keywords/live',
  HISTORICAL: '/keywords_data/google/historical_search_volume/live',
  FOR_SITE: '/dataforseo_labs/google/keywords_for_site/live',
} as const

// ============================================================================
// SERP ENDPOINTS
// ============================================================================

export const SERP_ENDPOINTS = {
  ORGANIC_ADVANCED: '/serp/google/organic/live/advanced',
  ORGANIC_REGULAR: '/serp/google/organic/live/regular',
  IMAGES: '/serp/google/images/live/advanced',
  VIDEOS: '/serp/google/videos/live/advanced',
  NEWS: '/serp/google/news/live/advanced',
  SHOPPING: '/serp/google/shopping/live/advanced',
  MAPS: '/serp/google/maps/live/advanced',
  EVENTS: '/serp/google/events/live/advanced',
  JOBS: '/serp/google/jobs/live/advanced',
  AUTOCOMPLETE: '/serp/google/autocomplete/live',
  RELATED_KEYWORDS: '/serp/google/related_keywords/live',
} as const

// ============================================================================
// COMPETITOR ENDPOINTS
// ============================================================================

export const COMPETITOR_ENDPOINTS = {
  DOMAINS: '/dataforseo_labs/google/competitors_domain/live',
  SERP_COMPETITORS: '/dataforseo_labs/google/serp_competitors/live',
  DOMAIN_INTERSECTION: '/dataforseo_labs/google/domain_intersection/live',
  PAGE_INTERSECTION: '/dataforseo_labs/google/page_intersection/live',
} as const

// ============================================================================
// DOMAIN ENDPOINTS
// ============================================================================

export const DOMAIN_ENDPOINTS = {
  RANK_OVERVIEW: '/dataforseo_labs/google/domain_rank_overview/live',
  RANKED_KEYWORDS: '/dataforseo_labs/google/ranked_keywords/live',
  RELEVANT_PAGES: '/dataforseo_labs/google/relevant_pages/live',
  TECHNOLOGIES: '/domain_analytics/technologies/domain_technologies/live',
  SUBDOMAINS: '/dataforseo_labs/google/subdomains/live',
  WHOIS: '/domain_analytics/whois/overview/live',
  HISTORICAL_RANK: '/dataforseo_labs/google/historical_rank_overview/live',
} as const

// ============================================================================
// AI OPTIMIZATION ENDPOINTS
// ============================================================================

export const AI_ENDPOINTS = {
  KEYWORD_SEARCH_VOLUME: '/dataforseo_labs/google/keyword_overview/live',
  CHATGPT_SCRAPER: '/dataforseo_labs/google/chatgpt_search_results/live',
  CHATGPT_RESPONSES: '/dataforseo_labs/google/chatgpt_responses/live',
} as const

// ============================================================================
// ON-PAGE ENDPOINTS
// ============================================================================

export const ONPAGE_ENDPOINTS = {
  INSTANT_PAGES: '/v3/on_page/instant_pages',
  CONTENT_PARSING: '/v3/on_page/content_parsing',
  LIGHTHOUSE: '/v3/on_page/lighthouse/live',
  PAGE_SCREENSHOT: '/v3/on_page/page_screenshot',
} as const

// ============================================================================
// CONTENT ENDPOINTS
// ============================================================================

export const CONTENT_ENDPOINTS = {
  ANALYSIS_SEARCH: '/v3/content_analysis/search/live',
  ANALYSIS_SUMMARY: '/v3/content_analysis/summary/live',
  SENTIMENT_ANALYSIS: '/v3/content_analysis/sentiment_analysis/live',
  GENERATE: '/v3/content_generation/generate/live',
  GENERATE_TEXT: '/v3/content_generation/generate_text/live',
  GENERATE_META_TAGS: '/v3/content_generation/generate_meta_tags/live',
  GRAMMAR_CHECK: '/v3/content_generation/check_grammar/live',
} as const

// ============================================================================
// BUSINESS DATA ENDPOINTS
// ============================================================================

export const BUSINESS_ENDPOINTS = {
  MY_BUSINESS_INFO: '/v3/business_data/google/my_business_info/live',
  GOOGLE_REVIEWS: '/v3/business_data/google/reviews/live',
  TRIPADVISOR_REVIEWS: '/v3/business_data/tripadvisor/reviews/live',
  TRUSTPILOT_REVIEWS: '/v3/business_data/trustpilot/reviews/live',
} as const

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

export const UTILITY_ENDPOINTS = {
  USER_DATA: '/v3/appendix/user_data',
  LOCATIONS: '/v3/serp/google/locations',
  LANGUAGES: '/v3/serp/google/languages',
  KEYWORD_LOCATIONS: '/v3/keywords_data/google/locations_and_languages',
  LABS_LOCATIONS: '/v3/dataforseo_labs/google/locations_and_languages',
} as const

// ============================================================================
// CACHE TTL CONFIGURATIONS
// ============================================================================

export const CACHE_TTL = {
  // Short TTL (1 hour) - Data changes frequently
  SERP_RESULTS: 60 * 60,
  AUTOCOMPLETE: 60 * 60,
  CHATGPT_SCRAPER: 60 * 60,

  // Medium TTL (12 hours) - Moderate stability
  COMPETITOR_DATA: 60 * 60 * 12,
  REVIEW_DATA: 60 * 60 * 12,

  // Long TTL (24 hours) - Relatively stable
  DOMAIN_METRICS: 60 * 60 * 24,
  KEYWORD_DATA: 60 * 60 * 24,
  ONPAGE_ANALYSIS: 60 * 60 * 24,
  BUSINESS_DATA: 60 * 60 * 24,

  // Very Long TTL (7 days) - Very stable
  KEYWORD_DIFFICULTY: 60 * 60 * 24 * 7,
  DOMAIN_TECHNOLOGIES: 60 * 60 * 24 * 7,
  HISTORICAL_DATA: 60 * 60 * 24 * 7,
} as const

// ============================================================================
// RATE LIMIT CONFIGURATIONS
// ============================================================================

export const RATE_LIMITS = {
  // High priority, frequent use
  KEYWORDS: {
    limit: 100,
    window: '1 h',
    burst: 20,
  },
  SERP: {
    limit: 50,
    window: '1 h',
    burst: 10,
  },

  // Medium priority
  DOMAIN: {
    limit: 30,
    window: '1 h',
    burst: 5,
  },
  COMPETITORS: {
    limit: 20,
    window: '1 h',
    burst: 5,
  },

  // Low priority, expensive operations
  ONPAGE: {
    limit: 10,
    window: '1 h',
    burst: 3,
  },
  CONTENT: {
    limit: 10,
    window: '1 h',
    burst: 3,
  },

  // AI optimization - moderate
  AI: {
    limit: 15,
    window: '1 h',
    burst: 5,
  },
} as const

// ============================================================================
// SEARCH ENGINE CONFIGURATIONS
// ============================================================================

export const SEARCH_ENGINES = {
  GOOGLE: 'google',
  BING: 'bing',
  YAHOO: 'yahoo',
  BAIDU: 'baidu',
} as const

export const SERP_TYPES = {
  ORGANIC: 'organic',
  IMAGES: 'images',
  VIDEOS: 'videos',
  NEWS: 'news',
  SHOPPING: 'shopping',
  MAPS: 'maps',
  EVENTS: 'events',
  JOBS: 'jobs',
} as const

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  INVALID_API_KEY: 'DATAFORSEO_INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED: 'DATAFORSEO_RATE_LIMIT',
  INSUFFICIENT_CREDITS: 'DATAFORSEO_INSUFFICIENT_CREDITS',
  INVALID_LOCATION: 'DATAFORSEO_INVALID_LOCATION',
  INVALID_LANGUAGE: 'DATAFORSEO_INVALID_LANGUAGE',
  NETWORK_ERROR: 'DATAFORSEO_NETWORK_ERROR',
  HTTP_ERROR: 'DATAFORSEO_HTTP_ERROR',
} as const

// ============================================================================
// PAGINATION
// ============================================================================

export const PAGINATION = {
  DEFAULT_LIMIT: 100,
  MAX_LIMIT: 700,
  DEFAULT_OFFSET: 0,
} as const

// ============================================================================
// DEVICE TYPES
// ============================================================================

export const DEVICE_TYPES = {
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
} as const

// ============================================================================
// EXPORT ALL CONSTANTS
// ============================================================================

export const DATA_FOR_SEO_CONSTANTS = {
  BASE_URL,
  DEFAULT_LOCATION_CODE,
  DEFAULT_LANGUAGE_CODE,
  DEFAULT_DEVICE,
  KEYWORD_ENDPOINTS,
  SERP_ENDPOINTS,
  COMPETITOR_ENDPOINTS,
  DOMAIN_ENDPOINTS,
  AI_ENDPOINTS,
  ONPAGE_ENDPOINTS,
  CONTENT_ENDPOINTS,
  BUSINESS_ENDPOINTS,
  UTILITY_ENDPOINTS,
  CACHE_TTL,
  RATE_LIMITS,
  SEARCH_ENGINES,
  SERP_TYPES,
  ERROR_CODES,
  PAGINATION,
  DEVICE_TYPES,
} as const

export default DATA_FOR_SEO_CONSTANTS
