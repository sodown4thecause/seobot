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

// Gemini function declarations (13 tools)
export const dataForSEOFunctions = [
  // AI OPTIMIZATION (3 tools)
  {
    name: 'ai_keyword_search_volume',
    description: 'Get search volume for keywords in AI platforms like ChatGPT, Claude, Perplexity. Use for GEO (Generative Engine Optimization) analysis.',
    parameters: {
      type: 'object' as const,
      properties: {
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Keywords to analyze in AI platforms',
        },
        location: {
          type: 'string',
          description: 'Location (e.g., "United States", "United Kingdom")',
        },
      },
      required: ['keywords'],
    },
  },
  {
    name: 'chatgpt_search_results',
    description: 'Get actual ChatGPT search results for a keyword. Shows what sources ChatGPT references. Essential for AI optimization.',
    parameters: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: 'Keyword to search in ChatGPT',
        },
        location: {
          type: 'string',
          description: 'Location for results',
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'test_chatgpt_response',
    description: 'Test how ChatGPT responds to a specific prompt. Useful for understanding AI behavior and optimization.',
    parameters: {
      type: 'object' as const,
      properties: {
        prompt: {
          type: 'string',
          description: 'Prompt to test with ChatGPT',
        },
        model: {
          type: 'string',
          description: 'ChatGPT model (gpt-4o, gpt-4-turbo, etc.)',
        },
      },
      required: ['prompt'],
    },
  },

  // KEYWORD RESEARCH (3 tools)
  {
    name: 'keyword_search_volume',
    description: 'Get Google search volume, CPC, and competition for keywords. Core keyword research tool.',
    parameters: {
      type: 'object' as const,
      properties: {
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Keywords to analyze (max 100)',
        },
        location: {
          type: 'string',
          description: 'Location for data',
        },
      },
      required: ['keywords'],
    },
  },
  {
    name: 'keyword_suggestions',
    description: 'Find related keyword ideas and suggestions based on seed keywords. Great for content ideation.',
    parameters: {
      type: 'object' as const,
      properties: {
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Seed keywords to get suggestions for',
        },
        location: {
          type: 'string',
          description: 'Location for suggestions',
        },
      },
      required: ['keywords'],
    },
  },
  {
    name: 'keyword_difficulty',
    description: 'Get SEO difficulty scores for keywords (0-100). Higher = harder to rank.',
    parameters: {
      type: 'object' as const,
      properties: {
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Keywords to check difficulty for',
        },
        location: {
          type: 'string',
          description: 'Location for difficulty data',
        },
      },
      required: ['keywords'],
    },
  },

  // SERP ANALYSIS (2 tools)
  {
    name: 'google_rankings',
    description: 'Get current Google SERP results for a keyword including position, URL, title, and SERP features.',
    parameters: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: 'Keyword to check rankings for',
        },
        location: {
          type: 'string',
          description: 'Location for SERP results',
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'ranking_domains',
    description: 'Find which domains rank for a specific keyword with their positions and metrics.',
    parameters: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: 'Keyword to analyze',
        },
        location: {
          type: 'string',
          description: 'Location for analysis',
        },
      },
      required: ['keyword'],
    },
  },

  // COMPETITOR ANALYSIS (2 tools)
  {
    name: 'find_competitors',
    description: 'Discover competitor domains based on keyword overlap and SEO metrics.',
    parameters: {
      type: 'object' as const,
      properties: {
        domain: {
          type: 'string',
          description: 'Domain to find competitors for (without http://)',
        },
      },
      required: ['domain'],
    },
  },
  {
    name: 'keyword_overlap',
    description: 'Find keywords that multiple domains rank for. Great for competitive analysis.',
    parameters: {
      type: 'object' as const,
      properties: {
        domains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Domains to analyze (2-10 domains)',
        },
        location: {
          type: 'string',
          description: 'Location for analysis',
        },
      },
      required: ['domains'],
    },
  },

  // DOMAIN ANALYSIS (3 tools)
  {
    name: 'domain_overview',
    description: 'Get comprehensive SEO metrics for a domain: traffic, keywords, rankings, visibility.',
    parameters: {
      type: 'object' as const,
      properties: {
        domain: {
          type: 'string',
          description: 'Domain to analyze (without http://)',
        },
        location: {
          type: 'string',
          description: 'Location for metrics',
        },
      },
      required: ['domain'],
    },
  },
  {
    name: 'domain_keywords',
    description: 'Get all keywords a domain ranks for with positions and search volumes.',
    parameters: {
      type: 'object' as const,
      properties: {
        domain: {
          type: 'string',
          description: 'Domain to analyze (without http://)',
        },
        location: {
          type: 'string',
          description: 'Location for keyword data',
        },
        limit: {
          type: 'number',
          description: 'Max keywords to return (default: 100)',
        },
      },
      required: ['domain'],
    },
  },
  {
    name: 'top_pages',
    description: 'Find the top-performing pages of a domain by organic traffic and rankings.',
    parameters: {
      type: 'object' as const,
      properties: {
        domain: {
          type: 'string',
          description: 'Domain to analyze (without http://)',
        },
        location: {
          type: 'string',
          description: 'Location for page data',
        },
        limit: {
          type: 'number',
          description: 'Max pages to return (default: 100)',
        },
      },
      required: ['domain'],
    },
  },
]

// Function call handlers
export async function handleDataForSEOFunctionCall(
  functionName: string,
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
            const validData = data.filter((item: any) => item && Object.keys(item).length > 0)
            if (validData.length === 0) {
              console.warn('[Tool] ai_keyword_search_volume: All items are empty objects', data)
              return []
            }

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

        const formatted = data.slice(0, args.limit || 100).map((item: any) => ({
          url: item.url,
          keywords: item.metrics?.organic?.count,
          traffic: item.metrics?.organic?.etv,
        }))

        return JSON.stringify(formatted, null, 2)
      }

      default:
        return `Unknown function: ${functionName}`
    }
  } catch (error: any) {
    return `Error executing ${functionName}: ${error.message}`
  }
}
