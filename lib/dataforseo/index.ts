/**
 * DataForSEO Modular Package
 *
 * Comprehensive, modular DataForSEO integration for SEO tools
 *
 * @version 2.0.0
 * @author SEO Platform Team
 */

import type {
  DataForSEORequest,
  DataForSEOResponse,
  KeywordData,
  KeywordSuggestion,
  SERPResult,
  CompetitorData,
  DomainMetrics,
  AIKeywordData,
  ChatGPTResult,
  ChatGPTResponse,
  OnPageResult,
  ContentAnalysis,
  ContentGeneration,
} from './types'

// Re-export types
export type {
  DataForSEORequest,
  DataForSEOResponse,
  KeywordData,
  KeywordSuggestion,
  SERPResult,
  CompetitorData,
  DomainMetrics,
  AIKeywordData,
  ChatGPTResult,
  ChatGPTResponse,
  OnPageResult,
  ContentAnalysis,
  ContentGeneration,
}

// Re-export constants
export * from './constants'
export { default as CONSTANTS } from './constants'
import CONSTANTS from './constants'

// Re-export client
export { dataForSEOClient as client, default as clientDefault } from './client'
import { dataForSEOClient } from './client'

// ============================================================================
// MODULAR TOOLS (30+ Tools)
// ============================================================================

// Keywords (7 tools)
import * as keywordsModule from './modules/keywords/index'
export const keywords = keywordsModule
export type { KeywordModule } from './types'

// SERP Analysis (6 tools)
import * as serpModule from './modules/serp/index'
export const serp = serpModule
export type { SERPModule } from './types'

// Competitors (4 tools)
import * as competitorsModule from './modules/competitors/index'
export const competitors = competitorsModule
export type { CompetitorModule } from './types'

// Domain Analysis (6 tools)
import * as domainModule from './modules/domain/index'
export const domain = domainModule
export type { DomainModule } from './types'

// AI Optimization (3 tools)
import * as aiModule from './modules/ai/index'
export const ai = aiModule
export type { AIModule } from './types'

// On-Page Analysis (3 tools)
import * as onPageModule from './modules/onPage/index'
export const onPage = onPageModule
export type { OnPageModule } from './types'

// Content (3 tools)
import * as contentModule from './modules/content/index'
export const content = contentModule
export type { ContentModule } from './types'

// ============================================================================
// UNIFIED API FOR BACKWARDS COMPATIBILITY
// ============================================================================

/**
 * Backwards compatibility layer for existing 13 tools
 * These functions maintain the same interface as the old monolithic service
 */

export async function keywordResearch(params: DataForSEORequest) {
  return keywords.searchVolume(params)
}

export async function competitorAnalysis(params: { domain: string }) {
  return competitors.discovery({ domain: params.domain })
}

export async function serpAnalysis(params: DataForSEORequest) {
  return serp.organic(params)
}

export async function aiKeywordSearchVolume(params: DataForSEORequest) {
  return ai.keywordSearch(params)
}

export async function chatGPTLLMScraper(params: DataForSEORequest) {
  return ai.chatgptResults(params)
}

export async function chatGPTLLMResponses(params: DataForSEORequest) {
  return ai.chatgptResponses(params)
}

export async function keywordsForKeywords(params: DataForSEORequest) {
  return keywords.suggestions(params)
}

export async function bulkKeywordDifficulty(params: DataForSEORequest) {
  return keywords.difficulty(params)
}

export async function serpCompetitors(params: DataForSEORequest) {
  return competitors.serpCompetitors(params)
}

export async function domainIntersection(params: DataForSEORequest) {
  return competitors.overlap(params)
}

export async function domainRankOverview(params: DataForSEORequest) {
  return domain.overview(params)
}

export async function rankedKeywords(params: DataForSEORequest) {
  return domain.keywords(params)
}

export async function relevantPages(params: DataForSEORequest) {
  return domain.pages(params)
}

// ============================================================================
// NEW HIGH-VALUE TOOLS (17 Additional Tools)
// ============================================================================

// SERP Expansion
export const serpImages = serp.images
export const serpVideos = serp.videos
export const serpNews = serp.news
export const serpShopping = serp.shopping
export const serpMaps = serp.maps
export const serpAutocomplete = serp.autocomplete

// Keyword Research Expansion
export const keywordIdeas = keywords.ideas
export const keywordRelated = keywords.related
export const keywordHistorical = keywords.historical
export const keywordsForSite = keywords.forSite

// Competitor Intelligence Expansion
export const competitorOverlap = competitors.overlap
export const pageIntersection = competitors.pageIntersection

// Domain Analysis Expansion
export const domainTechnologies = domain.technologies
export const domainSubdomains = domain.subdomains
export const domainWhois = domain.whois

// On-Page Analysis
export const lighthouseAudit = onPage.lighthouse
export const contentParsing = onPage.contentParsing

// Content Generation
export const generateContent = content.generation
export const grammarCheck = content.grammarCheck

// ============================================================================
// MODULE REGISTRY
// ============================================================================

export const MODULES = {
  keywords,
  serp,
  competitors,
  domain,
  ai,
  onPage,
  content,
} as const

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all available tools
 */
export function getAllTools() {
  return [
    // Existing 13 tools (backwards compatible)
    'keywordResearch',
    'competitorAnalysis',
    'serpAnalysis',
    'aiKeywordSearchVolume',
    'chatGPTLLMScraper',
    'chatGPTLLMResponses',
    'keywordsForKeywords',
    'bulkKeywordDifficulty',
    'serpCompetitors',
    'domainIntersection',
    'domainRankOverview',
    'rankedKeywords',
    'relevantPages',

    // New 17+ tools
    'serpImages',
    'serpVideos',
    'serpNews',
    'serpShopping',
    'serpMaps',
    'serpAutocomplete',
    'keywordIdeas',
    'keywordRelated',
    'keywordHistorical',
    'keywordsForSite',
    'competitorOverlap',
    'pageIntersection',
    'domainTechnologies',
    'domainSubdomains',
    'domainWhois',
    'lighthouseAudit',
    'contentParsing',
    'generateContent',
    'grammarCheck',
  ]
}

/**
 * Get tools by category
 */
export function getToolsByCategory() {
  return {
    keywords: [
      'keywordResearch',
      'keywordsForKeywords',
      'bulkKeywordDifficulty',
      'keywordIdeas',
      'keywordRelated',
      'keywordHistorical',
      'keywordsForSite',
    ],
    serp: [
      'serpAnalysis',
      'serpCompetitors',
      'serpImages',
      'serpVideos',
      'serpNews',
      'serpShopping',
      'serpMaps',
      'serpAutocomplete',
    ],
    competitors: [
      'competitorAnalysis',
      'domainIntersection',
      'competitorOverlap',
      'pageIntersection',
    ],
    domain: [
      'domainRankOverview',
      'rankedKeywords',
      'relevantPages',
      'domainTechnologies',
      'domainSubdomains',
      'domainWhois',
    ],
    ai: [
      'aiKeywordSearchVolume',
      'chatGPTLLMScraper',
      'chatGPTLLMResponses',
    ],
    onPage: [
      'lighthouseAudit',
      'contentParsing',
    ],
    content: [
      'generateContent',
      'grammarCheck',
    ],
  }
}

// ============================================================================
// VERSION INFO
// ============================================================================

export const VERSION = '2.0.0'
export const FEATURE_FLAGS = {
  MODULAR_ARCHITECTURE: true,
  REDIS_CACHING: true,
  SMART_CACHING: true,
  BACKWARDS_COMPATIBILITY: true,
  TOTAL_TOOLS: 30,
}

// ============================================================================
// EXPORT STATEMENT
// ============================================================================

export default {
  // Modules
  keywords,
  serp,
  competitors,
  domain,
  ai,
  onPage,
  content,

  // Backwards compatible functions
  keywordResearch,
  competitorAnalysis,
  serpAnalysis,
  aiKeywordSearchVolume,
  chatGPTLLMScraper,
  chatGPTLLMResponses,
  keywordsForKeywords,
  bulkKeywordDifficulty,
  serpCompetitors,
  domainIntersection,
  domainRankOverview,
  rankedKeywords,
  relevantPages,

  // New tools
  serpImages,
  serpVideos,
  serpNews,
  serpShopping,
  serpMaps,
  serpAutocomplete,
  keywordIdeas,
  keywordRelated,
  keywordHistorical,
  keywordsForSite,
  competitorOverlap,
  pageIntersection,
  domainTechnologies,
  domainSubdomains,
  domainWhois,
  lighthouseAudit,
  contentParsing,
  generateContent,
  grammarCheck,

  // Utils
  getAllTools,
  getToolsByCategory,
  MODULES,

  // Metadata
  VERSION,
  FEATURE_FLAGS,

  // Core
  client: dataForSEOClient,
  CONSTANTS,
}
