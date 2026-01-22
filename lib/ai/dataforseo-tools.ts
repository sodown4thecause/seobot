/**
 * DataForSEO Function Calling Tools for AI SDK 6
 *
 * 13 essential SEO tools with Redis caching for performance
 */

import {
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
} from '@/lib/api/dataforseo-service'
import { cachedDataForSEOCall } from './dataforseo-cache'
import { compositeSEOTools } from '@/lib/tools/composite-seo-tools'

// Function call handlers
export async function handleDataForSEOFunctionCall(
  functionName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Record<string, any>
): Promise<string> {
  try {
    switch (functionName) {
      // AI OPTIMIZATION
      case 'ai_keyword_search_volume': {
        const formatted = await cachedDataForSEOCall(
          'ai_keyword_search_volume',
          args,
          async () => {
            const result = await aiKeywordSearchVolume({
              keywords: args.keywords,
              location_name: args.location,
            })

            if (!result.success) {
              console.error('[Tool] ai_keyword_search_volume error:', result.error)
              throw new Error(result.error.message)
            }

            console.log('[Tool] ai_keyword_search_volume raw response:', JSON.stringify(result.data, null, 2))

            const data = result.data.tasks?.[0]?.result
            if (!data || data.length === 0) {
              console.warn('[Tool] ai_keyword_search_volume: No data in response')
              return []
            }

            // Filter out empty objects and check if we have valid data
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const validData = data.filter((item: any) => item && Object.keys(item).length > 0)
            if (validData.length === 0) {
              console.warn('[Tool] ai_keyword_search_volume: All items are empty objects', data)
              return []
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return validData.map((item: any) => ({
              keyword: item.keyword,
              search_volume: item.search_volume ?? item.monthly_searches ?? null,
              monthly_searches: item.monthly_searches ?? item.search_volume ?? null,
              platform: item.platform || 'unknown',
            }))
          }
        )

        if (formatted.length === 0) {
          return 'No AI search volume data found.'
        }

        return JSON.stringify(formatted, null, 2)
      }

      case 'chatgpt_search_results': {
        const result = await chatGPTLLMScraper({
          keyword: args.keyword,
          location_name: args.location,
        })

        if (!result.success) return `Error: ${result.error.message}`

        const items = result.data.tasks?.[0]?.result?.[0]?.items
        if (!items || items.length === 0) return 'No ChatGPT results found.'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = items.slice(0, 10).map((item: any) => ({
          type: item.type,
          title: item.title,
          description: item.description,
          url: item.url,
          domain: item.domain,
        }))

        return JSON.stringify(formatted, null, 2)
      }

      case 'test_chatgpt_response': {
        const result = await chatGPTLLMResponses({
          prompt: args.prompt,
          model: args.model,
        })

        if (!result.success) return `Error: ${result.error.message}`

        const response = result.data.tasks?.[0]?.result?.[0]
        if (!response) return 'No response from ChatGPT.'

        return JSON.stringify({
          message: response.message,
          model: response.model,
          tokens: response.tokens,
        }, null, 2)
      }

      // KEYWORD RESEARCH
      case 'keyword_search_volume': {
        const formatted = await cachedDataForSEOCall(
          'keyword_search_volume',
          args,
          async () => {
            const result = await keywordResearch({
              keywords: args.keywords,
            })

            if (!result.success) throw new Error(result.error.message)

            const data = result.data.tasks?.[0]?.result
            if (!data || data.length === 0) return []

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return data.map((item: any) => ({
              keyword: item.keyword,
              search_volume: item.search_volume,
              cpc: item.cpc,
              competition: item.competition,
            }))
          }
        )

        if (formatted.length === 0) return 'No keyword data found.'
        return JSON.stringify(formatted, null, 2)
      }

      case 'keyword_suggestions': {
        const formatted = await cachedDataForSEOCall(
          'keyword_suggestions',
          args,
          async () => {
            const result = await keywordsForKeywords({
              keywords: args.keywords,
            })

            if (!result.success) throw new Error(result.error.message)

            const data = result.data.tasks?.[0]?.result
            if (!data || data.length === 0) return []

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return data.slice(0, 50).map((item: any) => ({
              keyword: item.keyword,
              search_volume: item.search_volume,
              competition: item.competition,
            }))
          }
        )

        if (formatted.length === 0) return 'No keyword suggestions found.'
        return JSON.stringify(formatted, null, 2)
      }

      case 'keyword_difficulty': {
        const formatted = await cachedDataForSEOCall(
          'keyword_difficulty',
          args,
          async () => {
            const result = await bulkKeywordDifficulty({
              keywords: args.keywords,
              location_name: args.location,
            })

            if (!result.success) throw new Error(result.error.message)

            const data = result.data.tasks?.[0]?.result
            if (!data || data.length === 0) return []

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return data.map((item: any) => ({
              keyword: item.keyword,
              difficulty: item.keyword_difficulty,
              search_volume: item.search_volume,
            }))
          }
        )

        if (formatted.length === 0) return 'No difficulty data found.'
        return JSON.stringify(formatted, null, 2)
      }

      // SERP ANALYSIS
      case 'google_rankings': {
        const result = await serpAnalysis({
          keyword: args.keyword,
        })

        if (!result.success) return `Error: ${result.error.message}`

        const items = result.data.tasks?.[0]?.result?.[0]?.items
        if (!items || items.length === 0) return 'No SERP results found.'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = items.slice(0, 10).map((item: any) => ({
          position: item.rank_absolute,
          url: item.url,
          domain: item.domain,
          title: item.title,
          type: item.type,
        }))

        return JSON.stringify(formatted, null, 2)
      }

      case 'ranking_domains': {
        const result = await serpCompetitors({
          keyword: args.keyword,
          location_name: args.location,
        })

        if (!result.success) return `Error: ${result.error.message}`

        const data = result.data.tasks?.[0]?.result
        if (!data || data.length === 0) return 'No ranking domains found.'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = data.slice(0, 20).map((item: any) => ({
          domain: item.domain,
          avg_position: item.avg_position,
          visibility: item.etv,
        }))

        return JSON.stringify(formatted, null, 2)
      }

      // COMPETITOR ANALYSIS
      case 'find_competitors': {
        const result = await competitorAnalysis({ domain: args.domain })

        if (!result.success) return `Error: ${result.error.message}`

        const data = result.data.tasks?.[0]?.result
        if (!data || data.length === 0) return 'No competitors found.'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = data.slice(0, 10).map((item: any) => ({
          domain: item.domain,
          avg_position: item.avg_position,
          intersections: item.intersections,
        }))

        return JSON.stringify(formatted, null, 2)
      }

      case 'keyword_overlap': {
        const result = await domainIntersection({
          targets: args.domains,
          location_name: args.location,
        })

        if (!result.success) return `Error: ${result.error.message}`

        const data = result.data.tasks?.[0]?.result
        if (!data || data.length === 0) return 'No keyword overlap found.'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = data.slice(0, 50).map((item: any) => ({
          keyword: item.keyword,
          search_volume: item.search_volume,
          intersection_result: item.intersection_result,
        }))

        return JSON.stringify(formatted, null, 2)
      }

      // DOMAIN ANALYSIS
      case 'domain_overview': {
        const result = await domainRankOverview({
          target: args.domain,
          location_name: args.location,
        })

        if (!result.success) return `Error: ${result.error.message}`

        const data = result.data.tasks?.[0]?.result?.[0]
        if (!data) return 'No domain data found.'

        return JSON.stringify({
          domain: data.target,
          organic_keywords: data.metrics?.organic?.count,
          organic_traffic: data.metrics?.organic?.etv,
          organic_cost: data.metrics?.organic?.estimated_paid_traffic_cost,
          paid_keywords: data.metrics?.paid?.count,
        }, null, 2)
      }

      case 'domain_keywords': {
        const result = await rankedKeywords({
          target: args.domain,
          location_name: args.location,
          limit: args.limit,
        })

        if (!result.success) return `Error: ${result.error.message}`

        const data = result.data.tasks?.[0]?.result
        if (!data || data.length === 0) return 'No keywords found.'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = data.slice(0, args.limit || 100).map((item: any) => ({
          keyword: item.keyword_data?.keyword,
          position: item.ranked_serp_element?.serp_item?.rank_absolute,
          search_volume: item.keyword_data?.keyword_info?.search_volume,
        }))

        return JSON.stringify(formatted, null, 2)
      }

      case 'top_pages': {
        const result = await relevantPages({
          target: args.domain,
          location_name: args.location,
          limit: args.limit,
        })

        if (!result.success) return `Error: ${result.error.message}`

        const data = result.data.tasks?.[0]?.result
        if (!data || data.length === 0) return 'No pages found.'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = data.slice(0, args.limit || 100).map((item: any) => ({
          url: item.url,
          keywords: item.metrics?.organic?.count,
          traffic: item.metrics?.organic?.etv,
        }))

        return JSON.stringify(formatted, null, 2)
      }

      // COMPOSITE TOOLS
      case 'keyword_intelligence': {
        if (!compositeSEOTools.keyword_intelligence?.execute) return 'Tool not available'
        const toolOptions = { abortSignal: new AbortController().signal, toolCallId: 'keyword-intelligence', messages: [] }
        const result = await compositeSEOTools.keyword_intelligence.execute({
          keyword: args.keyword,
          location: args.location || 'United States',
          language: args.language || 'en',
          includeHistorical: args.includeHistorical !== false,
          includeAISearch: args.includeAISearch !== false,
        }, toolOptions)
        return typeof result === 'string' ? result : JSON.stringify(result, null, 2)
      }

      case 'competitor_content_gap': {
        if (!compositeSEOTools.competitor_content_gap?.execute) return 'Tool not available'
        const toolOptions = { abortSignal: new AbortController().signal, toolCallId: 'competitor-content-gap', messages: [] }
        const result = await compositeSEOTools.competitor_content_gap.execute({
          yourDomain: args.yourDomain,
          competitorDomains: args.competitorDomains,
          location: args.location || 'United States',
          language: args.language || 'en',
        }, toolOptions)
        return typeof result === 'string' ? result : JSON.stringify(result, null, 2)
      }

      case 'bulk_traffic_estimator': {
        if (!compositeSEOTools.bulk_traffic_estimator?.execute) return 'Tool not available'
        const toolOptions = { abortSignal: new AbortController().signal, toolCallId: 'bulk-traffic-estimator', messages: [] }
        const result = await compositeSEOTools.bulk_traffic_estimator.execute({
          targets: args.targets,
          location: args.location || 'United States',
          language: args.language || 'en',
        }, toolOptions)
        return typeof result === 'string' ? result : JSON.stringify(result, null, 2)
      }

      default:
        return `Unknown function: ${functionName}`
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return `Error executing ${functionName}: ${error.message}`
  }
}
