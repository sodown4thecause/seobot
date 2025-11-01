/**
 * DataForSEO TypeScript Types
 *
 * Comprehensive types for all DataForSEO API endpoints
 */

import type { ApiError } from '@/lib/types/api-responses'

// Re-export ApiError for convenience
export type { ApiError }

// ============================================================================
// BASE TYPES
// ============================================================================

export interface DataForSEORequest {
  keywords?: string[]
  keyword?: string
  domain?: string
  target?: string
  url?: string
  location_code?: number
  language_code?: string
  device?: 'desktop' | 'mobile'
  limit?: number
  offset?: number
}

export interface DataForSEOResponse<T = any> {
  success: boolean
  data?: {
    tasks: Array<{
      id?: string
      status?: string
      result?: T
      error?: ApiError
    }>
  }
  error?: ApiError
}

// ============================================================================
// KEYWORD TYPES
// ============================================================================

export interface KeywordData {
  keyword: string
  search_volume?: number
  cpc?: number
  competition?: number
  keyword_difficulty?: number
  monthly_searches?: Array<{
    month: string
    search_volume: number
  }>
}

export interface KeywordSuggestion {
  keyword: string
  search_volume: number
  competition: number
  location_code?: number
  language_code?: string
}

// ============================================================================
// SERP TYPES
// ============================================================================

export interface SERPItem {
  type: string
  rank_absolute: number
  rank_group?: number
  url: string
  domain: string
  title: string
  description?: string
  snippet?: string
  items?: SERPItem[]
}

export interface SERPResult {
  keyword: string
  location_code: number
  language_code: string
  total_count: number
  items: SERPItem[]
}

// ============================================================================
// COMPETITOR TYPES
// ============================================================================

export interface CompetitorData {
  domain: string
  avg_position?: number
  intersections?: number
  visibility?: number
  etv?: number
  metrics?: {
    organic?: {
      count: number
      etv: number
    }
    paid?: {
      count: number
      etv: number
    }
  }
}

export interface KeywordOverlap {
  keyword: string
  search_volume: number
  intersection_result: Array<{
    domain: string
    position: number
  }>
}

// ============================================================================
// DOMAIN TYPES
// ============================================================================

export interface DomainMetrics {
  target: string
  metrics: {
    organic?: {
      count: number
      etv: number
      improved_positions_count?: number
      dropped_positions_count?: number
      lost_positions_count?: number
    }
    paid?: {
      count: number
      etv: number
    }
    faq?: {
      count: number
    }
  }
}

export interface DomainKeyword {
  keyword_data?: {
    keyword: string
    keyword_info?: {
      search_volume: number
    }
  }
  ranked_serp_element?: {
    serp_item?: {
      rank_absolute: number
      url: string
    }
  }
}

export interface TopPage {
  url: string
  metrics?: {
    organic?: {
      count: number
      etv: number
    }
  }
}

// ============================================================================
// AI OPTIMIZATION TYPES
// ============================================================================

export interface AIKeywordData {
  keyword: string
  search_volume: number
  monthly_searches: Array<{
    month: string
    search_volume: number
  }>
}

export interface ChatGPTResult {
  type: string
  title: string
  description: string
  url: string
  domain: string
  items?: Array<{
    title: string
    url: string
    description: string
  }>
}

export interface ChatGPTResponse {
  message: string
  model: string
  tokens: number
}

// ============================================================================
// ON-PAGE TYPES
// ============================================================================

export interface OnPageResult {
  items: Array<{
    page_url: string
    meta: {
      title?: string
      description?: string
      h1?: string
    }
    lighthouse?: {
      performance_score?: number
      accessibility_score?: number
      best_practices_score?: number
      seo_score?: number
    }
    content_words_count?: number
    content_size?: number
  }>
}

// ============================================================================
// CONTENT TYPES
// ============================================================================

export interface ContentAnalysis {
  category: string
  subcategory: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  sentiment_score?: number
  rating?: number
}

export interface ContentGeneration {
  content: string
  meta_title?: string
  meta_description?: string
  sub_topics?: string[]
}

// ============================================================================
// BUSINESS DATA TYPES
// ============================================================================

export interface BusinessData {
  name: string
  address?: string
  phone?: string
  website?: string
  rating?: number
  reviews_count?: number
  categories?: string[]
  hours?: Record<string, string>
}

export interface ReviewData {
  author: string
  rating: number
  text: string
  time: string
  likes?: number
}

// ============================================================================
// MODULE EXPORT TYPES
// ============================================================================

export type KeywordModule = {
  searchVolume: (params: DataForSEORequest) => Promise<DataForSEOResponse<KeywordData[]>>
  suggestions: (params: DataForSEORequest) => Promise<DataForSEOResponse<KeywordSuggestion[]>>
  difficulty: (params: DataForSEORequest) => Promise<DataForSEOResponse<KeywordData[]>>
  ideas: (params: DataForSEORequest) => Promise<DataForSEOResponse<KeywordSuggestion[]>>
  related: (params: DataForSEORequest) => Promise<DataForSEOResponse<KeywordSuggestion[]>>
  historical: (params: DataForSEORequest) => Promise<DataForSEOResponse<KeywordData[]>>
}

export type SERPModule = {
  organic: (params: DataForSEORequest) => Promise<DataForSEOResponse<SERPResult>>
  images: (params: DataForSEORequest) => Promise<DataForSEOResponse<SERPResult>>
  videos: (params: DataForSEORequest) => Promise<DataForSEOResponse<SERPResult>>
  news: (params: DataForSEORequest) => Promise<DataForSEOResponse<SERPResult>>
  shopping: (params: DataForSEORequest) => Promise<DataForSEOResponse<SERPResult>>
  maps: (params: DataForSEORequest) => Promise<DataForSEOResponse<SERPResult>>
  autocomplete: (params: DataForSEORequest) => Promise<DataForSEOResponse<{ items: string[] }>>
}

export type CompetitorModule = {
  discovery: (params: DataForSEORequest) => Promise<DataForSEOResponse<CompetitorData[]>>
  analysis: (params: DataForSEORequest) => Promise<DataForSEOResponse<CompetitorData[]>>
  overlap: (params: DataForSEORequest) => Promise<DataForSEOResponse<KeywordOverlap[]>>
  serpCompetitors: (params: DataForSEORequest) => Promise<DataForSEOResponse<CompetitorData[]>>
  domainIntersection: (params: DataForSEORequest) => Promise<DataForSEOResponse<KeywordOverlap[]>>
}

export type DomainModule = {
  overview: (params: DataForSEORequest) => Promise<DataForSEOResponse<DomainMetrics>>
  keywords: (params: DataForSEORequest) => Promise<DataForSEOResponse<DomainKeyword[]>>
  pages: (params: DataForSEORequest) => Promise<DataForSEOResponse<TopPage[]>>
  technologies: (params: DataForSEORequest) => Promise<DataForSEOResponse<any>>
  subdomains: (params: DataForSEORequest) => Promise<DataForSEOResponse<any>>
  whois: (params: DataForSEORequest) => Promise<DataForSEOResponse<any>>
}

export type AIModule = {
  keywordSearch: (params: DataForSEORequest) => Promise<DataForSEOResponse<AIKeywordData[]>>
  chatgptResults: (params: DataForSEORequest) => Promise<DataForSEOResponse<ChatGPTResult[]>>
  chatgptResponses: (params: DataForSEORequest) => Promise<DataForSEOResponse<ChatGPTResponse>>
}

export type OnPageModule = {
  analysis: (params: DataForSEORequest) => Promise<DataForSEOResponse<OnPageResult>>
  lighthouse: (params: DataForSEORequest) => Promise<DataForSEOResponse<any>>
  contentParsing: (params: DataForSEORequest) => Promise<DataForSEOResponse<any>>
}

export type ContentModule = {
  analysis: (params: DataForSEORequest) => Promise<DataForSEOResponse<ContentAnalysis[]>>
  generation: (params: DataForSEORequest) => Promise<DataForSEOResponse<ContentGeneration>>
  grammarCheck: (params: DataForSEORequest) => Promise<DataForSEOResponse<any>>
}
