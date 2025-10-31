// ============================================================================
// DataForSEO Response Types
// ============================================================================

export interface DataForSEOKeywordData {
  keyword: string
  search_volume: number
  keyword_difficulty: number
  cpc: number
  competition: number
  monthly_searches?: Array<{ year: number; month: number; search_volume: number }>
  keyword_info?: {
    se_type?: string
    last_updated_time?: string
  }
}

export interface DataForSEOKeywordResponse {
  status_code: number
  status_message: string
  tasks: Array<{
    id: string
    status_code: number
    status_message: string
    result?: Array<{
      keyword: string
      location_code: number
      language_code: string
      keyword_data: DataForSEOKeywordData
    }>
  }>
}

export interface DataForSEOCompetitorData {
  domain: string
  domain_rank: number
  organic_etv: number
  organic_count: number
  organic_is_new: number
  organic_is_up: number
  organic_is_down: number
  organic_is_lost: number
}

export interface DataForSEOSERPItem {
  type: string
  rank_group: number
  rank_absolute: number
  position: string
  url: string
  domain: string
  title: string
  description: string
}

export interface DataForSEOBacklinkItem {
  type: string
  domain_from: string
  url_from: string
  url_to: string
  tld_from: string
  is_new: boolean
  is_lost: boolean
  backlink_spam_score: number
  rank: number
  page_from_rank: number
  domain_from_rank: number
  first_seen: string
  last_seen: string
}

export interface DataForSEODomainMetrics {
  domain: string
  domain_rank: number
  backlinks: number
  referring_domains: number
  referring_main_domains: number
  backlinks_spam_score: number
  rank: number
}

// ============================================================================
// Perplexity Response Types
// ============================================================================

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface PerplexityCitation {
  url: string
  title?: string
  snippet?: string
}

export interface PerplexityResponse {
  id: string
  model: string
  created: number
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  choices: Array<{
    index: number
    finish_reason: string
    message: {
      role: 'assistant'
      content: string
    }
    delta?: {
      role?: string
      content?: string
    }
  }>
  citations?: PerplexityCitation[]
}

// ============================================================================
// Jina AI Response Types
// ============================================================================

export interface JinaReaderBlock {
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'quote'
  content: string
  level?: number // For headings
}

export interface JinaReaderResponse {
  code: number
  status: number
  data: {
    title: string
    description?: string
    url: string
    content: string
    html?: string
    markdown?: string
    text?: string
    links?: Array<{
      text: string
      href: string
    }>
    images?: Array<{
      src: string
      alt?: string
    }>
    publishedTime?: string
    author?: string
  }
}

export interface JinaContentExtraction {
  url: string
  title: string
  description: string
  content: string
  blocks: JinaReaderBlock[]
  links: Array<{ text: string; href: string }>
  images: Array<{ src: string; alt: string }>
  metadata: {
    publishedTime?: string
    author?: string
    wordCount: number
    readingTime: number
  }
}

// ============================================================================
// Apify Response Types
// ============================================================================

export interface ApifyActorRun {
  id: string
  actId: string
  userId: string
  startedAt: string
  finishedAt?: string
  status: 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED-OUT' | 'ABORTED'
  statusMessage?: string
  defaultDatasetId: string
  defaultKeyValueStoreId: string
}

export interface ApifyDatasetItem {
  [key: string]: unknown
}

export interface SocialPost {
  platform: 'twitter' | 'instagram' | 'linkedin' | 'facebook'
  text: string
  url: string
  timestamp: string
  author: {
    username: string
    displayName?: string
    profileUrl?: string
  }
  engagement?: {
    likes?: number
    comments?: number
    shares?: number
    views?: number
  }
  media?: Array<{
    type: 'image' | 'video'
    url: string
  }>
}

// ============================================================================
// Generic API Error Types
// ============================================================================

export interface ApiError {
  code: string
  message: string
  statusCode: number
  requestId?: string
  details?: Record<string, unknown>
}

export type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError }
