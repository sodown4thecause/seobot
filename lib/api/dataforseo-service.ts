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
