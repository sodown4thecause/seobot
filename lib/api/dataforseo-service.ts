import { serverEnv } from '@/lib/config/env'
import type {
  DataForSEOKeywordResponse,
  DataForSEOCompetitorData,
  DataForSEODomainMetrics,
  DataForSEOSERPItem,
  DataForSEOBacklinkItem,
  ApiResult,
  ApiError,
} from '@/lib/types/api-responses'

const BASE_URL = 'https://api.dataforseo.com/v3'

function basicAuthHeader() {
  const auth = Buffer.from(
    `${serverEnv.DATAFORSEO_LOGIN}:${serverEnv.DATAFORSEO_PASSWORD}`
  ).toString('base64')
  return `Basic ${auth}`
}

async function doFetch<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: basicAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([body]),
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

    const json = (await res.json()) as T
    return { success: true, data: json }
  } catch (e: any) {
    const error: ApiError = {
      code: 'DATAFORSEO_NETWORK_ERROR',
      message: e?.message ?? 'Network error',
      statusCode: 0,
    }
    return { success: false, error }
  }
}

export async function keywordResearch(params: {
  keywords: string[]
  location_code?: number
  language_code?: string
}) {
  return doFetch<DataForSEOKeywordResponse>('/keywords_data/google_ads/search_volume/live', {
    keywords: params.keywords,
    location_code: params.location_code ?? 2840, // US default
    language_code: params.language_code ?? 'en',
  })
}

export async function competitorAnalysis(params: { domain: string }) {
  return doFetch<{ tasks: Array<{ result?: DataForSEOCompetitorData[] }> }>(
    '/dataforseo_labs/google/competitors_domain/live',
    { target: params.domain }
  )
}

export async function serpAnalysis(params: {
  keyword: string
  location_code?: number
  language_code?: string
}) {
  return doFetch<{ tasks: Array<{ result?: Array<{ items: DataForSEOSERPItem[] }> }> }>(
    '/serp/google/organic/live/advanced',
    {
      keyword: params.keyword,
      location_code: params.location_code ?? 2840,
      language_code: params.language_code ?? 'en',
      device: 'desktop',
    }
  )
}

export async function domainMetrics(params: { domain: string }) {
  return doFetch<{ tasks: Array<{ result?: DataForSEODomainMetrics[] }> }>(
    '/dataforseo_labs/google/domain_metrics/live',
    { target: params.domain }
  )
}

export async function backlinkAnalysis(params: { domain: string }) {
  return doFetch<{ tasks: Array<{ result?: DataForSEOBacklinkItem[] }> }>(
    '/backlinks/backlinks/live',
    { target: params.domain }
  )
}

// AI Optimization APIs
export async function aiKeywordSearchVolume(params: {
  keywords: string[]
  location_name?: string
  language_code?: string
}) {
  console.log('[DataForSEO] Calling ai_keyword_search_volume with:', {
    keywords: params.keywords,
    location_name: params.location_name,
    language_code: params.language_code,
  })
  
  const result = await doFetch<any>('/ai_optimization/ai_keyword_data/keywords_search_volume/live', {
    keywords: params.keywords,
    location_name: params.location_name ?? 'United States',
    language_code: params.language_code ?? 'en',
  })
  
  console.log('[DataForSEO] ai_keyword_search_volume response:', {
    success: result.success,
    hasData: result.success ? !!result.data : false,
    tasksLength: result.success ? result.data?.tasks?.length : 0,
    firstTaskResult: result.success ? result.data?.tasks?.[0]?.result : undefined,
  })
  
  return result
}

export async function chatGPTLLMScraper(params: {
  keyword: string
  location_name?: string
  language_code?: string
}) {
  return doFetch<any>('/ai_optimization/chat_gpt/llm_scraper/live/advanced', {
    keyword: params.keyword,
    location_name: params.location_name ?? 'United States',
    language_code: params.language_code ?? 'en',
  })
}

export async function chatGPTLLMResponses(params: {
  prompt: string
  model?: string
}) {
  return doFetch<any>('/ai_optimization/chat_gpt/llm_responses/live', {
    prompt: params.prompt,
    model: params.model ?? 'gpt-4o',
  })
}

// Keywords Data APIs
export async function keywordsForKeywords(params: {
  keywords: string[]
  location_code?: number
  language_code?: string
}) {
  return doFetch<any>('/keywords_data/google_ads/keywords_for_keywords/live', {
    keywords: params.keywords,
    location_code: params.location_code ?? 2840,
    language_code: params.language_code ?? 'en',
  })
}

export async function bulkKeywordDifficulty(params: {
  keywords: string[]
  location_name?: string
  language_code?: string
}) {
  return doFetch<any>('/dataforseo_labs/google/bulk_keyword_difficulty/live', {
    keywords: params.keywords,
    location_name: params.location_name ?? 'United States',
    language_code: params.language_code ?? 'en',
  })
}

// DataForSEO Labs APIs
export async function serpCompetitors(params: {
  keyword: string
  location_name?: string
  language_code?: string
}) {
  return doFetch<any>('/dataforseo_labs/google/serp_competitors/live', {
    keyword: params.keyword,
    location_name: params.location_name ?? 'United States',
    language_code: params.language_code ?? 'en',
  })
}

export async function domainIntersection(params: {
  targets: string[]
  location_name?: string
  language_code?: string
}) {
  return doFetch<any>('/dataforseo_labs/google/domain_intersection/live', {
    targets: params.targets,
    location_name: params.location_name ?? 'United States',
    language_code: params.language_code ?? 'en',
  })
}

export async function domainRankOverview(params: {
  target: string
  location_name?: string
  language_code?: string
}) {
  return doFetch<any>('/dataforseo_labs/google/domain_rank_overview/live', {
    target: params.target,
    location_name: params.location_name ?? 'United States',
    language_code: params.language_code ?? 'en',
  })
}

export async function rankedKeywords(params: {
  target: string
  location_name?: string
  language_code?: string
  limit?: number
}) {
  return doFetch<any>('/dataforseo_labs/google/ranked_keywords/live', {
    target: params.target,
    location_name: params.location_name ?? 'United States',
    language_code: params.language_code ?? 'en',
    limit: params.limit ?? 100,
  })
}

export async function relevantPages(params: {
  target: string
  location_name?: string
  language_code?: string
  limit?: number
}) {
  return doFetch<any>('/dataforseo_labs/google/relevant_pages/live', {
    target: params.target,
    location_name: params.location_name ?? 'United States',
    language_code: params.language_code ?? 'en',
    limit: params.limit ?? 100,
  })
}

// ============================================================================
// AEO AUDITOR - AI Optimization APIs
// ============================================================================

/**
 * LLM Mentions Search Live - Check how often a brand is mentioned in LLM results
 * Uses the live endpoint for real-time results
 * @see https://docs.dataforseo.com/v3/ai_optimization-llm_mentions-search-live/
 */
export async function llmMentionsSearch(params: {
  brandName: string
  limit?: number
  platform?: 'google' | 'chat_gpt' | 'perplexity'
  location_code?: number
  language_code?: string
}) {
  return doFetch<{
    tasks: Array<{
      result?: Array<{
        total_count?: number
        items_count?: number
        items?: Array<{
          platform?: string
          question?: string
          answer?: string
          sources?: Array<{
            title?: string
            domain?: string
            url?: string
            snippet?: string
          }>
          ai_search_volume?: number
        }>
      }>
    }>
  }>('/ai_optimization/llm_mentions/search/live', {
    target: [
      {
        keyword: params.brandName,
        search_scope: ['answer'], // Search for brand mentions in AI answers
        match_type: 'word_match',
      },
    ],
    platform: params.platform ?? 'google', // Google AI Overview by default
    location_code: params.location_code ?? 2840, // USA
    language_code: params.language_code ?? 'en',
    limit: params.limit ?? 20,
  })
}

/**
 * LLM Mentions Aggregated Metrics - Get consolidated mention metrics
 * Returns total mentions count, impressions, and other aggregated data
 * @see https://docs.dataforseo.com/v3/ai_optimization-llm_mentions-aggregated_metrics-live/
 */
export async function llmMentionsAggregated(params: {
  brandName: string
  domain?: string
  platform?: 'google' | 'chat_gpt' | 'perplexity'
  location_code?: number
  language_code?: string
}) {
  const target: Array<{ keyword?: string; domain?: string; search_scope?: string[] }> = []

  // Add keyword target for brand name mentions
  target.push({
    keyword: params.brandName,
    search_scope: ['answer'],
  })

  // Optionally add domain target if provided
  if (params.domain) {
    target.push({
      domain: params.domain.replace(/^https?:\/\//, '').replace(/^www\./, ''),
      search_scope: ['sources'],
    })
  }

  return doFetch<{
    tasks: Array<{
      result?: Array<{
        total_count?: number
        total_ai_search_volume?: number
        aggregated_data?: Array<{
          type?: string
          value?: string
          mentions_count?: number
          ai_search_volume?: number
        }>
      }>
    }>
  }>('/ai_optimization/llm_mentions/aggregated_metrics/live', {
    target,
    platform: params.platform ?? 'google',
    location_code: params.location_code ?? 2840,
    language_code: params.language_code ?? 'en',
  })
}

/**
 * LLM Responses Live - Get real-time responses from LLMs about a topic
 * Uses ChatGPT by default for comprehensive responses
 */
export async function llmResponsesLive(params: {
  prompt: string
  model?: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo'
}) {
  return doFetch<any>('/ai_optimization/chat_gpt/llm_responses/live', {
    prompt: params.prompt,
    model: params.model ?? 'gpt-4o-mini',
  })
}

/**
 * Google Knowledge Graph check via SERP - Determines if a brand is recognized as an Entity
 */
export async function knowledgeGraphCheck(params: {
  brandName: string
  location_code?: number
  language_code?: string
}) {
  const result = await doFetch<{
    tasks: Array<{
      result?: Array<{
        items?: Array<{
          type: string
          knowledge_graph?: Record<string, unknown>
          [key: string]: unknown
        }>
      }>
    }>
  }>('/serp/google/organic/live/advanced', {
    keyword: params.brandName,
    location_code: params.location_code ?? 2840,
    language_code: params.language_code ?? 'en',
    device: 'desktop',
  })

  if (!result.success) return result

  // Extract Knowledge Graph from SERP items
  const items = result.data?.tasks?.[0]?.result?.[0]?.items ?? []
  const knowledgeGraph = items.find((item) => item.type === 'knowledge_graph')

  return {
    success: true,
    data: {
      exists: !!knowledgeGraph,
      knowledgeGraph: knowledgeGraph?.knowledge_graph ?? null,
      rawItems: items.filter((item) => item.type === 'knowledge_graph'),
    },
  }
}

/**
 * On-Page Content Parsing - Extract structured content from a URL
 * Useful for understanding page structure and schema presence
 */
export async function onPageContentParsing(params: {
  url: string
}) {
  return doFetch<any>('/on_page/content_parsing', {
    url: params.url,
  })
}

/**
 * On-Page Instant Pages - Quick analysis of a single page
 */
export async function onPageInstantAnalysis(params: {
  url: string
  enable_javascript?: boolean
}) {
  return doFetch<any>('/on_page/instant_pages', {
    url: params.url,
    enable_javascript: params.enable_javascript ?? true,
    load_resources: true,
    enable_browser_rendering: true,
  })
}
