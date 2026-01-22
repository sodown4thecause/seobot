// Perplexity API Integration
// Search for authoritative sources and citations

import { serverEnv } from '@/lib/config/env'

const PERPLEXITY_API_KEY = serverEnv.PERPLEXITY_API_KEY
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

export interface PerplexitySearchOptions {
  query: string
  searchRecencyFilter?: 'month' | 'week' | 'day' | 'hour'
  returnCitations?: boolean
  returnImages?: boolean
  model?: 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-reasoning-pro'
}

export interface PerplexityCitation {
  url: string
  title?: string
  snippet?: string
  domain?: string
}

export interface PerplexitySearchResult {
  success: boolean
  answer: string
  citations: PerplexityCitation[]
  images?: string[]
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Search using Perplexity API with citations
 */
export async function searchWithPerplexity(
  options: PerplexitySearchOptions
): Promise<PerplexitySearchResult> {
  const {
    query,
    searchRecencyFilter = 'month',
    returnCitations = true,
    returnImages = false,
    model = 'sonar-pro',
  } = options

  if (!PERPLEXITY_API_KEY) {
    console.error('[Perplexity] API key not configured')
    return {
      success: false,
      answer: '',
      citations: [],
      error: 'Perplexity API key not configured',
    }
  }

  try {
    console.log(`[Perplexity] Searching: ${query}`)

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant. Provide accurate, well-cited information from authoritative sources. Focus on recent data and expert opinions.',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        search_recency_filter: searchRecencyFilter,
        return_citations: returnCitations,
        return_images: returnImages,
        temperature: 0.2, // Lower temperature for more factual responses
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Perplexity] API error: ${response.status} - ${errorText}`)
      return {
        success: false,
        answer: '',
        citations: [],
        error: `Perplexity API error: ${response.status}`,
      }
    }

    const data = await response.json()

    // Extract answer
    const answer = data.choices?.[0]?.message?.content || ''

    // Extract citations
    const citations: PerplexityCitation[] = (data.citations || []).map((url: string) => ({
      url,
      domain: extractDomain(url),
    }))

    // Extract images if requested
    const images = returnImages ? data.images || [] : undefined

    // Extract usage stats
    const usage = data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined

    console.log(`[Perplexity] Found ${citations.length} citations`)

    return {
      success: true,
      answer,
      citations,
      images,
      usage,
    }
  } catch (error) {
    console.error('[Perplexity] Search error:', error)
    return {
      success: false,
      answer: '',
      citations: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Find authoritative sources for a specific topic
 */
export async function findAuthoritativeSources(
  topic: string,
  options?: {
    count?: number
    recency?: 'month' | 'week' | 'day'
    sourceTypes?: ('academic' | 'government' | 'industry' | 'news')[]
  }
): Promise<PerplexitySearchResult> {
  const { count = 5, recency = 'month', sourceTypes = ['academic', 'government', 'industry'] } = options || {}

  const sourceTypeText = sourceTypes.join(', ')

  const query = `Find ${count} authoritative sources about "${topic}". 
Focus on ${sourceTypeText} sources.
For each source, provide:
1. The exact URL
2. A brief description of what data/insight it provides
3. Why it's authoritative
4. A specific quote or statistic that could be cited

Prioritize recent sources (last ${recency}) with high credibility.`

  return searchWithPerplexity({
    query,
    searchRecencyFilter: recency,
    returnCitations: true,
  })
}

/**
 * Get recent statistics about a topic
 */
export async function getRecentStatistics(topic: string): Promise<PerplexitySearchResult> {
  const query = `What are the latest statistics and data about "${topic}"? 
Provide specific numbers, percentages, and trends from the last 6 months.
Include the source for each statistic.
Focus on data from authoritative sources like research institutions, government agencies, or industry reports.`

  return searchWithPerplexity({
    query,
    searchRecencyFilter: 'month',
    returnCitations: true,
  })
}

/**
 * Find expert quotes on a topic
 */
export async function findExpertQuotes(topic: string): Promise<PerplexitySearchResult> {
  const query = `Find expert quotes and opinions about "${topic}".
Include:
1. The expert's name and credentials
2. Their exact quote
3. The source/publication
4. Why they're considered an expert

Focus on recognized authorities in the field.`

  return searchWithPerplexity({
    query,
    searchRecencyFilter: 'month',
    returnCitations: true,
  })
}

/**
 * Parse Perplexity response to extract structured citations
 */
export function parsePerplexityCitations(answer: string, citations: PerplexityCitation[]): Array<{
  source: string
  url: string
  dataPoint: string
  authorityLevel: 'high' | 'medium' | 'low'
  type: 'academic' | 'industry' | 'government' | 'news' | 'expert'
}> {
  const structuredCitations: Array<{
    source: string
    url: string
    dataPoint: string
    authorityLevel: 'high' | 'medium' | 'low'
    type: 'academic' | 'industry' | 'government' | 'news' | 'expert'
  }> = []

  // Split answer into sections (usually separated by numbers or bullets)

  const sections = answer.split(/\n\d+\.|•|-/).filter((s) => s.trim().length > 0)

  sections.forEach((section, index) => {
    if (index >= citations.length) return

    const citation = citations[index]
    const domain = citation.domain || extractDomain(citation.url)

    // Determine authority level based on domain
    const authorityLevel = determineAuthorityLevel(domain)

    // Determine source type
    const type = determineSourceType(domain, section)

    // Extract data point (first sentence or key insight)
    const dataPoint = extractDataPoint(section)

    structuredCitations.push({
      source: domain,
      url: citation.url,
      dataPoint,
      authorityLevel,
      type,
    })
  })

  return structuredCitations
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

/**
 * Determine authority level based on domain
 */
function determineAuthorityLevel(domain: string): 'high' | 'medium' | 'low' {
  // High authority domains
  const highAuthority = [
    '.gov',
    '.edu',
    'nature.com',
    'science.org',
    'nejm.org',
    'who.int',
    'cdc.gov',
    'nih.gov',
    'harvard.edu',
    'stanford.edu',
    'mit.edu',
  ]

  // Medium authority domains
  const mediumAuthority = [
    'forbes.com',
    'wsj.com',
    'nytimes.com',
    'reuters.com',
    'bloomberg.com',
    'techcrunch.com',
    'wired.com',
  ]

  if (highAuthority.some((auth) => domain.includes(auth))) {
    return 'high'
  }

  if (mediumAuthority.some((auth) => domain.includes(auth))) {
    return 'medium'
  }

  return 'low'
}

/**
 * Determine source type based on domain and content
 */
function determineSourceType(
  domain: string,
  content: string
): 'academic' | 'industry' | 'government' | 'news' | 'expert' {
  if (domain.includes('.edu') || domain.includes('.ac.') || /journal|research|study/i.test(content)) {
    return 'academic'
  }

  if (domain.includes('.gov') || /government|federal|state/i.test(content)) {
    return 'government'
  }

  if (/news|times|post|reuters|bloomberg/i.test(domain)) {
    return 'news'
  }

  if (/expert|professor|dr\.|phd/i.test(content)) {
    return 'expert'
  }

  return 'industry'
}

/**
 * Extract key data point from section
 */
function extractDataPoint(section: string): string {
  // Get first sentence or up to 200 characters
  const sentences = section.match(/[^.!?]+[.!?]+/g) || []
  const firstSentence = sentences[0]?.trim() || section.substring(0, 200).trim()

  return firstSentence
}

