/**
 * Content Gap Analysis Enhancement Service
 * 
 * Uses DataForSEO's relevant pages endpoint to perform page intersection analysis
 * and identify content gaps between domains for strategic content planning
 */

import { mcpDataforseoTools } from '@/lib/mcp/dataforseo'

// Helper to safely execute MCP tools with required options argument
async function safeExecute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolFn: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any
): Promise<string | null> {
  try {
    if (!toolFn?.execute) return null
    const result = await toolFn.execute(params, { 
      abortSignal: new AbortController().signal,
      toolCallId: 'content-gap-analysis-call',
      messages: []
    })
    return result
  } catch {
    return null
  }
}

export interface RelevantPageData {
  type: string
  domain: string
  title: string
  url: string
  breadcrumb: string
  meta_description: string
  meta_keywords: string
  content: string
  main_domain: string
  url_length: number
  relative_url_length: number
  encoded_url: string
  last_modified: string
  time_to_interactive: number
  dom_complete: number
  connection_time: number
  time_to_secure_connection: number
  fetch_time: number
  duplicate_content: boolean
  spell_errors: number
  total_dom_size: number
  custom_js_response_time: number
  resource_errors: {
    errors_count: number
    warnings_count: number
  }
  status_code: number
  page_timing: {
    time_to_interactive: number
    dom_complete: number
    connection_time: number
    time_to_secure_connection: number
    fetch_time: number
  }
   onpage_score: number
  total_transfer_size: number
  broken_resources: boolean
  broken_links: boolean
  duplicate_title: boolean
  duplicate_description: boolean
  click_depth: number
  size: number
  encoded_size: number
  total_words: number
  automated_readability_index: number
  coleman_liau_readability_index: number
  dale_chall_readability_index: number
  flesch_kincaid_readability_index: number
  smog_readability_index: number
  description_to_content_consistency: number
  title_to_content_consistency: number
  meta_keywords_to_content_consistency: number
}

export interface RelevantPagesResponse {
  version: string
  status_code: number
  status_message: string
  time: string
  cost: number
  tasks_count: number
  tasks_error: number
  tasks: Array<{
    id: string
    status_code: number
    status_message: string
    time: string
    cost: number
    result_count: number
    path: string[]
    data: {
      api: string
      function: string
      target: string
      limit: number
      offset: number
      filters: any[]
    }
    result: RelevantPageData[]
  }>
}

export interface ContentGapAnalysis {
  targetDomain: string
  competitorDomains: string[]
  analysis: {
    uniquePages: {
      domain: string
      pages: RelevantPageData[]
      topics: string[]
      contentTypes: string[]
    }[]
    sharedTopics: {
      topic: string
      targetPages: RelevantPageData[]
      competitorPages: {
        domain: string
        pages: RelevantPageData[]
      }[]
      gapScore: number
    }[]
    contentGaps: {
      topic: string
      competitorDomains: string[]
      suggestedContent: {
        title: string
        type: 'blog' | 'guide' | 'comparison' | 'tutorial' | 'resource'
        priority: 'high' | 'medium' | 'low'
        estimatedTraffic: number
        competitorUrls: string[]
      }
    }[]
  }
  matrix: ContentGapMatrix
}

export interface ContentGapMatrix {
  topics: string[]
  domains: string[]
  coverage: {
    [domain: string]: {
      [topic: string]: {
        hasContent: boolean
        pageCount: number
        avgOnpageScore: number
        topPages: RelevantPageData[]
        gapOpportunity: 'high' | 'medium' | 'low' | 'none'
      }
    }
  }
}

export interface PageIntersectionResult {
  sharedTopics: string[]
  uniqueToTarget: string[]
  uniqueToCompetitors: {
    domain: string
    topics: string[]
  }[]
  intersectionScore: number
  recommendations: {
    contentToCreate: string[]
    contentToImprove: string[]
    contentToExpand: string[]
  }
}

/**
 * Analyze relevant pages for a domain
 */
export async function analyzeRelevantPages(
  domain: string,
  options: {
    limit?: number
    offset?: number
    filters?: any[]
  } = {}
): Promise<RelevantPageData[]> {
  const {
    limit = 100,
    offset = 0,
    filters = []
  } = options

  try {
    const response = await safeExecute(mcpDataforseoTools.dataforseo_labs_google_relevant_pages, {
      target: domain,
      limit,
      offset,
      filters,
      include_clickstream_data: false,
      ignore_synonyms: true,
      exclude_top_domains: false,
      item_types: ["page", "article"]
    });
    
    if (!response) {
      console.warn('No relevant pages data received, returning empty array');
      return [];
    }

    // Parse the JSON response
    const parsedResponse = JSON.parse(response);
    if (!parsedResponse.tasks?.[0]?.result) {
      console.warn('No relevant pages data received, returning empty array');
      return [];
    }

    return parsedResponse.tasks[0].result
  } catch (error) {
    console.error('Error analyzing relevant pages:', error)
    throw new Error(`Failed to analyze relevant pages for ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Perform comprehensive content gap analysis
 */
export async function performContentGapAnalysis(
  targetDomain: string,
  competitorDomains: string[],
  options: {
    limit?: number
    includeContentAnalysis?: boolean
  } = {}
): Promise<ContentGapAnalysis> {
  const { limit = 100, includeContentAnalysis = true } = options

  try {
    // Get relevant pages for all domains
    const [targetPages, ...competitorPages] = await Promise.all([
      analyzeRelevantPages(targetDomain, { limit }),
      ...competitorDomains.map(domain =>
        analyzeRelevantPages(domain, { limit })
      )
    ])

    // Extract topics from page content and titles
    const targetTopics = extractTopicsFromPages(targetPages)
    const competitorTopicsMap = competitorDomains.reduce((acc, domain, index) => {
      acc[domain] = extractTopicsFromPages(competitorPages[index])
      return acc
    }, {} as Record<string, string[]>)

    // Perform intersection analysis
    const intersectionResult = analyzePageIntersection(
      targetTopics,
      competitorTopicsMap
    )

    // Build content gap matrix
    const matrix = buildContentGapMatrix(
      targetDomain,
      competitorDomains,
      targetPages,
      competitorPages,
      targetTopics,
      competitorTopicsMap
    )

    // Generate content gap insights
    const analysis = generateContentGapInsights(
      targetDomain,
      competitorDomains,
      targetPages,
      competitorPages,
      intersectionResult
    )

    return {
      targetDomain,
      competitorDomains,
      analysis,
      matrix
    }
  } catch (error) {
    console.error('Error performing content gap analysis:', error)
    throw new Error(`Failed to perform content gap analysis: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract topics from page data using title and content analysis
 */
function extractTopicsFromPages(pages: RelevantPageData[]): string[] {
  const topics = new Set<string>()

  pages.forEach(page => {
    // Extract from title
    const titleWords = page.title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)

    // Extract from meta description
    const descWords = (page.meta_description || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)

    // Extract from URL path
    const urlWords = page.url
      .split('/')
      .join(' ')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)

    // Combine and deduplicate
    const allWords = titleWords.concat(descWords).concat(urlWords)
    allWords.forEach(word => {
      if (!isStopWord(word)) {
        topics.add(word)
      }
    })
  })

  return Array.from(topics)
}

/**
 * Analyze page intersection between target and competitors
 */
function analyzePageIntersection(
  targetTopics: string[],
  competitorTopicsMap: Record<string, string[]>
): PageIntersectionResult {
  const targetSet = new Set(targetTopics)
  const allCompetitorTopics = Object.values(competitorTopicsMap).flat()
  const competitorSet = new Set(allCompetitorTopics)

  const sharedTopics = targetTopics.filter(topic => competitorSet.has(topic))
  const uniqueToTarget = targetTopics.filter(topic => !competitorSet.has(topic))

  const uniqueToCompetitors = Object.entries(competitorTopicsMap).map(([domain, topics]) => ({
    domain,
    topics: topics.filter(topic => !targetSet.has(topic))
  }))

  const intersectionScore = sharedTopics.length / (targetTopics.length + allCompetitorTopics.length - sharedTopics.length)

  // Generate recommendations
  const contentToCreate = uniqueToCompetitors
    .flatMap(comp => comp.topics)
    .filter((topic, index, arr) => arr.indexOf(topic) === index) // deduplicate
    .slice(0, 10)

  const contentToImprove = sharedTopics.slice(0, 10)
  const contentToExpand = uniqueToTarget.slice(0, 5)

  return {
    sharedTopics,
    uniqueToTarget,
    uniqueToCompetitors,
    intersectionScore,
    recommendations: {
      contentToCreate,
      contentToImprove,
      contentToExpand
    }
  }
}

/**
 * Build comprehensive content gap matrix
 */
function buildContentGapMatrix(
  targetDomain: string,
  competitorDomains: string[],
  targetPages: RelevantPageData[],
  competitorPages: RelevantPageData[][],
  targetTopics: string[],
  competitorTopicsMap: Record<string, string[]>
): ContentGapMatrix {
  const allTopics = Array.from(new Set([
    ...targetTopics,
    ...Object.values(competitorTopicsMap).flat()
  ])).slice(0, 50) // Limit for visualization

  const domains = [targetDomain, ...competitorDomains]
  const coverage: ContentGapMatrix['coverage'] = {}

  domains.forEach((domain, domainIndex) => {
    coverage[domain] = {}
    const pages = domainIndex === 0 ? targetPages : competitorPages[domainIndex - 1]
    const topics = domainIndex === 0 ? targetTopics : competitorTopicsMap[domain]

    allTopics.forEach(topic => {
      const relevantPages = pages.filter(page =>
        page.title.toLowerCase().includes(topic) ||
        page.meta_description?.toLowerCase().includes(topic) ||
        page.url.toLowerCase().includes(topic)
      )

      const hasContent = relevantPages.length > 0
      const pageCount = relevantPages.length
      const avgOnpageScore = pageCount > 0
        ? relevantPages.reduce((sum, page) => sum + (page.onpage_score || 0), 0) / pageCount
        : 0

      // Determine gap opportunity
      let gapOpportunity: 'high' | 'medium' | 'low' | 'none' = 'none'
      if (!hasContent) {
        // Check if competitors have content for this topic
        const competitorHasContent = domains.some((otherDomain, otherIndex) => {
          if (otherDomain === domain) return false
          const otherPages = otherIndex === 0 ? targetPages : competitorPages[otherIndex - 1]
          return otherPages.some(page =>
            page.title.toLowerCase().includes(topic) ||
            page.meta_description?.toLowerCase().includes(topic) ||
            page.url.toLowerCase().includes(topic)
          )
        })
        gapOpportunity = competitorHasContent ? 'high' : 'low'
      } else if (avgOnpageScore < 70) {
        gapOpportunity = 'medium'
      }

      coverage[domain][topic] = {
        hasContent,
        pageCount,
        avgOnpageScore,
        topPages: relevantPages.slice(0, 3),
        gapOpportunity
      }
    })
  })

  return {
    topics: allTopics,
    domains,
    coverage
  }
}

/**
 * Generate content gap insights and recommendations
 */
function generateContentGapInsights(
  targetDomain: string,
  competitorDomains: string[],
  targetPages: RelevantPageData[],
  competitorPages: RelevantPageData[][],
  intersectionResult: PageIntersectionResult
): ContentGapAnalysis['analysis'] {
  // Analyze unique pages per competitor
  const uniquePages = competitorDomains.map((domain, index) => {
    const pages = competitorPages[index]
    const topics = extractTopicsFromPages(pages)
    const contentTypes = categorizeContentTypes(pages)

    return {
      domain,
      pages: pages.slice(0, 10), // Top 10 pages
      topics: topics.slice(0, 20), // Top 20 topics
      contentTypes
    }
  })

  // Analyze shared topics in detail
  const sharedTopics = intersectionResult.sharedTopics.map(topic => {
    const targetPagesForTopic = targetPages.filter(page =>
      page.title.toLowerCase().includes(topic) ||
      page.meta_description?.toLowerCase().includes(topic)
    )

    const competitorPagesForTopic = competitorDomains.map((domain, index) => ({
      domain,
      pages: competitorPages[index].filter(page =>
        page.title.toLowerCase().includes(topic) ||
        page.meta_description?.toLowerCase().includes(topic)
      )
    }))

    // Calculate gap score based on content quality and quantity
    const targetScore = targetPagesForTopic.reduce((sum, page) => sum + (page.onpage_score || 0), 0)
    const competitorScore = competitorPagesForTopic.reduce((sum, comp) =>
      sum + comp.pages.reduce((pageSum, page) => pageSum + (page.onpage_score || 0), 0), 0
    )

    const gapScore = Math.max(0, competitorScore - targetScore) / 100

    return {
      topic,
      targetPages: targetPagesForTopic,
      competitorPages: competitorPagesForTopic,
      gapScore
    }
  })

  // Generate content gap recommendations
  const contentGaps = intersectionResult.recommendations.contentToCreate.map(topic => {
    const competitorDomainsWithTopic = competitorDomains.filter((domain, index) => {
      return competitorPages[index].some(page =>
        page.title.toLowerCase().includes(topic) ||
        page.meta_description?.toLowerCase().includes(topic)
      )
    })

    const competitorUrls = competitorDomainsWithTopic.flatMap((domain, domainIndex) => {
      const actualIndex = competitorDomains.indexOf(domain)
      return competitorPages[actualIndex]
        .filter(page =>
          page.title.toLowerCase().includes(topic) ||
          page.meta_description?.toLowerCase().includes(topic)
        )
        .map(page => page.url)
    }).slice(0, 5)

    return {
      topic,
      competitorDomains: competitorDomainsWithTopic,
      suggestedContent: {
        title: `Complete Guide to ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
        type: determineContentType(topic) as 'blog' | 'guide' | 'comparison' | 'tutorial' | 'resource',
        priority: competitorDomainsWithTopic.length >= 2 ? 'high' as const : 'medium' as const,
        estimatedTraffic: competitorDomainsWithTopic.length * 500, // Rough estimate
        competitorUrls
      }
    }
  })

  return {
    uniquePages,
    sharedTopics,
    contentGaps
  }
}

/**
 * Categorize content types from pages
 */
function categorizeContentTypes(pages: RelevantPageData[]): string[] {
  const types = new Set<string>()

  pages.forEach(page => {
    const url = page.url.toLowerCase()
    const title = page.title.toLowerCase()

    if (url.includes('/blog/') || title.includes('blog')) types.add('blog')
    if (url.includes('/guide/') || title.includes('guide') || title.includes('how to')) types.add('guide')
    if (title.includes('vs') || title.includes('comparison') || title.includes('compare')) types.add('comparison')
    if (title.includes('tutorial') || title.includes('step by step')) types.add('tutorial')
    if (url.includes('/resources/') || title.includes('resource') || title.includes('tool')) types.add('resource')
    if (url.includes('/product/') || url.includes('/service/')) types.add('product')
    if (title.includes('review') || title.includes('rating')) types.add('review')
  })

  return Array.from(types)
}

/**
 * Determine appropriate content type for a topic
 */
function determineContentType(topic: string): string {
  if (topic.includes('how') || topic.includes('tutorial')) return 'tutorial'
  if (topic.includes('vs') || topic.includes('comparison')) return 'comparison'
  if (topic.includes('guide') || topic.includes('complete')) return 'guide'
  if (topic.includes('tool') || topic.includes('resource')) return 'resource'
  return 'blog'
}

/**
 * Check if word is a stop word
 */
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'among', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'shall', 'your', 'you', 'we', 'they', 'them'
  ])
  return stopWords.has(word.toLowerCase())
}

/**
 * Get content gap summary for dashboard
 */
export function getContentGapSummary(analysis: ContentGapAnalysis) {
  const totalGaps = analysis.analysis.contentGaps.length
  const highPriorityGaps = analysis.analysis.contentGaps.filter(gap => gap.suggestedContent.priority === 'high').length
  const sharedTopics = analysis.analysis.sharedTopics.length
  const avgGapScore = analysis.analysis.sharedTopics.reduce((sum, topic) => sum + topic.gapScore, 0) / sharedTopics

  return {
    targetDomain: analysis.targetDomain,
    competitorCount: analysis.competitorDomains.length,
    totalGaps,
    highPriorityGaps,
    sharedTopics,
    avgGapScore: Math.round(avgGapScore * 100) / 100,
    topOpportunities: analysis.analysis.contentGaps
      .filter(gap => gap.suggestedContent.priority === 'high')
      .slice(0, 5)
      .map(gap => ({
        topic: gap.topic,
        type: gap.suggestedContent.type,
        estimatedTraffic: gap.suggestedContent.estimatedTraffic,
        competitorCount: gap.competitorDomains.length
      }))
  }
}