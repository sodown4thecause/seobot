/**
 * Domain Keyword Profiler
 * Analyzes all keywords a domain ranks for to build comprehensive keyword profile
 */

import { dataforseo_labs_google_ranked_keywordsToolWithClient } from '@/lib/mcp/dataforseo/dataforseo_labs_google_ranked_keywords'
import { getMcpClient } from '@/lib/mcp/dataforseo/client'

export interface KeywordProfile {
  keyword: string
  position: number
  searchVolume: number
  cpc?: number
  competition?: number
  estimatedTraffic?: number
  serpFeatures?: string[]
  intent?: 'informational' | 'navigational' | 'transactional' | 'commercial'
}

export interface DomainKeywordProfile {
  domain: string
  totalKeywords: number
  keywords: KeywordProfile[]
  positionDistribution: {
    top3: number
    top10: number
    top20: number
    top50: number
    top100: number
  }
  trafficEstimation: {
    total: number
    top10: number
    top20: number
    top50: number
  }
  topKeywords: KeywordProfile[]
  keywordGaps: KeywordGap[]
  categoryBreakdown: Record<string, number>
}

export interface KeywordGap {
  keyword: string
  competitorRanking: number
  yourRanking?: number
  searchVolume: number
  opportunity: 'high' | 'medium' | 'low'
  reason: string
}

export class DomainKeywordProfiler {
  private rankedKeywordsTool = dataforseo_labs_google_ranked_keywordsToolWithClient(
    () => getMcpClient()
  )

  /**
   * Build comprehensive keyword profile for a domain
   */
  async profileDomain(
    domain: string,
    location: string = 'United States',
    language: string = 'en',
    limit: number = 1000
  ): Promise<DomainKeywordProfile> {
    try {
      // Fetch ranked keywords
      const keywords = await this.fetchRankedKeywords(domain, location, language, limit)

      // Analyze position distribution
      const positionDistribution = this.calculatePositionDistribution(keywords)

      // Estimate traffic
      const trafficEstimation = this.estimateTraffic(keywords)

      // Identify top keywords
      const topKeywords = this.getTopKeywords(keywords, 20)

      // Categorize keywords
      const categoryBreakdown = this.categorizeKeywords(keywords)

      return {
        domain,
        totalKeywords: keywords.length,
        keywords,
        positionDistribution,
        trafficEstimation,
        topKeywords,
        keywordGaps: [], // Will be populated when comparing with competitors
        categoryBreakdown,
      }
    } catch (error) {
      console.error('Failed to profile domain keywords:', error)
      throw error
    }
  }

  /**
   * Compare domains to identify keyword gaps
   */
  async identifyKeywordGaps(
    yourDomain: string,
    competitorDomains: string[],
    location: string = 'United States',
    language: string = 'en'
  ): Promise<KeywordGap[]> {
    try {
      // Get your domain profile
      const yourProfile = await this.profileDomain(yourDomain, location, language, 500)

      // Get competitor profiles
      const competitorProfiles = await Promise.all(
        competitorDomains.map(domain =>
          this.profileDomain(domain, location, language, 500)
        )
      )

      // Find keywords competitors rank for but you don't
      const gaps: KeywordGap[] = []

      competitorProfiles.forEach(competitorProfile => {
        competitorProfile.keywords.forEach(competitorKeyword => {
          // Check if you rank for this keyword
          const yourKeyword = yourProfile.keywords.find(
            k => k.keyword.toLowerCase() === competitorKeyword.keyword.toLowerCase()
          )

          if (!yourKeyword || (yourKeyword.position > 50 && competitorKeyword.position <= 20)) {
            // This is a gap - competitor ranks well, you don't
            const opportunity = this.calculateOpportunity(competitorKeyword)

            gaps.push({
              keyword: competitorKeyword.keyword,
              competitorRanking: competitorKeyword.position,
              yourRanking: yourKeyword?.position,
              searchVolume: competitorKeyword.searchVolume,
              opportunity,
              reason: this.generateGapReason(competitorKeyword, yourKeyword),
            })
          }
        })
      })

      // Sort by opportunity and search volume
      return gaps
        .sort((a, b) => {
          const opportunityOrder = { high: 3, medium: 2, low: 1 }
          if (opportunityOrder[a.opportunity] !== opportunityOrder[b.opportunity]) {
            return opportunityOrder[b.opportunity] - opportunityOrder[a.opportunity]
          }
          return b.searchVolume - a.searchVolume
        })
        .slice(0, 50) // Top 50 gaps
    } catch (error) {
      console.error('Failed to identify keyword gaps:', error)
      return []
    }
  }

  /**
   * Fetch ranked keywords from DataForSEO
   */
  private async fetchRankedKeywords(
    domain: string,
    location: string,
    language: string,
    limit: number
  ): Promise<KeywordProfile[]> {
    try {
      if (!this.rankedKeywordsTool?.execute) return []
      const result = await this.rankedKeywordsTool.execute({
        target: domain,
        location_name: location,
        language_code: language,
        limit,
        order_by: ['metrics.organic.count,desc'],
        include_clickstream_data: false,
      }, {
        abortSignal: new AbortController().signal,
        toolCallId: 'domain-keyword-profiler',
        messages: []
      })

      // Parse the result
      const data = typeof result === 'string' ? JSON.parse(result) : result

      if (!data || !data.tasks || data.tasks.length === 0) {
        return []
      }

      const taskData = data.tasks[0]
      if (!taskData.result || taskData.result.length === 0) {
        return []
      }

      const items = taskData.result[0].items || []

      return items.map((item: any) => ({
        keyword: item.keyword || '',
        position: item.rank_absolute || item.rank_group || 0,
        searchVolume: item.search_volume || 0,
        cpc: item.cpc,
        competition: item.competition,
        estimatedTraffic: this.estimateKeywordTraffic(
          item.rank_absolute || item.rank_group,
          item.search_volume || 0
        ),
        serpFeatures: item.serp_features || [],
        intent: this.inferIntent(item.keyword || ''),
      }))
    } catch (error) {
      console.error('Failed to fetch ranked keywords:', error)
      return []
    }
  }

  /**
   * Calculate position distribution
   */
  private calculatePositionDistribution(keywords: KeywordProfile[]): DomainKeywordProfile['positionDistribution'] {
    return {
      top3: keywords.filter(k => k.position >= 1 && k.position <= 3).length,
      top10: keywords.filter(k => k.position >= 1 && k.position <= 10).length,
      top20: keywords.filter(k => k.position >= 1 && k.position <= 20).length,
      top50: keywords.filter(k => k.position >= 1 && k.position <= 50).length,
      top100: keywords.filter(k => k.position >= 1 && k.position <= 100).length,
    }
  }

  /**
   * Estimate traffic from keywords
   */
  private estimateTraffic(keywords: KeywordProfile[]): DomainKeywordProfile['trafficEstimation'] {
    const total = keywords.reduce((sum, k) => sum + (k.estimatedTraffic || 0), 0)
    const top10 = keywords
      .filter(k => k.position >= 1 && k.position <= 10)
      .reduce((sum, k) => sum + (k.estimatedTraffic || 0), 0)
    const top20 = keywords
      .filter(k => k.position >= 1 && k.position <= 20)
      .reduce((sum, k) => sum + (k.estimatedTraffic || 0), 0)
    const top50 = keywords
      .filter(k => k.position >= 1 && k.position <= 50)
      .reduce((sum, k) => sum + (k.estimatedTraffic || 0), 0)

    return {
      total: Math.round(total),
      top10: Math.round(top10),
      top20: Math.round(top20),
      top50: Math.round(top50),
    }
  }

  /**
   * Estimate traffic for a single keyword based on position
   */
  private estimateKeywordTraffic(position: number, searchVolume: number): number {
    // CTR estimates based on position (approximate)
    const ctrByPosition: Record<number, number> = {
      1: 0.316, // 31.6%
      2: 0.243, // 24.3%
      3: 0.186, // 18.6%
      4: 0.141, // 14.1%
      5: 0.108, // 10.8%
      6: 0.083, // 8.3%
      7: 0.064, // 6.4%
      8: 0.049, // 4.9%
      9: 0.038, // 3.8%
      10: 0.029, // 2.9%
    }

    if (position <= 10) {
      const ctr = ctrByPosition[position] || 0.02
      return Math.round(searchVolume * ctr)
    } else if (position <= 20) {
      return Math.round(searchVolume * 0.015) // ~1.5% CTR
    } else if (position <= 50) {
      return Math.round(searchVolume * 0.005) // ~0.5% CTR
    } else {
      return Math.round(searchVolume * 0.001) // ~0.1% CTR
    }
  }

  /**
   * Get top keywords by traffic potential
   */
  private getTopKeywords(keywords: KeywordProfile[], count: number): KeywordProfile[] {
    return [...keywords]
      .sort((a, b) => (b.estimatedTraffic || 0) - (a.estimatedTraffic || 0))
      .slice(0, count)
  }

  /**
   * Categorize keywords by intent/type
   */
  private categorizeKeywords(keywords: KeywordProfile[]): Record<string, number> {
    const categories: Record<string, number> = {
      informational: 0,
      transactional: 0,
      navigational: 0,
      commercial: 0,
    }

    keywords.forEach(keyword => {
      const intent = keyword.intent || 'informational'
      categories[intent] = (categories[intent] || 0) + 1
    })

    return categories
  }

  /**
   * Infer search intent from keyword
   */
  private inferIntent(keyword: string): KeywordProfile['intent'] {
    const lowerKeyword = keyword.toLowerCase()

    // Transactional indicators
    if (
      lowerKeyword.includes('buy') ||
      lowerKeyword.includes('purchase') ||
      lowerKeyword.includes('order') ||
      lowerKeyword.includes('price') ||
      lowerKeyword.includes('cost') ||
      lowerKeyword.includes('cheap') ||
      lowerKeyword.includes('discount')
    ) {
      return 'transactional'
    }

    // Commercial indicators
    if (
      lowerKeyword.includes('best') ||
      lowerKeyword.includes('top') ||
      lowerKeyword.includes('review') ||
      lowerKeyword.includes('compare') ||
      lowerKeyword.includes('vs') ||
      lowerKeyword.includes('alternative')
    ) {
      return 'commercial'
    }

    // Navigational indicators
    if (
      lowerKeyword.includes('login') ||
      lowerKeyword.includes('sign in') ||
      lowerKeyword.includes('official') ||
      lowerKeyword.includes('website')
    ) {
      return 'navigational'
    }

    // Default to informational
    return 'informational'
  }

  /**
   * Calculate opportunity level for a keyword gap
   */
  private calculateOpportunity(keyword: KeywordProfile): 'high' | 'medium' | 'low' {
    const volume = keyword.searchVolume
    const position = keyword.position

    // High opportunity: good volume + competitor ranks well
    if (volume > 1000 && position <= 10) {
      return 'high'
    }

    // Medium opportunity: decent volume or good position
    if ((volume > 500 && volume <= 1000) || (position > 10 && position <= 20)) {
      return 'medium'
    }

    return 'low'
  }

  /**
   * Generate reason for keyword gap
   */
  private generateGapReason(
    competitorKeyword: KeywordProfile,
    yourKeyword?: KeywordProfile
  ): string {
    if (!yourKeyword) {
      return `Competitor ranks #${competitorKeyword.position} for "${competitorKeyword.keyword}" (${competitorKeyword.searchVolume} monthly searches), but you don't rank in top 100.`
    }

    return `Competitor ranks #${competitorKeyword.position} for "${competitorKeyword.keyword}" (${competitorKeyword.searchVolume} monthly searches), but you rank #${yourKeyword.position}. Opportunity to improve ranking.`
  }
}

export const domainKeywordProfiler = new DomainKeywordProfiler()
