/**
 * AI Search Optimizer
 * Analyzes AI search volume (ChatGPT, Perplexity) and calculates AI opportunity scores
 */

import { ai_optimization_keyword_data_search_volumeToolWithClient } from '@/lib/mcp/dataforseo/ai_optimization_keyword_data_search_volume'
import { getMcpClient } from '@/lib/mcp/dataforseo/client'

export interface AISearchVolume {
  keyword: string
  chatgptVolume: number
  perplexityVolume: number
  traditionalVolume: number
  aiTotalVolume: number
  aiOpportunityScore: number
  aiVsTraditionalRatio: number
  recommendation: string
}

export interface AISearchAnalysis {
  keywords: AISearchVolume[]
  summary: {
    totalAIVolume: number
    totalTraditionalVolume: number
    avgOpportunityScore: number
    highOpportunityCount: number
    aiVsTraditionalRatio: number
  }
  topOpportunities: AISearchVolume[]
  recommendations: string[]
}

export class AISearchOptimizer {
  private aiSearchVolumeTool = ai_optimization_keyword_data_search_volumeToolWithClient(
    () => getMcpClient()
  )

  /**
   * Analyze AI search volumes for keywords
   */
  async analyzeAISearchVolume(
    keywords: string[],
    location: string = 'United States',
    language: string = 'en',
    traditionalVolumes?: Record<string, number>,
    abortSignal?: AbortSignal
  ): Promise<AISearchAnalysis> {
    try {
      // Fetch AI search volume data
      const aiVolumes = await this.fetchAISearchVolumes(keywords, location, language, abortSignal)

      // Combine with traditional volumes if provided
      const combined = aiVolumes.map(ai => {
        const traditionalVolume = traditionalVolumes?.[ai.keyword] || 0
        const aiTotalVolume = ai.chatgptVolume + ai.perplexityVolume
        const aiVsTraditionalRatio = traditionalVolume > 0 
          ? aiTotalVolume / traditionalVolume 
          : aiTotalVolume > 0 ? 10 : 0 // If no traditional data but AI volume exists, assume high ratio

        const aiOpportunityScore = this.calculateAIOpportunityScore(
          aiTotalVolume,
          traditionalVolume,
          aiVsTraditionalRatio
        )

        return {
          keyword: ai.keyword,
          chatgptVolume: ai.chatgptVolume,
          perplexityVolume: ai.perplexityVolume,
          traditionalVolume,
          aiTotalVolume,
          aiOpportunityScore,
          aiVsTraditionalRatio,
          recommendation: this.generateRecommendation(aiOpportunityScore, aiVsTraditionalRatio, aiTotalVolume),
        }
      })

      // Calculate summary
      const totalAIVolume = combined.reduce((sum, k) => sum + k.aiTotalVolume, 0)
      const totalTraditionalVolume = combined.reduce((sum, k) => sum + k.traditionalVolume, 0)
      const avgOpportunityScore = combined.reduce((sum, k) => sum + k.aiOpportunityScore, 0) / combined.length
      const highOpportunityCount = combined.filter(k => k.aiOpportunityScore >= 70).length
      const overallRatio = totalTraditionalVolume > 0 
        ? totalAIVolume / totalTraditionalVolume 
        : totalAIVolume > 0 ? 10 : 0

      // Get top opportunities
      const topOpportunities = combined
        .sort((a, b) => b.aiOpportunityScore - a.aiOpportunityScore)
        .slice(0, 10)

      // Generate recommendations
      const recommendations = this.generateOverallRecommendations(
        combined,
        avgOpportunityScore,
        highOpportunityCount,
        overallRatio
      )

      return {
        keywords: combined,
        summary: {
          totalAIVolume,
          totalTraditionalVolume,
          avgOpportunityScore,
          highOpportunityCount,
          aiVsTraditionalRatio: overallRatio,
        },
        topOpportunities,
        recommendations,
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }
      console.error('Failed to analyze AI search volume:', error)
      throw error
    }
  }

  /**
   * Fetch AI search volume data from DataForSEO
   */
  private async fetchAISearchVolumes(
    keywords: string[],
    location: string,
    language: string,
    abortSignal?: AbortSignal
  ): Promise<Array<{ keyword: string; chatgptVolume: number; perplexityVolume: number }>> {
    try {
      if (!this.aiSearchVolumeTool?.execute) {
        return keywords.map(k => ({ keyword: k, chatgptVolume: 0, perplexityVolume: 0 }))
      }

      if (abortSignal?.aborted) {
        const error = new Error('AI search volume fetch aborted')
        error.name = 'AbortError'
        throw error
      }

      const result = await this.aiSearchVolumeTool.execute({
        keywords,
        location_name: location,
        language_code: language,
      }, {
        abortSignal: abortSignal ?? new AbortController().signal,
        toolCallId: 'ai-search-optimizer',
        messages: []
      })

      // Parse the result
      const data = typeof result === 'string' ? JSON.parse(result) : result

      if (!data || !data.tasks || data.tasks.length === 0) {
        return keywords.map(k => ({ keyword: k, chatgptVolume: 0, perplexityVolume: 0 }))
      }

      const taskData = data.tasks[0]
      if (!taskData.result || taskData.result.length === 0) {
        return keywords.map(k => ({ keyword: k, chatgptVolume: 0, perplexityVolume: 0 }))
      }

      const items = taskData.result[0].items || []

      return items.map((item: any) => ({
        keyword: item.keyword || '',
        chatgptVolume: item.chatgpt_search_volume || item.chatgpt || 0,
        perplexityVolume: item.perplexity_search_volume || item.perplexity || 0,
      }))
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }

      if (abortSignal?.aborted) {
        const abortError = new Error('AI search volume fetch aborted')
        abortError.name = 'AbortError'
        throw abortError
      }

      console.error('Failed to fetch AI search volumes:', error)
      return keywords.map(k => ({ keyword: k, chatgptVolume: 0, perplexityVolume: 0 }))
    }
  }

  /**
   * Calculate AI opportunity score
   * Formula: (aiVolume/traditionalVolume * 0.4) + (1 - currentAIVisibility) * 0.3 + contentQualityFit * 0.3
   */
  private calculateAIOpportunityScore(
    aiTotalVolume: number,
    traditionalVolume: number,
    aiVsTraditionalRatio: number
  ): number {
    // Component 1: AI vs Traditional ratio (40%)
    const ratioScore = Math.min(aiVsTraditionalRatio * 10, 40) // Cap at 40

    // Component 2: AI volume magnitude (30%)
    // Higher AI volume = higher score
    const volumeScore = Math.min((aiTotalVolume / 1000) * 30, 30) // Normalize to 0-30

    // Component 3: Opportunity indicator (30%)
    // If AI volume is significant relative to traditional, or if traditional is low but AI is high
    let opportunityScore = 0
    if (aiVsTraditionalRatio > 1) {
      // AI volume exceeds traditional - high opportunity
      opportunityScore = 30
    } else if (aiTotalVolume > 500 && traditionalVolume < 1000) {
      // High AI volume with low traditional competition
      opportunityScore = 25
    } else if (aiTotalVolume > 0) {
      // Some AI volume exists
      opportunityScore = 15
    }

    return Math.round(ratioScore + volumeScore + opportunityScore)
  }

  /**
   * Generate recommendation for a keyword
   */
  private generateRecommendation(
    opportunityScore: number,
    aiVsTraditionalRatio: number,
    aiTotalVolume: number
  ): string {
    if (opportunityScore >= 70) {
      return `High AI opportunity: ${aiTotalVolume.toLocaleString()} AI searches/month. Prioritize AEO optimization for this keyword.`
    } else if (opportunityScore >= 50) {
      return `Medium AI opportunity: ${aiTotalVolume.toLocaleString()} AI searches/month. Consider AEO optimization alongside traditional SEO.`
    } else if (aiTotalVolume > 0) {
      return `Low AI opportunity: ${aiTotalVolume.toLocaleString()} AI searches/month. Monitor AI search trends.`
    } else {
      return 'No significant AI search volume detected. Focus on traditional SEO.'
    }
  }

  /**
   * Generate overall recommendations
   */
  private generateOverallRecommendations(
    keywords: AISearchVolume[],
    avgOpportunityScore: number,
    highOpportunityCount: number,
    overallRatio: number
  ): string[] {
    const recommendations: string[] = []

    if (avgOpportunityScore >= 60) {
      recommendations.push(
        `Strong AI search opportunity detected. Average opportunity score: ${avgOpportunityScore.toFixed(1)}/100. Consider prioritizing AEO (AI Engine Optimization) strategies.`
      )
    }

    if (highOpportunityCount > 0) {
      recommendations.push(
        `${highOpportunityCount} keywords show high AI opportunity (score ≥70). Prioritize these for AEO optimization to capture AI search traffic.`
      )
    }

    if (overallRatio > 1) {
      recommendations.push(
        `AI search volume exceeds traditional search volume (${overallRatio.toFixed(2)}x ratio). This indicates a strong opportunity for AI-first content strategy.`
      )
    } else if (overallRatio > 0.5) {
      recommendations.push(
        `Significant AI search volume detected (${overallRatio.toFixed(2)}x of traditional). Consider hybrid SEO/AEO approach.`
      )
    }

    // Content recommendations
    const topAIKeywords = keywords
      .filter(k => k.aiTotalVolume > 0)
      .sort((a, b) => b.aiTotalVolume - a.aiTotalVolume)
      .slice(0, 5)

    if (topAIKeywords.length > 0) {
      recommendations.push(
        `Top AI search keywords: ${topAIKeywords.map(k => k.keyword).join(', ')}. Optimize content for AI citation and featured snippets.`
      )
    }

    return recommendations
  }

  /**
   * Compare traditional vs AI search volumes
   */
  compareTraditionalVsAI(
    traditionalVolumes: Record<string, number>,
    aiVolumes: AISearchVolume[]
  ): Array<{
    keyword: string
    traditionalVolume: number
    aiVolume: number
    difference: number
    percentage: number
  }> {
    return aiVolumes.map(ai => {
      const traditional = traditionalVolumes[ai.keyword] || 0
      const difference = ai.aiTotalVolume - traditional
      const percentage = traditional > 0 
        ? ((difference / traditional) * 100)
        : ai.aiTotalVolume > 0 ? 100 : 0

      return {
        keyword: ai.keyword,
        traditionalVolume: traditional,
        aiVolume: ai.aiTotalVolume,
        difference,
        percentage,
      }
    })
  }
}

export const aiSearchOptimizer = new AISearchOptimizer()
