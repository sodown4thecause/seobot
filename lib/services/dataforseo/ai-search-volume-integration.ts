import { aiKeywordSearchVolume, chatGPTLLMScraper } from '@/lib/api/dataforseo-service'
import type { ApiResult } from '@/lib/types/api-responses'

export interface AISearchVolumeData {
  keyword: string
  chatgptSearchVolume: number
  perplexitySearchVolume: number
  totalAISearchVolume: number
  traditionalSearchVolume: number
  aiOpportunityScore: number
  aiVsTraditionalRatio: number
  platform_data: {
    chatgpt?: {
      search_volume: number
      competition_level?: string
      trend?: 'rising' | 'stable' | 'declining'
    }
    perplexity?: {
      search_volume: number
      competition_level?: string
      trend?: 'rising' | 'stable' | 'declining'
    }
  }
}

export interface AISearchVolumeAnalysis {
  keywords: AISearchVolumeData[]
  summary: {
    totalKeywords: number
    averageAIOpportunityScore: number
    highOpportunityKeywords: number // Score > 70
    aiDominantKeywords: number // AI volume > traditional volume
    topAIKeywords: AISearchVolumeData[]
  }
  insights: {
    aiTrends: string[]
    opportunityRecommendations: string[]
    platformPreferences: {
      chatgpt_preferred: string[]
      perplexity_preferred: string[]
      balanced: string[]
    }
  }
}

export interface AISearchVolumeParams {
  keywords: string[]
  location_name?: string
  language_code?: string
  includeTraditionalVolume?: boolean
}

export async function analyzeAISearchVolume(
  params: AISearchVolumeParams
): Promise<ApiResult<AISearchVolumeAnalysis>> {
  try {
    // Get AI search volume data from DataForSEO
    const aiVolumeResult = await aiKeywordSearchVolume({
      keywords: params.keywords,
      location_name: params.location_name,
      language_code: params.language_code,
    })

    if (!aiVolumeResult.success) {
      return aiVolumeResult
    }

    const rawData = aiVolumeResult.data?.tasks?.[0]?.result || []
    
    // Transform raw data into structured format
    const keywordData: AISearchVolumeData[] = rawData.map((item: any) => {
      const keyword = item.keyword || ''
      const chatgptVolume = item.ai_search_volume?.chatgpt || 0
      const perplexityVolume = item.ai_search_volume?.perplexity || 0
      const totalAIVolume = chatgptVolume + perplexityVolume
      const traditionalVolume = item.search_volume || 0
      
      // Calculate AI opportunity score (0-100)
      const aiOpportunityScore = calculateAIOpportunityScore({
        aiVolume: totalAIVolume,
        traditionalVolume,
        chatgptVolume,
        perplexityVolume,
        competition: item.competition_level || 'unknown'
      })

      const aiVsTraditionalRatio = traditionalVolume > 0 
        ? (totalAIVolume / traditionalVolume) * 100 
        : totalAIVolume > 0 ? 100 : 0

      return {
        keyword,
        chatgptSearchVolume: chatgptVolume,
        perplexitySearchVolume: perplexityVolume,
        totalAISearchVolume: totalAIVolume,
        traditionalSearchVolume: traditionalVolume,
        aiOpportunityScore,
        aiVsTraditionalRatio,
        platform_data: {
          chatgpt: {
            search_volume: chatgptVolume,
            competition_level: item.chatgpt_competition_level || 'unknown',
            trend: determineTrend(item.chatgpt_trend_data)
          },
          perplexity: {
            search_volume: perplexityVolume,
            competition_level: item.perplexity_competition_level || 'unknown',
            trend: determineTrend(item.perplexity_trend_data)
          }
        }
      }
    })

    // Calculate summary metrics
    const totalKeywords = keywordData.length
    const averageAIOpportunityScore = totalKeywords > 0 
      ? keywordData.reduce((sum, k) => sum + k.aiOpportunityScore, 0) / totalKeywords 
      : 0
    const highOpportunityKeywords = keywordData.filter(k => k.aiOpportunityScore > 70).length
    const aiDominantKeywords = keywordData.filter(k => k.aiVsTraditionalRatio > 100).length
    const topAIKeywords = keywordData
      .sort((a, b) => b.aiOpportunityScore - a.aiOpportunityScore)
      .slice(0, 10)

    // Generate insights
    const insights = generateAIInsights(keywordData)

    const analysis: AISearchVolumeAnalysis = {
      keywords: keywordData,
      summary: {
        totalKeywords,
        averageAIOpportunityScore,
        highOpportunityKeywords,
        aiDominantKeywords,
        topAIKeywords,
      },
      insights,
    }

    return {
      success: true,
      data: analysis,
    }
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'AI_SEARCH_VOLUME_ANALYSIS_ERROR',
        message: error.message || 'Failed to analyze AI search volume',
        statusCode: 500,
      },
    }
  }
}

function calculateAIOpportunityScore(params: {
  aiVolume: number
  traditionalVolume: number
  chatgptVolume: number
  perplexityVolume: number
  competition: string
}): number {
  const { aiVolume, traditionalVolume, chatgptVolume, perplexityVolume, competition } = params
  
  let score = 0
  
  // Base score from AI volume (0-40 points)
  if (aiVolume > 10000) score += 40
  else if (aiVolume > 5000) score += 30
  else if (aiVolume > 1000) score += 20
  else if (aiVolume > 100) score += 10
  
  // Platform diversity bonus (0-20 points)
  if (chatgptVolume > 0 && perplexityVolume > 0) {
    const balance = Math.min(chatgptVolume, perplexityVolume) / Math.max(chatgptVolume, perplexityVolume)
    score += balance * 20 // More balanced = higher score
  } else if (chatgptVolume > 0 || perplexityVolume > 0) {
    score += 10 // Single platform presence
  }
  
  // AI vs Traditional ratio bonus (0-20 points)
  if (traditionalVolume > 0) {
    const ratio = aiVolume / traditionalVolume
    if (ratio > 0.5) score += 20 // AI volume is significant vs traditional
    else if (ratio > 0.2) score += 15
    else if (ratio > 0.1) score += 10
    else if (ratio > 0.05) score += 5
  } else if (aiVolume > 0) {
    score += 15 // AI-only keyword
  }
  
  // Competition adjustment (0-20 points)
  switch (competition.toLowerCase()) {
    case 'low':
      score += 20
      break
    case 'medium':
      score += 10
      break
    case 'high':
      score += 0
      break
    default:
      score += 5
  }
  
  return Math.min(100, Math.max(0, score))
}

function determineTrend(trendData: any): 'rising' | 'stable' | 'declining' {
  if (!trendData || !Array.isArray(trendData) || trendData.length < 2) {
    return 'stable'
  }
  
  const recent = trendData.slice(-3).map((d: any) => d.search_volume || 0)
  const earlier = trendData.slice(0, 3).map((d: any) => d.search_volume || 0)
  
  const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length
  const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length
  
  if (recentAvg > earlierAvg * 1.1) return 'rising'
  if (recentAvg < earlierAvg * 0.9) return 'declining'
  return 'stable'
}

function generateAIInsights(keywordData: AISearchVolumeData[]): AISearchVolumeAnalysis['insights'] {
  const aiTrends: string[] = []
  const opportunityRecommendations: string[] = []
  const platformPreferences = {
    chatgpt_preferred: [] as string[],
    perplexity_preferred: [] as string[],
    balanced: [] as string[]
  }

  // Analyze trends
  const risingKeywords = keywordData.filter(k => 
    k.platform_data.chatgpt?.trend === 'rising' || k.platform_data.perplexity?.trend === 'rising'
  )
  
  if (risingKeywords.length > 0) {
    aiTrends.push(`${risingKeywords.length} keywords showing rising AI search trends`)
  }

  const highAIRatioKeywords = keywordData.filter(k => k.aiVsTraditionalRatio > 50)
  if (highAIRatioKeywords.length > 0) {
    aiTrends.push(`${highAIRatioKeywords.length} keywords have significant AI search volume vs traditional`)
  }

  // Generate recommendations
  const highOpportunityKeywords = keywordData.filter(k => k.aiOpportunityScore > 70)
  if (highOpportunityKeywords.length > 0) {
    opportunityRecommendations.push(`Focus on ${highOpportunityKeywords.length} high-opportunity AI keywords`)
  }

  const aiDominantKeywords = keywordData.filter(k => k.aiVsTraditionalRatio > 100)
  if (aiDominantKeywords.length > 0) {
    opportunityRecommendations.push(`Prioritize AEO optimization for ${aiDominantKeywords.length} AI-dominant keywords`)
  }

  // Categorize platform preferences
  keywordData.forEach(keyword => {
    const chatgptVolume = keyword.chatgptSearchVolume
    const perplexityVolume = keyword.perplexitySearchVolume
    
    if (chatgptVolume === 0 && perplexityVolume === 0) return
    
    const ratio = chatgptVolume / (chatgptVolume + perplexityVolume)
    
    if (ratio > 0.7) {
      platformPreferences.chatgpt_preferred.push(keyword.keyword)
    } else if (ratio < 0.3) {
      platformPreferences.perplexity_preferred.push(keyword.keyword)
    } else {
      platformPreferences.balanced.push(keyword.keyword)
    }
  })

  return {
    aiTrends,
    opportunityRecommendations,
    platformPreferences
  }
}

export async function getAISearchVolumeForKeywords(
  keywords: string[],
  options?: {
    location_name?: string
    language_code?: string
  }
): Promise<ApiResult<AISearchVolumeData[]>> {
  const result = await analyzeAISearchVolume({
    keywords,
    ...options,
  })

  if (!result.success) {
    return result
  }

  return {
    success: true,
    data: result.data.keywords,
  }
}