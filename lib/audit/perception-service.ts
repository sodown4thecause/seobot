/**
 * AEO Trust Auditor - Perception Service (Phase 2)
 *
 * Gathers AI perception data from multiple premium APIs:
 * - DataForSEO: LLM Mentions, ChatGPT Scraper, Knowledge Graph, Domain Metrics, Competitors
 * - Perplexity Sonar: Real-time AI perception via Vercel Gateway
 * - Firecrawl: Competitor website scraping
 * - Jina AI: Content analysis
 *
 * API Cost Tracking:
 * - DataForSEO: ~$0.10-0.15 per endpoint
 * - Perplexity Sonar: ~$0.005 per query
 * - Firecrawl: ~$0.01 per scrape
 */

import {
  llmMentionsSearch,
  llmMentionsAggregated,
  chatGPTLLMScraper,
  aiKeywordSearchVolume,
  knowledgeGraphCheck,
  competitorAnalysis,
  domainMetrics,
  backlinkAnalysis,
} from '@/lib/api/dataforseo-service'
import { generateText } from 'ai'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import { type AIPerception, type PerplexityInsight, type CompetitorInsight, type DomainMetrics } from './schemas'

// API cost estimates (in USD)
const API_COSTS = {
  llmMentionsSearch: 0.10,
  llmMentionsAggregated: 0.10,
  chatGPTScraper: 0.15,
  aiSearchVolume: 0.05,
  knowledgeGraph: 0.02,
  competitorAnalysis: 0.10,
  domainMetrics: 0.05,
  backlinkAnalysis: 0.05,
  perplexitySonar: 0.005,
  firecrawlScrape: 0.01,
}

export interface PerceptionResult {
  success: boolean
  perception?: AIPerception
  errors: string[]
}

interface DataForSEOTask<T = unknown> {
  tasks?: Array<{
    result?: T[]
    status_code?: number
    status_message?: string
  }>
}

/**
 * Safely extract result from DataForSEO response
 */
function extractResult<T>(response: { success: boolean; data?: DataForSEOTask<T>; error?: { message: string } }): T | null {
  if (!response.success || !response.data?.tasks?.[0]?.result?.[0]) {
    return null
  }
  return response.data.tasks[0].result[0]
}

/**
 * Extract domain from URL for domain-based searches
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

/**
 * Get LLM mentions count and details using both search and aggregated endpoints
 */
async function getLLMMentions(
  brandName: string,
  url?: string
): Promise<{
  count: number
  byPlatform: { google: number; chatGpt: number; perplexity: number }
  totalVolume: number
  mentions: Array<{ source: string; context: string; question?: string }>
}> {
  try {
    // Run both search (for details) and aggregated (for counts) in parallel
    const domain = url ? extractDomain(url) : undefined
    console.log('[Perception] LLM Mentions: Fetching for', { brandName, domain })

    const [googleSearchResponse, googleAggregatedResponse, chatGptAggregatedResponse, perplexityAggregatedResponse] =
      await Promise.all([
        llmMentionsSearch({ brandName, limit: 20, platform: 'google' }),
        llmMentionsAggregated({ brandName, domain, platform: 'google' }),
        llmMentionsAggregated({ brandName, domain, platform: 'chat_gpt' }),
        llmMentionsAggregated({ brandName, domain, platform: 'perplexity' }),
      ])

    // Log raw responses for debugging
    console.log('[Perception] LLM Search Response:', {
      success: googleSearchResponse.success,
      tasksCount: googleSearchResponse.success ? googleSearchResponse.data?.tasks?.length ?? 0 : 0,
      resultCount: googleSearchResponse.success ? googleSearchResponse.data?.tasks?.[0]?.result?.length ?? 0 : 0,
    })
    console.log('[Perception] LLM Aggregated Response:', {
      success: googleAggregatedResponse.success,
      tasksCount: googleAggregatedResponse.success ? googleAggregatedResponse.data?.tasks?.length ?? 0 : 0,
      resultCount: googleAggregatedResponse.success ? googleAggregatedResponse.data?.tasks?.[0]?.result?.length ?? 0 : 0,
    })

    // Extract search results for detailed mentions
    const searchResult = googleSearchResponse.success ? googleSearchResponse.data?.tasks?.[0]?.result?.[0] : null
    const mentions = (searchResult?.items ?? []).map((item) => ({
      source: item.sources?.[0]?.domain ?? 'AI Response',
      context: item.answer?.slice(0, 500) ?? '',
      question: item.question,
    }))

    // Extract aggregated metrics for total count
    const googleAggResult = googleAggregatedResponse.success ? googleAggregatedResponse.data?.tasks?.[0]?.result?.[0] : null
    const chatGptAggResult = chatGptAggregatedResponse.success ? chatGptAggregatedResponse.data?.tasks?.[0]?.result?.[0] : null
    const perplexityAggResult = perplexityAggregatedResponse.success
      ? perplexityAggregatedResponse.data?.tasks?.[0]?.result?.[0]
      : null

    const googleCount =
      googleAggResult?.total_count ?? searchResult?.total_count ?? searchResult?.items_count ?? mentions.length
    const chatGptCount = chatGptAggResult?.total_count ?? 0
    const perplexityCount = perplexityAggResult?.total_count ?? 0
    const totalCount = googleCount + chatGptCount + perplexityCount
    const totalVolume = googleAggResult?.total_ai_search_volume ?? 0

    console.log('[Perception] LLM Mentions Result:', {
      searchItemsReturned: searchResult?.items_count ?? 0,
      totalCount,
      byPlatform: { googleCount, chatGptCount, perplexityCount },
      totalVolume,
      sampleMentions: mentions.slice(0, 2).map((m) => ({ source: m.source, question: m.question })),
    })

    return {
      count: totalCount,
      byPlatform: { google: googleCount, chatGpt: chatGptCount, perplexity: perplexityCount },
      totalVolume,
      mentions,
    }
  } catch (error) {
    console.error('[Perception] LLM Mentions error:', error)
    return { count: 0, byPlatform: { google: 0, chatGpt: 0, perplexity: 0 }, totalVolume: 0, mentions: [] }
  }
}

/**
 * Get what ChatGPT says about the brand
 * Uses LLM Scraper first (existing ChatGPT conversations), falls back to LLM Responses (fresh query)
 */
async function getChatGPTPerception(brandName: string): Promise<{
  summary: string
  raw: string
}> {
  try {
    // Try the scraper first - it searches existing ChatGPT conversations
    console.log('[Perception] ChatGPT: Fetching perception for', brandName)
    const scraperResponse = await chatGPTLLMScraper({ keyword: brandName })

    console.log('[Perception] ChatGPT Scraper Response:', {
      success: scraperResponse.success,
      hasData: scraperResponse.success ? !!scraperResponse.data : false,
      tasksCount: scraperResponse.success ? scraperResponse.data?.tasks?.length ?? 0 : 0,
    })

    // Log full response structure for debugging
    const taskResult = scraperResponse.success ? scraperResponse.data?.tasks?.[0]?.result?.[0] : null
    console.log('[Perception] ChatGPT Scraper Result Structure:', {
      hasResult: !!taskResult,
      resultKeys: taskResult ? Object.keys(taskResult) : [],
      itemsCount: (taskResult as { items_count?: number })?.items_count ?? 0,
    })

    // The LLM Scraper Live Advanced returns a rich structure
    const scraperResult = taskResult as {
      markdown?: string
      items_count?: number
      search_results?: string
      items?: Array<{
        type?: string
        question?: string
        answer?: string
        text?: string
        content?: string
        sources?: Array<{ domain?: string; url?: string }>
      }>
    }

    // Try multiple extraction methods
    let text = ''

    // Method 1: Use markdown field (most comprehensive)
    if (scraperResult?.markdown) {
      text = scraperResult.markdown
      console.log('[Perception] ChatGPT Scraper: Using markdown field', {
        length: text.length,
        preview: text.slice(0, 100),
      })
    }

    // Method 2: Use search_results field
    if (!text && scraperResult?.search_results) {
      text = scraperResult.search_results
      console.log('[Perception] ChatGPT Scraper: Using search_results field', {
        length: text.length,
      })
    }

    // Method 3: Extract from items array
    if (!text && scraperResult?.items && scraperResult.items.length > 0) {
      // Find an answer that mentions the brand
      const relevantItem = scraperResult.items.find(
        (item) =>
          (item.answer || item.text || item.content) &&
          (item.answer || item.text || item.content || '').toLowerCase().includes(brandName.toLowerCase())
      ) || scraperResult.items[0]

      text = relevantItem?.answer ?? relevantItem?.text ?? relevantItem?.content ?? ''
      console.log('[Perception] ChatGPT Scraper: Using items array', {
        question: relevantItem?.question?.slice(0, 50),
        type: relevantItem?.type,
        answerLength: text.length,
      })
    }

    // If scraper didn't return useful data, try the LLM Responses endpoint
    if (!text || text.length < 50) {
      console.log('[Perception] ChatGPT: Scraper returned no useful data, trying LLM Responses...')
      try {
        const { chatGPTLLMResponses } = await import('@/lib/api/dataforseo-service')
        const query = `What is ${brandName}? Describe what they do, their main products or services, and their reputation in 2-3 sentences.`
        const llmResponse = await chatGPTLLMResponses({ prompt: query, model: 'gpt-4o' })

        if (llmResponse.success && llmResponse.data) {
          const llmResult = llmResponse.data.tasks?.[0]?.result?.[0] as {
            response?: string
            message?: string
          }
          text = llmResult?.response ?? llmResult?.message ?? ''
        }

        console.log('[Perception] ChatGPT LLM Response:', {
          success: llmResponse.success,
          hasText: !!text,
          textLength: text.length,
        })
      } catch (llmError) {
        console.error('[Perception] ChatGPT LLM Responses fallback failed:', llmError)
      }
    }

    console.log('[Perception] ChatGPT Final Result:', {
      hasText: !!text,
      textLength: text.length,
      preview: text.slice(0, 100),
    })

    return {
      summary: text.slice(0, 500),
      raw: text,
    }
  } catch (error) {
    console.error('[Perception] ChatGPT scraper error:', error)
    return { summary: '', raw: '' }
  }
}

/**
 * Get AI search volume for brand keywords
 */
async function getAISearchVolume(brandName: string): Promise<number> {
  try {
    console.log('[Perception] AI Search Volume: Fetching for', brandName)
    const response = await aiKeywordSearchVolume({ keywords: [brandName] })

    console.log('[Perception] AI Search Volume Response:', {
      success: response.success,
      hasData: response.success ? !!response.data : false,
    })

    if (!response.success || !response.data) {
      return 0
    }

    // The response structure is different - items contain the search volume
    const taskResult = response.data.tasks?.[0]?.result?.[0]
    const items = (taskResult as { items?: Array<{ keyword?: string; ai_search_volume?: number }> })?.items
    const volume = items?.[0]?.ai_search_volume ?? 0

    console.log('[Perception] AI Search Volume Result:', {
      keyword: items?.[0]?.keyword,
      volume,
    })

    return volume
  } catch (error) {
    console.error('[Perception] AI Search Volume error:', error)
    return 0
  }
}

/**
 * Check if brand has a Knowledge Graph entity
 */
async function getKnowledgeGraphStatus(brandName: string): Promise<{
  exists: boolean
  data: Record<string, unknown> | null
}> {
  try {
    console.log('[Perception] Knowledge Graph: Checking for', brandName)
    const response = await knowledgeGraphCheck({ brandName })

    console.log('[Perception] Knowledge Graph Response:', {
      success: response.success,
      hasData: response.success ? !!response.data : false,
    })

    if (!response.success) {
      return { exists: false, data: null }
    }
    const data = response.data as { exists: boolean; knowledgeGraph: Record<string, unknown> | null }

    console.log('[Perception] Knowledge Graph Result:', {
      exists: data.exists,
      hasKGData: !!data.knowledgeGraph,
    })

    return { exists: data.exists, data: data.knowledgeGraph }
  } catch (error) {
    console.error('[Perception] Knowledge Graph error:', error)
    return { exists: false, data: null }
  }
}

/**
 * Get Perplexity's perception of the brand using Sonar via Vercel AI Gateway
 */
async function getPerplexityPerception(brandName: string): Promise<PerplexityInsight | null> {
  try {
    console.log('[Perception] Perplexity Sonar: Querying for', brandName)

    const { text } = await generateText({
      model: vercelGateway.languageModel('perplexity/sonar'),
      prompt: `What is ${brandName}? Provide a concise 2-3 sentence summary of what they do, their main products/services, and their reputation. Include any notable facts.`,
      maxOutputTokens: 300,
    })

    console.log('[Perception] Perplexity Response:', {
      hasText: !!text,
      length: text?.length,
      preview: text?.slice(0, 100),
    })

    // Extract sources from response (Perplexity often includes citations)
    const sourceMatches = text.match(/\[([^\]]+)\]/g) || []
    const sources = sourceMatches.map(s => s.replace(/[\[\]]/g, ''))

    return {
      summary: text || '',
      sources,
      hasAccurateInfo: text.length > 50,
    }
  } catch (error) {
    console.error('[Perception] Perplexity error:', error)
    return null
  }
}

/**
 * Get domain SEO metrics from DataForSEO
 */
async function getDomainMetricsData(domain: string): Promise<DomainMetrics | null> {
  try {
    console.log('[Perception] Domain Metrics: Fetching for', domain)

    const [metricsResponse, backlinksResponse] = await Promise.all([
      domainMetrics({ domain }),
      backlinkAnalysis({ domain }),
    ])

    type MetricsType = { metrics?: { organic?: { etv?: number; count?: number } } }
    type BacklinksType = { total_backlinks?: number; referring_domains?: number; rank?: number }

    let metrics: MetricsType | undefined
    let backlinks: BacklinksType | undefined

    if (metricsResponse.success && metricsResponse.data) {
      metrics = metricsResponse.data.tasks?.[0]?.result?.[0] as unknown as MetricsType
    }

    if (backlinksResponse.success && backlinksResponse.data) {
      backlinks = backlinksResponse.data.tasks?.[0]?.result?.[0] as unknown as BacklinksType
    }

    console.log('[Perception] Domain Metrics Result:', {
      hasMetrics: !!metrics,
      hasBacklinks: !!backlinks,
    })

    return {
      organicTraffic: metrics?.metrics?.organic?.etv,
      organicKeywords: metrics?.metrics?.organic?.count,
      backlinks: backlinks?.total_backlinks,
      referringDomains: backlinks?.referring_domains,
      domainRank: backlinks?.rank,
    }
  } catch (error) {
    console.error('[Perception] Domain Metrics error:', error)
    return null
  }
}

/**
 * Get top competitors from DataForSEO
 */
async function getCompetitorData(domain: string): Promise<CompetitorInsight[]> {
  try {
    console.log('[Perception] Competitors: Fetching for', domain)

    const response = await competitorAnalysis({ domain })

    if (!response.success || !response.data) {
      return []
    }

    type CompetitorResult = {
      domain?: string
      metrics?: { organic?: { etv?: number; count?: number } }
      full_domain_metrics?: { organic?: { etv?: number; count?: number } }
    }

    const result = response.data.tasks?.[0]?.result as CompetitorResult[] | undefined

    if (!result || result.length === 0) {
      return []
    }

    // Get top 3 competitors
    const competitors: CompetitorInsight[] = result.slice(0, 3).map((comp) => ({
      domain: comp.domain || '',
      organicTraffic: comp.metrics?.organic?.etv || comp.full_domain_metrics?.organic?.etv,
      organicKeywords: comp.metrics?.organic?.count || comp.full_domain_metrics?.organic?.count,
    }))

    console.log('[Perception] Competitors Found:', competitors.length)
    return competitors
  } catch (error) {
    console.error('[Perception] Competitors error:', error)
    return []
  }
}

/**
 * Analyze competitor schema presence (simplified - no scraping to control costs)
 * In production, this could be enhanced with Firecrawl scraping
 */
async function analyzeCompetitorSchema(competitors: CompetitorInsight[]): Promise<CompetitorInsight[]> {
  // For now, return competitors as-is without schema analysis
  // This avoids additional API costs and complexity
  // Schema analysis can be added later with proper Firecrawl integration
  return competitors
}

/**
 * Main perception gathering - Phase 2 of the AEO Audit
 * Runs all API calls in parallel for maximum performance
 * Tracks API costs for transparency
 */
export async function runPerceptionService(params: {
  brandName: string
  url?: string
}): Promise<PerceptionResult> {
  console.log('[Perception Service] Gathering AI perception for:', params.brandName)
  const errors: string[] = []
  const domain = params.url ? extractDomain(params.url) : undefined

  try {
    // Phase 1: Core perception data (parallel)
    const [llmMentions, chatGPT, aiVolume, kg, perplexity] = await Promise.all([
      getLLMMentions(params.brandName, params.url),
      getChatGPTPerception(params.brandName),
      getAISearchVolume(params.brandName),
      getKnowledgeGraphStatus(params.brandName),
      getPerplexityPerception(params.brandName),
    ])

    // Phase 2: Domain and competitor data (only if URL provided)
    let domainMetricsData: DomainMetrics | null = null
    let competitors: CompetitorInsight[] = []

    if (domain) {
      const [metrics, comps] = await Promise.all([
        getDomainMetricsData(domain),
        getCompetitorData(domain),
      ])
      domainMetricsData = metrics

      // Phase 3: Enrich competitors with schema analysis
      competitors = await analyzeCompetitorSchema(comps)
    }

    // Calculate API costs
    const apiCosts = {
      dataForSEO: API_COSTS.llmMentionsSearch + API_COSTS.llmMentionsAggregated +
                  API_COSTS.chatGPTScraper + API_COSTS.aiSearchVolume + API_COSTS.knowledgeGraph +
                  (domain ? API_COSTS.competitorAnalysis + API_COSTS.domainMetrics + API_COSTS.backlinkAnalysis : 0),
      perplexity: API_COSTS.perplexitySonar,
      firecrawl: competitors.filter(c => c.hasSchema !== undefined).length * API_COSTS.firecrawlScrape,
      total: 0,
    }
    apiCosts.total = apiCosts.dataForSEO + apiCosts.perplexity + apiCosts.firecrawl

    const perception: AIPerception = {
      llmMentionsCount: llmMentions.count,
      llmMentionsByPlatform: llmMentions.byPlatform,
      llmMentions: llmMentions.mentions.map((m) => ({
        source: m.source,
        context: m.context,
        sentiment: undefined,
      })),
      chatGPTSummary: chatGPT.summary || "AI doesn't have information about this brand.",
      chatGPTRawResponse: chatGPT.raw,
      perplexityInsight: perplexity ?? undefined,
      aiSearchVolume: llmMentions.totalVolume || aiVolume,
      knowledgeGraphExists: kg.exists,
      knowledgeGraphData: kg.data ?? undefined,
      domainMetrics: domainMetricsData ?? undefined,
      competitors: competitors.length > 0 ? competitors : undefined,
      apiCosts,
    }

    console.log('[Perception Service] Complete:', {
      mentions: perception.llmMentionsCount,
      aiVolume: perception.aiSearchVolume,
      hasKG: perception.knowledgeGraphExists,
      hasChatGPT: !!perception.chatGPTSummary,
      hasPerplexity: !!perception.perplexityInsight,
      competitorsFound: competitors.length,
      totalApiCost: `$${apiCosts.total.toFixed(2)}`,
    })

    return { success: true, perception, errors }
  } catch (error) {
    console.error('[Perception Service] Error:', error)
    errors.push(error instanceof Error ? error.message : 'Perception gathering failed')
    return { success: false, errors }
  }
}

