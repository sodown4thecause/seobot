/**
 * DataForSEO Content Analysis Scoring Agent
 * Analyzes content using DataForSEO API and normalizes scores
 */

import { mcpDataforseoTools } from '@/lib/mcp/dataforseo/index'

export interface DataForSEOScoringParams {
  content: string
  targetKeyword: string
  language?: string
  contentUrl?: string // Optional URL for on-page analysis
  userId?: string // For usage logging
}

export interface DataForSEOScoringResult {
  dataforseoRaw: any
  dataforseoQualityScore: number // 0-100 normalized score
  metrics: {
    readability?: number
    sentiment?: number
    keywordCoverage?: number
    citationQuality?: number
    technicalQuality?: number // Lighthouse score if URL provided
    contentStructure?: {
      headings?: number
      links?: number
      images?: number
    }
  }
}

export class DataForSEOScoringAgent {
  /**
   * Analyze content using DataForSEO content analysis API
   */
  async analyzeContent(params: DataForSEOScoringParams): Promise<DataForSEOScoringResult> {
    console.log('[DataForSEO Scoring] Analyzing content for keyword:', params.targetKeyword)

    try {
      // Step 1: Get detailed citation data using content_analysis_search
      let citationData: any = {}
      try {
        const { withMCPLogging } = await import('@/lib/analytics/mcp-logger');
        const searchResult = await withMCPLogging(
          {
            userId: params.userId,
            provider: 'dataforseo',
            endpoint: 'content_analysis_search',
            agentType: 'dataforseo_scoring',
          },
          () => mcpDataforseoTools.content_analysis_search.execute({
            keyword: params.targetKeyword,
            limit: 10,
            page_type: ['blogs', 'news'],
          })
        )
        
        const searchParsed = typeof searchResult === 'string' ? JSON.parse(searchResult) : searchResult
        if (searchParsed && searchParsed.tasks && searchParsed.tasks[0]?.result) {
          citationData = searchParsed.tasks[0].result[0]
          console.log('[DataForSEO Scoring] Citation data retrieved')
        }
      } catch (error) {
        console.warn('[DataForSEO Scoring] Content analysis search failed, using summary:', error)
      }

      // Step 2: Fallback to summary if search didn't work
      if (!citationData || Object.keys(citationData).length === 0) {
        const { withMCPLogging } = await import('@/lib/analytics/mcp-logger');
        const summaryResult = await withMCPLogging(
          {
            userId: params.userId,
            provider: 'dataforseo',
            endpoint: 'content_analysis_summary',
            agentType: 'dataforseo_scoring',
          },
          () => mcpDataforseoTools.content_analysis_summary.execute({
            keyword: params.targetKeyword,
            internal_list_limit: 5,
          })
        )
        
        try {
          citationData = typeof summaryResult === 'string' ? JSON.parse(summaryResult) : summaryResult
        } catch {
          citationData = { raw: summaryResult }
        }
      }

      // Step 3: Analyze content structure if URL is provided
      let contentStructure: DataForSEOScoringResult['metrics']['contentStructure'] | undefined
      let technicalQuality: number | undefined
      
      if (params.contentUrl) {
        try {
          const { withMCPLogging } = await import('@/lib/analytics/mcp-logger');
          const parseResult = await withMCPLogging(
            {
              userId: params.userId,
              provider: 'dataforseo',
              endpoint: 'on_page_content_parsing',
              agentType: 'dataforseo_scoring',
            },
            () => mcpDataforseoTools.on_page_content_parsing.execute({
              url: params.contentUrl!,
              enable_javascript: true,
            })
          )
          
          const parseParsed = typeof parseResult === 'string' ? JSON.parse(parseResult) : parseResult
          if (parseParsed && parseParsed.tasks && parseParsed.tasks[0]?.result) {
            const pageData = parseParsed.tasks[0].result[0]
            contentStructure = {
              headings: pageData.headings?.length || 0,
              links: pageData.links?.length || 0,
              images: pageData.images?.length || 0,
            }
            console.log('[DataForSEO Scoring] Content structure analyzed:', contentStructure)
          }

          // Get Lighthouse score for technical quality
          try {
            const { withMCPLogging } = await import('@/lib/analytics/mcp-logger');
            const lighthouseResult = await withMCPLogging(
              {
                userId: params.userId,
                provider: 'dataforseo',
                endpoint: 'on_page_lighthouse',
                agentType: 'dataforseo_scoring',
              },
              () => mcpDataforseoTools.on_page_lighthouse.execute({
                url: params.contentUrl!,
                enable_javascript: true,
              })
            )
            
            const lighthouseParsed = typeof lighthouseResult === 'string' ? JSON.parse(lighthouseResult) : lighthouseResult
            if (lighthouseParsed && lighthouseParsed.tasks && lighthouseParsed.tasks[0]?.result) {
              const scores = lighthouseParsed.tasks[0].result[0]?.items?.[0]?.lighthouse_result
              if (scores) {
                // Average SEO, Performance, Accessibility, Best Practices scores
                const seoScore = scores.categories?.seo?.score || 0
                const perfScore = scores.categories?.performance?.score || 0
                const a11yScore = scores.categories?.accessibility?.score || 0
                const bpScore = scores.categories?.['best-practices']?.score || 0
                technicalQuality = Math.round(((seoScore + perfScore + a11yScore + bpScore) / 4) * 100)
                console.log('[DataForSEO Scoring] Lighthouse score:', technicalQuality)
              }
            }
          } catch (error) {
            console.warn('[DataForSEO Scoring] Lighthouse analysis failed:', error)
          }
        } catch (error) {
          console.warn('[DataForSEO Scoring] Content parsing failed:', error)
        }
      }

      // Step 4: Normalize to a quality score (0-100)
      const qualityScore = this.normalizeToQualityScore(
        citationData, 
        params.content,
        contentStructure,
        technicalQuality
      )

      console.log('[DataForSEO Scoring] ✓ Analysis complete, score:', qualityScore)

      return {
        dataforseoRaw: citationData,
        dataforseoQualityScore: qualityScore,
        metrics: {
          keywordCoverage: this.extractKeywordCoverage(citationData),
          citationQuality: this.extractCitationQuality(citationData),
          technicalQuality,
          contentStructure,
        },
      }
    } catch (error) {
      console.error('[DataForSEO Scoring] Error analyzing content:', error)
      
      // Return default scores on error
      return {
        dataforseoRaw: { error: error instanceof Error ? error.message : 'Unknown error' },
        dataforseoQualityScore: 50, // Default middle score
        metrics: {},
      }
    }
  }

  /**
   * Normalize DataForSEO response to a 0-100 quality score
   */
  private normalizeToQualityScore(
    data: any, 
    content: string,
    contentStructure?: DataForSEOScoringResult['metrics']['contentStructure'],
    technicalQuality?: number
  ): number {
    let score = 50 // Base score

    // Check if we have citation data
    if (data && typeof data === 'object') {
      // If there are citations/references, boost score
      const hasCitations = !!(data.citations || data.references || 
                              (data.items && Array.isArray(data.items) && data.items.length > 0) ||
                              (Array.isArray(data) && data.length > 0))
      if (hasCitations) {
        score += 20
      }

      // Check for sentiment data (positive sentiment boosts score)
      if (data.sentiment || data.connotation_types) {
        const sentiment = data.sentiment || data.connotation_types?.positive || 0
        score += Math.min(sentiment * 20, 20)
      }

      // Check citation count (more citations = better)
      const citationCount = data.items?.length || data.citations?.length || 0
      if (citationCount > 5) score += 5
      if (citationCount > 10) score += 5
    }

    // Check content length (longer content generally scores better)
    const wordCount = content.split(/\s+/).length
    if (wordCount > 1000) score += 10
    if (wordCount > 2000) score += 5
    if (wordCount > 3000) score += 5

    // Boost score based on content structure
    if (contentStructure) {
      if (contentStructure.headings && contentStructure.headings > 5) score += 5
      if (contentStructure.links && contentStructure.links > 10) score += 5
      if (contentStructure.images && contentStructure.images > 3) score += 3
    }

    // Add technical quality score (weighted 20%)
    if (technicalQuality !== undefined) {
      score = (score * 0.8) + (technicalQuality * 0.2)
    }

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  /**
   * Extract keyword coverage metric
   */
  private extractKeywordCoverage(data: any): number {
    // Simplified - in production, analyze actual keyword density
    if (!data || typeof data !== 'object') return 0
    
    // If we have keyword-related data, assume some coverage
    if (data.keyword || data.keywords || (Array.isArray(data) && data.length > 0)) {
      return 70 // Default coverage score
    }
    
    return 0
  }

  /**
   * Extract citation quality metric
   */
  private extractCitationQuality(data: any): number {
    if (!data || typeof data !== 'object') return 0
    
    // Check for citation indicators
    const citationCount = data.items?.length || data.citations?.length || data.references?.length || 0
    
    if (citationCount === 0) return 0
    if (citationCount < 3) return 50
    if (citationCount < 5) return 70
    if (citationCount < 10) return 85
    return 95 // 10+ citations
  }
}

