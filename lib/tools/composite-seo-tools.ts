/**
 * Composite SEO Tools
 * Powerful tools that combine multiple DataForSEO endpoints for comprehensive analysis
 */

import { tool } from 'ai'
import { z } from 'zod'
import { mcpDataforseoTools } from '@/lib/mcp/dataforseo/index'
import { keywordTrendAnalyzer } from '@/lib/ai/keyword-trend-analyzer'
import { aiSearchOptimizer } from '@/lib/ai/ai-search-optimizer'
import { contentGapAnalyzer } from '@/lib/ai/content-gap-analyzer'

// Helper to safely execute MCP tools with required options argument
async function safeExecute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolFn: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any,
  ctx?: { abortSignal?: AbortSignal }
): Promise<string | null> {
  try {
    if (!toolFn?.execute) return null
    const result = await toolFn.execute(params, { 
      abortSignal: ctx?.abortSignal ?? new AbortController().signal,
      toolCallId: 'composite-tool-call',
      messages: []
    })
    return result
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    return null
  }
}

/**
 * Keyword Intelligence Report Tool
 * Combines search volume, difficulty, historical trends, AI search, and SERP features
 */
export const keywordIntelligenceTool = tool({
  description: `Generate a complete keyword intelligence report combining volume, difficulty, trends, SERP features, and AI search data. This provides comprehensive keyword analysis in a single call.`,
  inputSchema: z.object({
    keyword: z.string().describe('Primary keyword to analyze'),
    location: z.string().default('United States').describe('Target location'),
    language: z.string().default('en').describe('Language code'),
    includeHistorical: z.boolean().default(true).describe('Include historical trend analysis'),
    includeAISearch: z.boolean().default(true).describe('Include AI search volume (ChatGPT, Perplexity)'),
  }),
  execute: async (
    { keyword, location, language, includeHistorical, includeAISearch },
    ctx?: { abortSignal?: AbortSignal }
  ) => {
    try {
      // Parallel API calls for performance
      const [
        searchVolumeResult,
        difficultyResult,
        serpResult,
        searchIntentResult,
        historicalResult,
        aiSearchResult,
      ] = await Promise.all([
        // Basic keyword data
        safeExecute(mcpDataforseoTools.keywords_data_google_ads_search_volume, {
          keywords: [keyword],
          location_name: location,
          language_code: language,
        }, ctx),

        // Keyword difficulty
        safeExecute(mcpDataforseoTools.dataforseo_labs_bulk_keyword_difficulty, {
          keywords: [keyword],
          location_name: location,
          language_code: language,
        }, ctx),

        // SERP analysis
        safeExecute(mcpDataforseoTools.serp_organic_live_advanced, {
          keyword,
          location_name: location,
          language_code: language,
          device: 'desktop',
        }, ctx),

        // Search intent
        safeExecute(mcpDataforseoTools.dataforseo_labs_search_intent, {
          keywords: [keyword],
        }, ctx),

        // Historical (conditional)
        includeHistorical
          ? safeExecute(mcpDataforseoTools.dataforseo_labs_google_historical_keyword_data, {
              keywords: [keyword],
              location_name: location,
              language_code: language,
            }, ctx)
          : Promise.resolve(null),

        // AI search (conditional)
        includeAISearch
          ? safeExecute(mcpDataforseoTools.ai_optimization_keyword_data_search_volume, {
              keywords: [keyword],
              location_name: location,
              language_code: language,
            }, ctx)
          : Promise.resolve(null),
      ])

      // Parse results
      const parseResult = (result: any) => {
        if (!result) return null
        try {
          return typeof result === 'string' ? JSON.parse(result) : result
        } catch {
          return result
        }
      }

      const volumeData = parseResult(searchVolumeResult)
      const difficultyData = parseResult(difficultyResult)
      const serpData = parseResult(serpResult)
      const intentData = parseResult(searchIntentResult)
      const historicalData = parseResult(historicalResult)
      const aiData = parseResult(aiSearchResult)

      // Extract metrics
      const volume = volumeData?.tasks?.[0]?.result?.[0]?.items?.[0] || {}
      const difficulty = difficultyData?.tasks?.[0]?.result?.[0]?.items?.[0] || {}
      const serp = serpData?.tasks?.[0]?.result?.[0] || {}
      const intent = intentData?.tasks?.[0]?.result?.[0]?.items?.[0] || {}
      const historical = historicalData?.tasks?.[0]?.result?.[0] || {}
      const ai = aiData?.tasks?.[0]?.result?.[0]?.items?.[0] || {}

      // Analyze trends if historical data available
      let trendAnalysis = null
      if (includeHistorical && historical) {
        trendAnalysis = await keywordTrendAnalyzer.analyzeTrend(keyword, location, language)
      }

      // Analyze AI search if available
      let aiAnalysis = null
      if (includeAISearch && ai) {
        const aiVolumes = await aiSearchOptimizer.analyzeAISearchVolume(
          [keyword],
          location,
          language,
          undefined,
          ctx?.abortSignal
        )
        if (aiVolumes.keywords.length > 0) {
          aiAnalysis = aiVolumes.keywords[0]
        }
      }

      // Extract SERP features
      const serpFeatures: string[] = []
      if (serp.items) {
        serp.items.forEach((item: any) => {
          if (item.type === 'featured_snippet') serpFeatures.push('Featured Snippet')
          if (item.type === 'people_also_ask') serpFeatures.push('People Also Ask')
          if (item.type === 'related_searches') serpFeatures.push('Related Searches')
          if (item.type === 'local_pack') serpFeatures.push('Local Pack')
        })
      }

      // Calculate overall opportunity score
      const opportunityScore = calculateOverallOpportunity({
        volume: volume.search_volume || 0,
        difficulty: difficulty.keyword_difficulty || 100,
        aiVolume: aiAnalysis?.aiTotalVolume || 0,
        trend: trendAnalysis?.trend || 'stable',
        yoyGrowth: trendAnalysis?.yoyGrowth || 0,
      })

      return {
        keyword,
        metrics: {
          monthlyVolume: volume.search_volume || 0,
          difficulty: difficulty.keyword_difficulty || 0,
          cpc: volume.cpc || 0,
          competition: volume.competition || 0,
        },
        intent: intent.intent || 'informational',
        serpFeatures: [...new Set(serpFeatures)],
        trend: trendAnalysis,
        aiSearch: aiAnalysis ? {
          chatgptVolume: aiAnalysis.chatgptVolume,
          perplexityVolume: aiAnalysis.perplexityVolume,
          aiOpportunityScore: aiAnalysis.aiOpportunityScore,
          aiVsTraditionalRatio: aiAnalysis.aiVsTraditionalRatio,
        } : null,
        opportunity: {
          score: opportunityScore,
          level: opportunityScore >= 70 ? 'high' : opportunityScore >= 50 ? 'medium' : 'low',
          reasoning: generateOpportunityReasoning({
            volume: volume.search_volume || 0,
            difficulty: difficulty.keyword_difficulty || 100,
            aiVolume: aiAnalysis?.aiTotalVolume || 0,
            trend: trendAnalysis?.trend || 'stable',
          }),
        },
      }
    } catch (error) {
      console.error('Keyword intelligence tool error:', error)
      return {
        keyword,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
})

/**
 * Competitor Content Gap Analysis Tool
 * Analyzes content gaps between your domain and competitors
 */
export const competitorContentGapTool = tool({
  description: `Analyze content gaps between your domain and competitors using ranked keywords, relevant pages, and page intersection. Identifies keywords competitors rank for that you don't, grouped by topic clusters.`,
  inputSchema: z.object({
    yourDomain: z.string().describe('Your domain (without https://)'),
    competitorDomains: z.array(z.string()).max(5).describe('Competitor domains (without https://)'),
    location: z.string().default('United States').describe('Target location'),
    language: z.string().default('en').describe('Language code'),
  }),
  execute: async ({ yourDomain, competitorDomains, location, language }) => {
    try {
      // Use the content gap analyzer
      const analysis = await contentGapAnalyzer.analyzeContentGaps(
        yourDomain,
        competitorDomains,
        location,
        language
      )

      return {
        summary: {
          totalGaps: analysis.totalGaps,
          highValueGaps: analysis.highValueGaps,
          quickWins: analysis.quickWins,
        },
        clusters: analysis.clusters.map(cluster => ({
          topic: cluster.topic,
          keywordCount: cluster.keywords.length,
          totalVolume: cluster.totalVolume,
          avgDifficulty: cluster.avgDifficulty,
          opportunityScore: cluster.opportunityScore,
          contentSuggestions: cluster.contentSuggestions,
        })),
        topOpportunities: analysis.topOpportunities.map(gap => ({
          keyword: gap.keyword,
          searchVolume: gap.searchVolume,
          competitorRanking: gap.competitorRanking,
          yourRanking: gap.yourRanking,
          opportunity: gap.opportunity,
          topic: gap.topic,
          contentType: gap.contentType,
          estimatedTraffic: gap.estimatedTraffic,
        })),
        recommendations: analysis.recommendations,
      }
    } catch (error) {
      console.error('Content gap analysis tool error:', error)
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
})

/**
 * Bulk Traffic Estimator Tool
 * Estimates traffic for multiple URLs/pages for content portfolio analysis
 */
export const bulkTrafficEstimatorTool = tool({
  description: `Estimate monthly traffic for multiple domains, subdomains, or webpages. Useful for content portfolio analysis and ROI projections.`,
  inputSchema: z.object({
    targets: z.array(z.string()).max(1000).describe('Domains, subdomains, or webpage URLs to analyze'),
    location: z.string().default('United States').describe('Target location'),
    language: z.string().default('en').describe('Language code'),
  }),
  execute: async ({ targets, location, language }) => {
    try {
      const result = await safeExecute(mcpDataforseoTools.dataforseo_labs_bulk_traffic_estimation, {
        targets,
        location_name: location,
        language_code: language,
        ignore_synonyms: true,
      })

      const data = typeof result === 'string' ? JSON.parse(result) : result

      if (!data || !data.tasks || data.tasks.length === 0) {
        return {
          error: 'No data returned from traffic estimation',
        }
      }

      const taskData = data.tasks[0]
      if (!taskData.result || taskData.result.length === 0) {
        return {
          error: 'No results in response',
        }
      }

      const items = taskData.result[0].items || []

      // Process and aggregate results
      const trafficData = items.map((item: any) => ({
        target: item.target || '',
        organicTraffic: item.metrics?.organic?.etv || 0,
        paidTraffic: item.metrics?.paid?.etv || 0,
        featuredSnippetTraffic: item.metrics?.featured_snippet?.etv || 0,
        localPackTraffic: item.metrics?.local_pack?.etv || 0,
        totalTraffic: (item.metrics?.organic?.etv || 0) +
          (item.metrics?.paid?.etv || 0) +
          (item.metrics?.featured_snippet?.etv || 0) +
          (item.metrics?.local_pack?.etv || 0),
        keywordCount: item.metrics?.organic?.count || 0,
      }))

      // Calculate portfolio metrics
      type TrafficItem = { target: string; organicTraffic: number; paidTraffic: number; featuredSnippetTraffic: number; localPackTraffic: number; totalTraffic: number; keywordCount: number }
      const totalTraffic = trafficData.reduce((sum: number, item: TrafficItem) => sum + item.totalTraffic, 0)
      const totalOrganicTraffic = trafficData.reduce((sum: number, item: TrafficItem) => sum + item.organicTraffic, 0)
      const avgTrafficPerPage = trafficData.length > 0 ? totalTraffic / trafficData.length : 0
      const topPerformers = trafficData
        .sort((a: TrafficItem, b: TrafficItem) => b.totalTraffic - a.totalTraffic)
        .slice(0, 10)

      return {
        targets: trafficData,
        portfolioMetrics: {
          totalTraffic,
          totalOrganicTraffic,
          avgTrafficPerPage,
          totalPages: trafficData.length,
          topPerformers,
        },
        recommendations: generateTrafficRecommendations(trafficData, topPerformers),
      }
    } catch (error) {
      console.error('Bulk traffic estimator tool error:', error)
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
})

// Helper functions

function calculateOverallOpportunity(params: {
  volume: number
  difficulty: number
  aiVolume: number
  trend: string
  yoyGrowth: number
}): number {
  let score = 0

  // Volume component (30%)
  if (params.volume > 10000) score += 30
  else if (params.volume > 5000) score += 25
  else if (params.volume > 1000) score += 20
  else if (params.volume > 500) score += 15
  else if (params.volume > 100) score += 10

  // Difficulty component (30%) - lower difficulty = higher score
  if (params.difficulty < 30) score += 30
  else if (params.difficulty < 50) score += 25
  else if (params.difficulty < 70) score += 15
  else score += 5

  // AI volume component (20%)
  if (params.aiVolume > 1000) score += 20
  else if (params.aiVolume > 500) score += 15
  else if (params.aiVolume > 100) score += 10
  else if (params.aiVolume > 0) score += 5

  // Trend component (20%)
  if (params.trend === 'rising') score += 20
  else if (params.trend === 'stable') score += 10
  else if (params.trend === 'seasonal') score += 15
  else score += 5

  return Math.min(100, score)
}

function generateOpportunityReasoning(params: {
  volume: number
  difficulty: number
  aiVolume: number
  trend: string
}): string {
  const reasons: string[] = []

  if (params.volume > 1000) {
    reasons.push(`High search volume (${params.volume.toLocaleString()}/month)`)
  }

  if (params.difficulty < 50) {
    reasons.push(`Low competition (difficulty: ${params.difficulty})`)
  }

  if (params.aiVolume > 500) {
    reasons.push(`Significant AI search volume (${params.aiVolume.toLocaleString()}/month)`)
  }

  if (params.trend === 'rising') {
    reasons.push('Trending upward')
  } else if (params.trend === 'seasonal') {
    reasons.push('Strong seasonal pattern')
  }

  return reasons.join(', ') || 'Moderate opportunity'
}

function generateTrafficRecommendations(
  trafficData: Array<{ target: string; totalTraffic: number; organicTraffic: number }>,
  topPerformers: Array<{ target: string; totalTraffic: number }>
): string[] {
  const recommendations: string[] = []

  // Identify low performers
  const lowPerformers = trafficData.filter(item => item.totalTraffic < 100)
  if (lowPerformers.length > 0) {
    recommendations.push(
      `${lowPerformers.length} pages have low traffic (<100/month). Consider optimizing or consolidating these pages.`
    )
  }

  // Identify high performers
  if (topPerformers.length > 0) {
    const topTraffic = topPerformers[0].totalTraffic
    recommendations.push(
      `Top performer: ${topPerformers[0].target} with ${topTraffic.toLocaleString()} monthly traffic. Use as template for other content.`
    )
  }

  // Calculate average and suggest improvements
  const avgTraffic = trafficData.reduce((sum, item) => sum + item.totalTraffic, 0) / trafficData.length
  if (avgTraffic < 500) {
    recommendations.push(
      `Average traffic per page is ${Math.round(avgTraffic)}. Focus on improving content quality and keyword targeting.`
    )
  }

  return recommendations
}

/**
 * Export all composite tools
 */
export const compositeSEOTools = {
  keyword_intelligence: keywordIntelligenceTool,
  competitor_content_gap: competitorContentGapTool,
  bulk_traffic_estimator: bulkTrafficEstimatorTool,
}
