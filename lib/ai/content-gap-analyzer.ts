/**
 * Content Gap Analyzer
 * Analyzes content gaps between domains using page intersection and relevant pages
 */

import { dataforseo_labs_google_relevant_pagesToolWithClient } from '@/lib/mcp/dataforseo/dataforseo_labs_google_relevant_pages'
import { dataforseo_labs_google_page_intersectionToolWithClient } from '@/lib/mcp/dataforseo/dataforseo_labs_google_page_intersection'
import { getMcpClient } from '@/lib/mcp/dataforseo/client'

export interface ContentGap {
  keyword: string
  searchVolume: number
  difficulty?: number
  competitorRanking: number
  yourRanking?: number
  opportunity: 'high' | 'medium' | 'low'
  topic: string
  contentType: 'blog' | 'guide' | 'product' | 'landing' | 'other'
  estimatedTraffic: number
}

export interface TopicCluster {
  topic: string
  keywords: ContentGap[]
  totalVolume: number
  avgDifficulty: number
  opportunityScore: number
  contentSuggestions: string[]
}

export interface ContentGapAnalysis {
  yourDomain: string
  competitorDomains: string[]
  totalGaps: number
  highValueGaps: number
  quickWins: number
  gaps: ContentGap[]
  clusters: TopicCluster[]
  topOpportunities: ContentGap[]
  recommendations: string[]
}

export class ContentGapAnalyzer {
  private relevantPagesTool = dataforseo_labs_google_relevant_pagesToolWithClient(
    () => getMcpClient()
  )
  private pageIntersectionTool = dataforseo_labs_google_page_intersectionToolWithClient(
    () => getMcpClient()
  )

  /**
   * Analyze content gaps between your domain and competitors
   */
  async analyzeContentGaps(
    yourDomain: string,
    competitorDomains: string[],
    location: string = 'United States',
    language: string = 'en'
  ): Promise<ContentGapAnalysis> {
    try {
      // Get relevant pages for each domain
      const yourPages = await this.getRelevantPages(yourDomain, location, language)
      const competitorPages = await Promise.all(
        competitorDomains.map(domain =>
          this.getRelevantPages(domain, location, language)
        )
      )

      // Find page intersections
      const intersections = await this.findPageIntersections(
        competitorDomains,
        location,
        language
      )

      // Identify gaps
      const gaps = await this.identifyGaps(
        yourDomain,
        competitorDomains,
        yourPages,
        competitorPages,
        intersections,
        location,
        language
      )

      // Cluster gaps by topic
      const clusters = this.clusterGapsByTopic(gaps)

      // Generate recommendations
      const recommendations = this.generateRecommendations(gaps, clusters)

      return {
        yourDomain,
        competitorDomains,
        totalGaps: gaps.length,
        highValueGaps: gaps.filter(g => g.opportunity === 'high').length,
        quickWins: gaps.filter(g => g.opportunity === 'high' && (g.difficulty || 100) < 30).length,
        gaps,
        clusters,
        topOpportunities: gaps
          .filter(g => g.opportunity === 'high')
          .sort((a, b) => b.searchVolume - a.searchVolume)
          .slice(0, 20),
        recommendations,
      }
    } catch (error) {
      console.error('Failed to analyze content gaps:', error)
      throw error
    }
  }

  /**
   * Get relevant pages for a domain
   */
  private async getRelevantPages(
    domain: string,
    location: string,
    language: string
  ): Promise<Array<{ url: string; keyword: string; position: number; traffic: number }>> {
    try {
      if (!this.relevantPagesTool?.execute) return []
      const result = await this.relevantPagesTool.execute({
        target: domain,
        location_name: location,
        language_code: language,
        limit: 100,
        order_by: ['metrics.organic.etv,desc'],
        ignore_synonyms: false,
        exclude_top_domains: false,
        include_clickstream_data: false,
      }, {
        abortSignal: new AbortController().signal,
        toolCallId: 'content-gap-analyzer-relevant',
        messages: []
      })

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
        url: item.page || '',
        keyword: item.keyword || '',
        position: item.rank_absolute || item.rank_group || 0,
        traffic: item.metrics?.organic?.etv || 0,
      }))
    } catch (error) {
      console.error('Failed to get relevant pages:', error)
      return []
    }
  }

  /**
   * Find page intersections between competitors
   */
  private async findPageIntersections(
    domains: string[],
    location: string,
    language: string
  ): Promise<Array<{ keyword: string; domains: string[]; avgPosition: number }>> {
    try {
      if (domains.length < 2) {
        return []
      }

      if (!this.pageIntersectionTool?.execute) return []
      const result = await this.pageIntersectionTool.execute({
        pages: domains,
        location_name: location,
        language_code: language,
        limit: 100,
        ignore_synonyms: false,
        include_clickstream_data: false,
      }, {
        abortSignal: new AbortController().signal,
        toolCallId: 'content-gap-analyzer-intersection',
        messages: []
      })

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
        domains: item.domains || [],
        avgPosition: item.rank_group || 0,
      }))
    } catch (error) {
      console.error('Failed to find page intersections:', error)
      return []
    }
  }

  /**
   * Identify content gaps
   */
  private async identifyGaps(
    yourDomain: string,
    competitorDomains: string[],
    yourPages: Array<{ url: string; keyword: string; position: number; traffic: number }>,
    competitorPages: Array<Array<{ url: string; keyword: string; position: number; traffic: number }>>,
    intersections: Array<{ keyword: string; domains: string[]; avgPosition: number }>,
    location: string,
    language: string
  ): Promise<ContentGap[]> {
    const gaps: ContentGap[] = []
    const yourKeywords = new Set(yourPages.map(p => p.keyword.toLowerCase()))

    // Find keywords competitors rank for but you don't
    competitorPages.forEach((competitorPageList, competitorIndex) => {
      competitorPageList.forEach(page => {
        const keywordLower = page.keyword.toLowerCase()
        
        if (!yourKeywords.has(keywordLower) && page.position <= 20) {
          // This is a gap
          const intersection = intersections.find(i => 
            i.keyword.toLowerCase() === keywordLower
          )

          // Estimate search volume from traffic (rough estimate)
          const estimatedVolume = page.traffic > 0 ? Math.round(page.traffic / 0.1) : 0
          
          const opportunity = this.calculateOpportunity(
            estimatedVolume,
            page.position,
            intersection?.domains.length || 1
          )

          gaps.push({
            keyword: page.keyword,
            searchVolume: estimatedVolume,
            difficulty: undefined, // Would need separate API call
            competitorRanking: page.position,
            opportunity,
            topic: this.extractTopic(page.keyword),
            contentType: this.inferContentType(page.keyword, page.url),
            estimatedTraffic: page.traffic,
          })
        }
      })
    })

    // Also check intersections for keywords multiple competitors rank for
    intersections.forEach(intersection => {
      if (
        intersection.domains.length >= 2 &&
        !yourKeywords.has(intersection.keyword.toLowerCase()) &&
        intersection.avgPosition <= 20
      ) {
        // Multiple competitors rank for this, but you don't
        gaps.push({
          keyword: intersection.keyword,
          searchVolume: 0, // Would need to fetch
          competitorRanking: intersection.avgPosition,
          opportunity: 'high', // Multiple competitors = high opportunity
          topic: this.extractTopic(intersection.keyword),
          contentType: 'other',
          estimatedTraffic: this.estimateTraffic(intersection.avgPosition, 0),
        })
      }
    })

    // Remove duplicates
    const uniqueGaps = new Map<string, ContentGap>()
    gaps.forEach(gap => {
      const key = gap.keyword.toLowerCase()
      if (!uniqueGaps.has(key) || (uniqueGaps.get(key)?.opportunity || 'low') === 'low') {
        uniqueGaps.set(key, gap)
      }
    })

    return Array.from(uniqueGaps.values())
  }

  /**
   * Cluster gaps by topic
   */
  private clusterGapsByTopic(gaps: ContentGap[]): TopicCluster[] {
    const topicMap = new Map<string, ContentGap[]>()

    gaps.forEach(gap => {
      if (!topicMap.has(gap.topic)) {
        topicMap.set(gap.topic, [])
      }
      topicMap.get(gap.topic)!.push(gap)
    })

    return Array.from(topicMap.entries()).map(([topic, keywords]) => {
      const totalVolume = keywords.reduce((sum, k) => sum + k.searchVolume, 0)
      const avgDifficulty = keywords.reduce((sum, k) => sum + (k.difficulty || 50), 0) / keywords.length
      const opportunityScore = this.calculateClusterOpportunity(keywords)

      return {
        topic,
        keywords,
        totalVolume,
        avgDifficulty,
        opportunityScore,
        contentSuggestions: this.generateContentSuggestions(topic, keywords),
      }
    }).sort((a, b) => b.opportunityScore - a.opportunityScore)
  }

  /**
   * Calculate opportunity level
   */
  private calculateOpportunity(
    searchVolume: number,
    position: number,
    competitorCount: number
  ): 'high' | 'medium' | 'low' {
    // High: good volume + good position + multiple competitors
    if (searchVolume > 1000 && position <= 10 && competitorCount >= 2) {
      return 'high'
    }

    // Medium: decent volume or good position
    if ((searchVolume > 500 && searchVolume <= 1000) || (position > 10 && position <= 20)) {
      return 'medium'
    }

    return 'low'
  }

  /**
   * Extract topic from keyword
   */
  private extractTopic(keyword: string): string {
    // Simple topic extraction - could be enhanced with NLP
    const words = keyword.toLowerCase().split(' ')
    
    // Remove common words
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'why', 'when', 'where', 'best', 'top', 'guide', 'review']
    const meaningfulWords = words.filter(w => !stopWords.includes(w) && w.length > 3)
    
    return meaningfulWords.slice(0, 2).join(' ') || keyword.split(' ')[0]
  }

  /**
   * Infer content type from keyword and URL
   */
  private inferContentType(keyword: string, url: string): ContentGap['contentType'] {
    const lowerKeyword = keyword.toLowerCase()
    const lowerUrl = url.toLowerCase()

    if (lowerKeyword.includes('how to') || lowerKeyword.includes('guide') || lowerUrl.includes('/guide')) {
      return 'guide'
    }
    if (lowerKeyword.includes('best') || lowerKeyword.includes('review') || lowerUrl.includes('/review')) {
      return 'blog'
    }
    if (lowerUrl.includes('/product') || lowerUrl.includes('/shop')) {
      return 'product'
    }
    if (lowerUrl.includes('/landing') || lowerUrl.includes('/page')) {
      return 'landing'
    }

    return 'blog'
  }

  /**
   * Estimate traffic from position
   */
  private estimateTraffic(position: number, searchVolume: number): number {
    if (searchVolume === 0) return 0

    const ctrByPosition: Record<number, number> = {
      1: 0.316,
      2: 0.243,
      3: 0.186,
      4: 0.141,
      5: 0.108,
      6: 0.083,
      7: 0.064,
      8: 0.049,
      9: 0.038,
      10: 0.029,
    }

    if (position <= 10) {
      const ctr = ctrByPosition[position] || 0.02
      return Math.round(searchVolume * ctr)
    } else if (position <= 20) {
      return Math.round(searchVolume * 0.015)
    } else {
      return Math.round(searchVolume * 0.005)
    }
  }

  /**
   * Calculate cluster opportunity score
   */
  private calculateClusterOpportunity(keywords: ContentGap[]): number {
    const highValueCount = keywords.filter(k => k.opportunity === 'high').length
    const totalVolume = keywords.reduce((sum, k) => sum + k.searchVolume, 0)
    const avgPosition = keywords.reduce((sum, k) => sum + k.competitorRanking, 0) / keywords.length

    return (highValueCount * 30) + (totalVolume / 100) + ((21 - avgPosition) * 2)
  }

  /**
   * Generate content suggestions for a topic cluster
   */
  private generateContentSuggestions(topic: string, keywords: ContentGap[]): string[] {
    const suggestions: string[] = []

    // Pillar content suggestion
    suggestions.push(`Create a comprehensive "${topic}" pillar page covering all aspects`)

    // Specific content ideas based on keywords
    const topKeywords = keywords.slice(0, 3)
    topKeywords.forEach(keyword => {
      suggestions.push(`Write "${keyword.keyword}" ${keyword.contentType} targeting ${keyword.searchVolume} monthly searches`)
    })

    // Comparison content
    if (keywords.length >= 3) {
      suggestions.push(`Create comparison content: "${keywords[0].keyword} vs ${keywords[1].keyword}"`)
    }

    return suggestions
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(gaps: ContentGap[], clusters: TopicCluster[]): string[] {
    const recommendations: string[] = []

    // Top priority
    const highValueGaps = gaps.filter(g => g.opportunity === 'high')
    if (highValueGaps.length > 0) {
      const totalVolume = highValueGaps.reduce((sum, g) => sum + g.searchVolume, 0)
      recommendations.push(
        `Prioritize ${highValueGaps.length} high-opportunity keywords with ${totalVolume > 0 ? totalVolume.toLocaleString() : 'significant'} total monthly search volume`
      )
    }

    // Topic clusters
    const topClusters = clusters.slice(0, 3)
    topClusters.forEach(cluster => {
      recommendations.push(
        `Focus on "${cluster.topic}" topic cluster: ${cluster.keywords.length} keyword opportunities, ${cluster.totalVolume.toLocaleString()} total volume`
      )
    })

    // Quick wins
    const quickWins = gaps.filter(g => g.opportunity === 'high' && (g.difficulty || 100) < 30)
    if (quickWins.length > 0) {
      recommendations.push(
        `Target ${quickWins.length} quick-win keywords with low difficulty and high opportunity`
      )
    }

    return recommendations
  }
}

export const contentGapAnalyzer = new ContentGapAnalyzer()
