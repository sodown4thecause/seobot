import { rankedKeywords } from '@/lib/api/dataforseo-service'
import type { ApiResult } from '@/lib/types/api-responses'

export interface RankedKeywordData {
  keyword: string
  position: number
  searchVolume: number
  search_volume: number // DataForSEO format
  difficulty: number
  cpc: number
  url: string
  traffic: number
  trafficCost: number
  competition: string
  competition_level: string // DataForSEO format
  serpFeatures: string[]
  ranked_serp_element?: {
    serp_item?: {
      rank_absolute?: number
    }
  }
}

export interface KeywordProfile {
  domain: string
  totalKeywords: number
  totalTraffic: number
  totalSearchVolume: number
  totalTrafficCost: number
  averagePosition: number
  topKeywords: RankedKeywordData[]
  keywordsByPosition: {
    top3: number
    top10: number
    top50: number
    beyond50: number
  }
  keywordsByVolume: {
    high: number    // >10k
    medium: number  // 1k-10k
    low: number     // <1k
  }
  competitiveStrength: {
    highCompetition: number
    mediumCompetition: number
    lowCompetition: number
  }
  opportunities: {
    highVolumeKeywords: RankedKeywordData[]
    lowCompetitionKeywords: RankedKeywordData[]
    improvementTargets: RankedKeywordData[]
  }
  competitorGaps: string[]
}

export interface CompetitorKeywordAnalysis {
  domain: string
  profile: KeywordProfile
  gapAnalysis: {
    uniqueKeywords: RankedKeywordData[]
    sharedKeywords: RankedKeywordData[]
    betterRankingOpportunities: RankedKeywordData[]
  }
}

export interface RankedKeywordsAnalysisParams {
  target: string
  location_name?: string
  language_code?: string
  limit?: number
  includeSubdomains?: boolean
}

export async function analyzeRankedKeywords(
  params: RankedKeywordsAnalysisParams
): Promise<ApiResult<KeywordProfile>> {
  try {
    const result = await rankedKeywords({
      target: params.target,
      location_name: params.location_name,
      language_code: params.language_code,
      limit: params.limit || 1000,
    })

    if (!result.success) {
      return result
    }

    const rawData = result.data?.tasks?.[0]?.result?.[0]?.items || []
    
    // Transform raw DataForSEO data into our structured format
    const keywords: RankedKeywordData[] = rawData.map((item: any) => ({
      keyword: item.keyword_data?.keyword || '',
      position: item.ranked_serp_element?.serp_item?.rank_group || 0,
      searchVolume: item.keyword_data?.keyword_info?.search_volume || 0,
      search_volume: item.keyword_data?.keyword_info?.search_volume || 0,
      difficulty: item.keyword_data?.keyword_info?.competition || 0,
      cpc: item.keyword_data?.keyword_info?.cpc || 0,
      url: item.ranked_serp_element?.serp_item?.url || '',
      traffic: item.impressions_info?.impressions || 0,
      trafficCost: item.impressions_info?.cost || 0,
      competition: item.keyword_data?.keyword_info?.competition_level || 'unknown',
      competition_level: item.keyword_data?.keyword_info?.competition_level || 'unknown',
      serpFeatures: item.ranked_serp_element?.serp_item?.serp_features || [],
      ranked_serp_element: item.ranked_serp_element,
    }))

    // Calculate profile metrics
    const totalKeywords = keywords.length
    const totalTraffic = keywords.reduce((sum, k) => sum + k.traffic, 0)
    const totalSearchVolume = keywords.reduce((sum, k) => sum + k.searchVolume, 0)
    const totalTrafficCost = keywords.reduce((sum, k) => sum + k.trafficCost, 0)
    const averagePosition = keywords.length > 0 
      ? keywords.reduce((sum, k) => sum + k.position, 0) / keywords.length 
      : 0

    // Top keywords by traffic
    const topKeywords = keywords
      .sort((a, b) => b.traffic - a.traffic)
      .slice(0, 20)

    // Position distribution
    const keywordsByPosition = {
      top3: keywords.filter(k => k.position <= 3).length,
      top10: keywords.filter(k => k.position <= 10).length,
      top50: keywords.filter(k => k.position <= 50).length,
      beyond50: keywords.filter(k => k.position > 50).length,
    }

    // Volume distribution
    const keywordsByVolume = {
      high: keywords.filter(k => k.searchVolume > 10000).length,
      medium: keywords.filter(k => k.searchVolume >= 1000 && k.searchVolume <= 10000).length,
      low: keywords.filter(k => k.searchVolume < 1000).length,
    }

    // Competition strength analysis
    const competitiveStrength = {
      highCompetition: keywords.filter(k => k.competition_level === 'HIGH').length,
      mediumCompetition: keywords.filter(k => k.competition_level === 'MEDIUM').length,
      lowCompetition: keywords.filter(k => k.competition_level === 'LOW').length,
    }

    // Identify opportunities
    const opportunities = {
      highVolumeKeywords: keywords
        .filter(k => k.searchVolume > 5000)
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, 10),
      lowCompetitionKeywords: keywords
        .filter(k => k.competition_level === 'LOW' && k.searchVolume > 100)
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, 10),
      improvementTargets: keywords
        .filter(k => k.position > 10 && k.position <= 50 && k.searchVolume > 500)
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, 10),
    }

    const profile: KeywordProfile = {
      domain: params.target,
      totalKeywords,
      totalTraffic,
      totalSearchVolume,
      totalTrafficCost,
      averagePosition,
      topKeywords,
      keywordsByPosition,
      keywordsByVolume,
      competitiveStrength,
      opportunities,
      competitorGaps: [], // Will be populated by competitor analysis
    }

    return {
      success: true,
      data: profile,
    }
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'RANKED_KEYWORDS_ANALYSIS_ERROR',
        message: error.message || 'Failed to analyze ranked keywords',
        statusCode: 500,
      },
    }
  }
}

export async function compareKeywordProfiles(
  targetDomain: string,
  competitorDomains: string[],
  params?: Omit<RankedKeywordsAnalysisParams, 'target'>
): Promise<ApiResult<{
  target: KeywordProfile
  competitors: CompetitorKeywordAnalysis[]
  insights: {
    keywordGaps: RankedKeywordData[]
    competitiveAdvantages: RankedKeywordData[]
    opportunityScore: number
  }
}>> {
  try {
    // Analyze target domain
    const targetResult = await analyzeRankedKeywords({
      target: targetDomain,
      ...params,
    })

    if (!targetResult.success) {
      return targetResult
    }

    // Analyze competitor domains
    const competitorResults = await Promise.all(
      competitorDomains.map(domain => 
        analyzeRankedKeywords({
          target: domain,
          ...params,
        })
      )
    )

    const competitorProfiles = competitorResults
      .filter(result => result.success)
      .map(result => result.data!)

    // Create competitor analysis with gap analysis
    const targetKeywords = new Set(targetResult.data!.topKeywords.map(k => k.keyword))
    
    const competitors: CompetitorKeywordAnalysis[] = competitorProfiles.map(profile => {
      const competitorKeywords = new Set(profile.topKeywords.map(k => k.keyword))
      
      // Find unique keywords (gaps)
      const uniqueKeywords = profile.topKeywords.filter(k => !targetKeywords.has(k.keyword))
      
      // Find shared keywords
      const sharedKeywords = profile.topKeywords.filter(k => targetKeywords.has(k.keyword))
      
      // Find better ranking opportunities (where competitor ranks better)
      const betterRankingOpportunities = sharedKeywords.filter(compKeyword => {
        const targetKeyword = targetResult.data!.topKeywords.find(tk => tk.keyword === compKeyword.keyword)
        return targetKeyword && compKeyword.position < targetKeyword.position
      })

      return {
        domain: profile.domain,
        profile,
        gapAnalysis: {
          uniqueKeywords: uniqueKeywords.slice(0, 20),
          sharedKeywords: sharedKeywords.slice(0, 20),
          betterRankingOpportunities: betterRankingOpportunities.slice(0, 20),
        }
      }
    })

    // Generate insights
    const allCompetitorKeywords = competitorProfiles.flatMap(comp => comp.topKeywords)
    const keywordGaps = allCompetitorKeywords
      .filter(k => !targetKeywords.has(k.keyword))
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 50)

    const competitiveAdvantages = targetResult.data!.topKeywords
      .filter(targetKeyword => {
        return !allCompetitorKeywords.some(compKeyword => 
          compKeyword.keyword === targetKeyword.keyword && compKeyword.position < targetKeyword.position
        )
      })
      .slice(0, 20)

    const opportunityScore = keywordGaps.reduce(
      (score, k) => score + (k.traffic * (k.searchVolume / 1000)), 
      0
    )

    return {
      success: true,
      data: {
        target: targetResult.data!,
        competitors,
        insights: {
          keywordGaps,
          competitiveAdvantages,
          opportunityScore,
        },
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'KEYWORD_PROFILE_COMPARISON_ERROR',
        message: error.message || 'Failed to compare keyword profiles',
        statusCode: 500,
      },
    }
  }
}