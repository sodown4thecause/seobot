/**
 * AEO Trust Auditor - Perception Service (Phase 2)
 *
 * Gathers AI perception data from DataForSEO:
 * - LLM Mentions (how often AI mentions the brand)
 * - ChatGPT Scraper (what ChatGPT says about the brand)
 * - AI Search Volume (are people asking AI about this topic?)
 * - Knowledge Graph (is the brand recognized as an entity?)
 */

import {
  llmMentionsSearch,
  llmMentionsAggregated,
  chatGPTLLMScraper,
  aiKeywordSearchVolume,
  knowledgeGraphCheck,
} from '@/lib/api/dataforseo-service'
import { type AIPerception } from './schemas'

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
  totalVolume: number
  mentions: Array<{ source: string; context: string; question?: string }>
}> {
  try {
    // Run both search (for details) and aggregated (for counts) in parallel
    const domain = url ? extractDomain(url) : undefined
    console.log('[Perception] LLM Mentions: Fetching for', { brandName, domain })

    const [searchResponse, aggregatedResponse] = await Promise.all([
      llmMentionsSearch({ brandName, limit: 20, platform: 'google' }),
      llmMentionsAggregated({ brandName, domain, platform: 'google' }),
    ])

    // Log raw responses for debugging
    console.log('[Perception] LLM Search Response:', {
      success: searchResponse.success,
      tasksCount: searchResponse.data?.tasks?.length ?? 0,
      resultCount: searchResponse.data?.tasks?.[0]?.result?.length ?? 0,
    })
    console.log('[Perception] LLM Aggregated Response:', {
      success: aggregatedResponse.success,
      tasksCount: aggregatedResponse.data?.tasks?.length ?? 0,
      resultCount: aggregatedResponse.data?.tasks?.[0]?.result?.length ?? 0,
    })

    // Extract search results for detailed mentions
    const searchResult = searchResponse.success ? searchResponse.data?.tasks?.[0]?.result?.[0] : null
    const mentions = (searchResult?.items ?? []).map((item) => ({
      source: item.sources?.[0]?.domain ?? 'AI Response',
      context: item.answer?.slice(0, 500) ?? '',
      question: item.question,
    }))

    // Extract aggregated metrics for total count
    const aggResult = aggregatedResponse.success
      ? aggregatedResponse.data?.tasks?.[0]?.result?.[0]
      : null
    const totalCount = aggResult?.total_count ?? searchResult?.total_count ?? searchResult?.items_count ?? mentions.length
    const totalVolume = aggResult?.total_ai_search_volume ?? 0

    console.log('[Perception] LLM Mentions Result:', {
      searchItemsReturned: searchResult?.items_count ?? 0,
      totalCount,
      totalVolume,
      sampleMentions: mentions.slice(0, 2).map((m) => ({ source: m.source, question: m.question })),
    })

    return {
      count: totalCount,
      totalVolume,
      mentions,
    }
  } catch (error) {
    console.error('[Perception] LLM Mentions error:', error)
    return { count: 0, totalVolume: 0, mentions: [] }
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
      hasData: !!scraperResponse.data,
      tasksCount: scraperResponse.data?.tasks?.length ?? 0,
    })

    // Log full response structure for debugging
    const taskResult = scraperResponse.data?.tasks?.[0]?.result?.[0]
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

        const llmResult = llmResponse.data?.tasks?.[0]?.result?.[0] as {
          response?: string
          message?: string
        }
        text = llmResult?.response ?? llmResult?.message ?? ''

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
      hasData: !!response.data,
    })

    // The response structure is different - items contain the search volume
    const taskResult = response.data?.tasks?.[0]?.result?.[0]
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
      hasData: !!response.data,
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
 * Main perception gathering - Phase 2 of the AEO Audit
 * Runs all DataForSEO calls in parallel for performance
 */
export async function runPerceptionService(params: {
  brandName: string
  url?: string
}): Promise<PerceptionResult> {
  console.log('[Perception Service] Gathering AI perception for:', params.brandName)
  const errors: string[] = []

  try {
    // Run all API calls in parallel
    const [llmMentions, chatGPT, aiVolume, kg] = await Promise.all([
      getLLMMentions(params.brandName, params.url),
      getChatGPTPerception(params.brandName),
      getAISearchVolume(params.brandName),
      getKnowledgeGraphStatus(params.brandName),
    ])

    const perception: AIPerception = {
      llmMentionsCount: llmMentions.count,
      llmMentions: llmMentions.mentions.map((m) => ({
        source: m.source,
        context: m.context,
        sentiment: undefined,
      })),
      chatGPTSummary: chatGPT.summary || "AI doesn't have information about this brand.",
      chatGPTRawResponse: chatGPT.raw,
      aiSearchVolume: llmMentions.totalVolume || aiVolume, // Prefer LLM volume, fallback to keyword volume
      knowledgeGraphExists: kg.exists,
      knowledgeGraphData: kg.data ?? undefined,
    }

    console.log('[Perception Service] Complete:', {
      mentions: perception.llmMentionsCount,
      aiVolume: perception.aiSearchVolume,
      hasKG: perception.knowledgeGraphExists,
      hasSummary: !!perception.chatGPTSummary,
    })

    return { success: true, perception, errors }
  } catch (error) {
    console.error('[Perception Service] Error:', error)
    errors.push(error instanceof Error ? error.message : 'Perception gathering failed')
    return { success: false, errors }
  }
}

