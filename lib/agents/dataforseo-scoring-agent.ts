/**
 * DataForSEO Content Analysis Scoring Agent
 * Analyzes content using DataForSEO API with comprehensive metrics and accurate scoring
 */

import { mcpDataforseoTools } from '@/lib/mcp/dataforseo/index'
import { aiSearchOptimizer } from '@/lib/ai/ai-search-optimizer'
import { AbortError } from '@/lib/errors/types'

// Helper to execute MCP tools (they only need args, not the full AI SDK context)
// The execute function can return string | AsyncIterable<string> | PromiseLike<string>
const executeTool = async <T>(
  tool: { execute?: (args: T, ctx?: any) => string | AsyncIterable<string> | PromiseLike<string> },
  args: T,
  ctx: any = { toolCallId: 'agent-exec', messages: [] }
): Promise<string> => {
  if (!tool.execute) throw new Error('Tool does not have execute function')
  const result = tool.execute(args, ctx)
  // Handle different return types
  if (typeof result === 'string') return result
  if ('then' in result) return await result
  // AsyncIterable - collect all chunks
  let collected = ''
  for await (const chunk of result) {
    if (ctx?.abortSignal?.aborted) {
      throw new AbortError('Tool execution aborted')
    }
    collected += chunk
  }
  return collected
}

export interface DataForSEOScoringParams {
  content: string
  targetKeyword: string
  language?: string
  contentUrl?: string // Optional URL for on-page analysis
  userId?: string // For usage logging
  abortSignal?: AbortSignal // Optional: signal to abort scoring
}

export interface DataForSEOScoringResult {
  dataforseoRaw: any
  dataforseoQualityScore: number // 0-100 normalized score
  metrics: {
    readability?: number
    sentiment?: number
    keywordCoverage?: number
    keywordDensity?: number
    semanticKeywords?: string[]
    citationQuality?: number
    technicalQuality?: number // Lighthouse score if URL provided
    aiSearchMetrics?: {
      chatgptVolume?: number
      perplexityVolume?: number
      aiOpportunityScore?: number
      aiVsTraditionalRatio?: number
    }
    contentStructure?: {
      headings?: number
      links?: number
      images?: number
      lists?: number
    }
    phraseTrends?: Array<{ phrase: string; trend: number }>
  }
}

export class DataForSEOScoringAgent {
  /**
   * Analyze content using DataForSEO content analysis API
   */
  async analyzeContent(params: DataForSEOScoringParams): Promise<DataForSEOScoringResult> {
    console.log('[DataForSEO Scoring] Analyzing content for keyword:', params.targetKeyword)

    try {
      const checkAborted = () => {
        if (params.abortSignal?.aborted) {
          throw new AbortError('DataForSEO scoring aborted')
        }
      }

      const toolCtx = {
        toolCallId: 'agent-exec',
        messages: [],
        abortSignal: params.abortSignal,
      }

      checkAborted()

      // Run three independent API calls in parallel for better latency
      let citationData: any = {}
      let phraseTrends: Array<{ phrase: string; trend: number }> = []
      let relatedKeywords: string[] = []

      const [searchResult, trendsResult, relatedResult] = await Promise.all([
        // Step 1: Get detailed citation data using content_analysis_search
        executeTool(mcpDataforseoTools.content_analysis_search, {
          keyword: params.targetKeyword,
          limit: 10,
          offset: 0,
          page_type: ['blogs', 'news'] as const,
        }, toolCtx).catch(error => {
          console.warn('[DataForSEO Scoring] Content analysis search failed:', error)
          return null
        }),
        // Step 2: Get phrase trends for content optimization
        executeTool(mcpDataforseoTools.content_analysis_phrase_trends, {
          keyword: params.targetKeyword,
          date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
          date_group: 'month' as const,
          internal_list_limit: 10,
        }, toolCtx).catch(error => {
          console.warn('[DataForSEO Scoring] Phrase trends failed:', error)
          return null
        }),
        // Step 3: Get related keywords for semantic coverage check
        executeTool(mcpDataforseoTools.dataforseo_labs_google_related_keywords, {
          keyword: params.targetKeyword,
          language_code: params.language || 'en',
          location_name: 'United States',
          depth: 1,
          limit: 20,
          include_clickstream_data: false,
        }, toolCtx).catch(error => {
          console.warn('[DataForSEO Scoring] Related keywords failed:', error)
          return null
        }),
      ])

      // Process search result
      if (searchResult) {
        checkAborted()
        const searchParsed = typeof searchResult === 'string' ? JSON.parse(searchResult) : searchResult
        if (searchParsed && searchParsed.tasks && searchParsed.tasks[0]?.result) {
          citationData = searchParsed.tasks[0].result[0]
          console.log('[DataForSEO Scoring] Citation data retrieved')
        }
      }

      // Process trends result
      if (trendsResult) {
        checkAborted()
        const trendsParsed = typeof trendsResult === 'string' ? JSON.parse(trendsResult) : trendsResult
        if (trendsParsed && trendsParsed.tasks && trendsParsed.tasks[0]?.result) {
          phraseTrends = (trendsParsed.tasks[0].result || []).slice(0, 10).map((item: any) => ({
            phrase: item.phrase || item.keyword || '',
            trend: item.trend || item.growth || 0,
          }))
          console.log('[DataForSEO Scoring] Phrase trends retrieved:', phraseTrends.length)
        }
      }

      // Process related keywords result
      if (relatedResult) {
        checkAborted()
        const relatedParsed = typeof relatedResult === 'string' ? JSON.parse(relatedResult) : relatedResult
        if (relatedParsed && relatedParsed.tasks && relatedParsed.tasks[0]?.result) {
          const items = relatedParsed.tasks[0].result[0]?.items || []
          relatedKeywords = items.slice(0, 15).map((item: any) => item.keyword_data?.keyword || item.keyword || '')
          console.log('[DataForSEO Scoring] Related keywords retrieved:', relatedKeywords.length)
        }
      }

      // Step 4: Fallback to summary if search didn't work
      if (!citationData || Object.keys(citationData).length === 0) {
        checkAborted()
        const summaryResult = await executeTool(mcpDataforseoTools.content_analysis_summary, {
          keyword: params.targetKeyword,
          internal_list_limit: 5,
          positive_connotation_threshold: 0.4,
          sentiments_connotation_threshold: 0.4,
        }, toolCtx)

        try {
          citationData = typeof summaryResult === 'string' ? JSON.parse(summaryResult) : summaryResult
        } catch {
          citationData = { raw: summaryResult }
        }
      }

      // Step 5: Analyze content structure if URL is provided
      let contentStructure: DataForSEOScoringResult['metrics']['contentStructure'] | undefined
      let technicalQuality: number | undefined

      if (params.contentUrl) {
        try {
          checkAborted()
          const parseResult = await executeTool(mcpDataforseoTools.on_page_content_parsing, {
            url: params.contentUrl!,
            enable_javascript: true,
          }, toolCtx)

          const parseParsed = typeof parseResult === 'string' ? JSON.parse(parseResult) : parseResult
          if (parseParsed && parseParsed.tasks && parseParsed.tasks[0]?.result) {
            const pageData = parseParsed.tasks[0].result[0]
            contentStructure = {
              headings: pageData.headings?.length || 0,
              links: pageData.links?.length || 0,
              images: pageData.images?.length || 0,
              lists: pageData.lists?.length || 0,
            }
            console.log('[DataForSEO Scoring] Content structure analyzed:', contentStructure)
          }

          // Get Lighthouse score for technical quality
          try {
            checkAborted()
            const lighthouseResult = await executeTool(mcpDataforseoTools.on_page_lighthouse, {
              url: params.contentUrl!,
              enable_javascript: true,
            }, toolCtx)

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

      // Step 6: Get AI search volume metrics
      let aiSearchMetrics: DataForSEOScoringResult['metrics']['aiSearchMetrics'] | undefined
      try {
        checkAborted()
        const aiAnalysis = await aiSearchOptimizer.analyzeAISearchVolume(
          [params.targetKeyword],
          'United States',
          params.language || 'en',
          {}, // Traditional volumes would come from keyword research
          params.abortSignal
        )
        
        if (aiAnalysis.keywords.length > 0) {
          const aiKeyword = aiAnalysis.keywords[0]
          aiSearchMetrics = {
            chatgptVolume: aiKeyword.chatgptVolume,
            perplexityVolume: aiKeyword.perplexityVolume,
            aiOpportunityScore: aiKeyword.aiOpportunityScore,
            aiVsTraditionalRatio: aiKeyword.aiVsTraditionalRatio,
          }
          console.log('[DataForSEO Scoring] AI search metrics retrieved:', aiSearchMetrics)
        }
      } catch (error) {
        console.warn('[DataForSEO Scoring] AI search volume analysis failed:', error)
      }

      // Step 7: Calculate content metrics from actual content
      checkAborted()
      const contentMetrics = this.analyzeContentDirectly(params.content, params.targetKeyword, relatedKeywords)

      // Step 8: Normalize to a quality score (0-100) with accurate calculation
      checkAborted()
      const qualityScore = this.calculateAccurateScore(
        citationData,
        contentMetrics,
        contentStructure,
        technicalQuality,
        phraseTrends,
        aiSearchMetrics
      )

      console.log('[DataForSEO Scoring] ✓ Analysis complete, score:', qualityScore)

      return {
        dataforseoRaw: citationData,
        dataforseoQualityScore: qualityScore,
        metrics: {
          keywordCoverage: contentMetrics.keywordCoverage,
          keywordDensity: contentMetrics.keywordDensity,
          semanticKeywords: relatedKeywords,
          citationQuality: this.extractCitationQuality(citationData),
          readability: contentMetrics.readability,
          technicalQuality,
          aiSearchMetrics,
          contentStructure: contentStructure || contentMetrics.structure,
          phraseTrends,
        },
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }

      if (params.abortSignal?.aborted) {
        const abortError = new Error('DataForSEO scoring aborted')
        abortError.name = 'AbortError'
        throw abortError
      }

      console.error('[DataForSEO Scoring] Error analyzing content:', error)

      // Return default scores on error
      return {
        dataforseoRaw: { error: error instanceof Error ? error.message : 'Unknown error' },
        dataforseoQualityScore: 40, // Conservative default
        metrics: {},
      }
    }
  }

  /**
   * Analyze content directly for objective metrics
   */
  private analyzeContentDirectly(content: string, targetKeyword: string, semanticKeywords: string[]): {
    wordCount: number
    keywordDensity: number
    keywordCoverage: number
    readability: number
    structure: { headings: number; links: number; images: number; lists: number }
  } {
    const lowerContent = content.toLowerCase()
    const words = content.split(/\s+/).filter(w => w.length > 0)
    const wordCount = words.length

    // Keyword density (target keyword occurrences / total words * 100)
    const targetLower = targetKeyword.toLowerCase()
    const keywordOccurrences = (lowerContent.match(new RegExp(targetLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
    const keywordDensity = wordCount > 0 ? (keywordOccurrences / wordCount) * 100 : 0

    // Semantic keyword coverage (how many related keywords are present)
    const coveredKeywords = semanticKeywords.filter(kw =>
      lowerContent.includes(kw.toLowerCase())
    )
    const keywordCoverage = semanticKeywords.length > 0
      ? (coveredKeywords.length / semanticKeywords.length) * 100
      : 50 // Default if no semantic keywords

    // Readability (simplified Flesch-Kincaid approximation)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0
    const avgSyllables = this.estimateAverageSyllables(words)
    // Flesch Reading Ease = 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
    const fleschScore = Math.max(0, Math.min(100, 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllables)))

    // Count structure elements
    const headings = (content.match(/^#{1,6}\s+/gm) || []).length +
      (content.match(/<h[1-6][^>]*>/gi) || []).length
    const links = (content.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length +
      (content.match(/<a\s+[^>]*href/gi) || []).length
    const images = (content.match(/!\[([^\]]*)\]\([^)]+\)/g) || []).length +
      (content.match(/<img\s+[^>]*src/gi) || []).length
    const lists = (content.match(/^[\s]*[-*+]\s+/gm) || []).length +
      (content.match(/^[\s]*\d+\.\s+/gm) || []).length

    return {
      wordCount,
      keywordDensity,
      keywordCoverage,
      readability: fleschScore,
      structure: { headings, links, images, lists },
    }
  }

  /**
   * Estimate average syllables per word (rough approximation)
   */
  private estimateAverageSyllables(words: string[]): number {
    if (words.length === 0) return 0

    let totalSyllables = 0
    for (const word of words) {
      // Simple syllable estimation: count vowel groups
      const syllables = (word.toLowerCase().match(/[aeiouy]+/g) || []).length || 1
      totalSyllables += Math.max(1, syllables)
    }

    return totalSyllables / words.length
  }

  /**
   * Calculate accurate quality score with proper weighting
   */
  private calculateAccurateScore(
    citationData: any,
    contentMetrics: {
      wordCount: number
      keywordDensity: number
      keywordCoverage: number
      readability: number
      structure: { headings: number; links: number; images: number; lists: number }
    },
    contentStructure?: DataForSEOScoringResult['metrics']['contentStructure'],
    technicalQuality?: number,
    phraseTrends?: Array<{ phrase: string; trend: number }>,
    aiSearchMetrics?: DataForSEOScoringResult['metrics']['aiSearchMetrics']
  ): number {
    // Start with conservative base score
    let score = 30

    // === Content Length (0-15 points) ===
    if (contentMetrics.wordCount >= 2500) score += 15
    else if (contentMetrics.wordCount >= 2000) score += 12
    else if (contentMetrics.wordCount >= 1500) score += 9
    else if (contentMetrics.wordCount >= 1000) score += 6
    else if (contentMetrics.wordCount >= 500) score += 3

    // === Keyword Optimization (0-15 points) ===
    // Optimal keyword density is 1-2%
    if (contentMetrics.keywordDensity >= 0.5 && contentMetrics.keywordDensity <= 3) {
      score += 10
    } else if (contentMetrics.keywordDensity > 0) {
      score += 5
    }
    // Semantic keyword coverage bonus
    if (contentMetrics.keywordCoverage >= 60) score += 5
    else if (contentMetrics.keywordCoverage >= 40) score += 3

    // === Readability (0-10 points) ===
    // Target Flesch score 60-70 (easily readable)
    if (contentMetrics.readability >= 50 && contentMetrics.readability <= 80) {
      score += 10
    } else if (contentMetrics.readability >= 30) {
      score += 5
    }

    // === Content Structure (0-15 points) ===
    const structure = contentStructure || contentMetrics.structure
    if (structure) {
      // Headings (good structure = 5+ headings for 2000 words)
      if (structure.headings && structure.headings >= 5) score += 5
      else if (structure.headings && structure.headings >= 3) score += 3

      // Links (internal/external linking)
      if (structure.links && structure.links >= 5) score += 4
      else if (structure.links && structure.links >= 2) score += 2

      // Images (visual content)
      if (structure.images && structure.images >= 3) score += 3
      else if (structure.images && structure.images >= 1) score += 1

      // Lists (scannable content)
      if (structure.lists && structure.lists >= 3) score += 3
      else if (structure.lists && structure.lists >= 1) score += 1
    }

    // === Citation Quality (0-10 points) ===
    if (citationData && typeof citationData === 'object') {
      const hasCitations = !!(citationData.citations || citationData.references ||
        (citationData.items && Array.isArray(citationData.items) && citationData.items.length > 0) ||
        (Array.isArray(citationData) && citationData.length > 0))
      if (hasCitations) {
        const citationCount = citationData.items?.length || citationData.citations?.length || 0
        if (citationCount >= 8) score += 10
        else if (citationCount >= 5) score += 7
        else if (citationCount >= 3) score += 5
        else score += 3
      }
    }

    // === Trending Phrases (0-5 points) ===
    if (phraseTrends && phraseTrends.length > 0) {
      score += Math.min(5, phraseTrends.length)
    }

    // === Technical Quality (0-10 points, if URL provided) ===
    if (technicalQuality !== undefined) {
      score += Math.round(technicalQuality * 0.1)
    }

    // === AI Search Optimization (0-10 points) ===
    if (aiSearchMetrics) {
      // High AI opportunity = bonus points for AEO optimization potential
      if (aiSearchMetrics.aiOpportunityScore && aiSearchMetrics.aiOpportunityScore >= 70) {
        score += 10 // High AI opportunity
      } else if (aiSearchMetrics.aiOpportunityScore && aiSearchMetrics.aiOpportunityScore >= 50) {
        score += 5 // Medium AI opportunity
      } else if (aiSearchMetrics.aiOpportunityScore && aiSearchMetrics.aiOpportunityScore > 0) {
        score += 2 // Low but present AI opportunity
      }
      
      // AI volume bonus (if significant AI search volume exists)
      const totalAIVolume = (aiSearchMetrics.chatgptVolume || 0) + (aiSearchMetrics.perplexityVolume || 0)
      if (totalAIVolume > 1000) {
        score += 3 // Significant AI search volume
      } else if (totalAIVolume > 500) {
        score += 1 // Moderate AI search volume
      }
    }

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  /**
   * Extract citation quality metric
   */
  private extractCitationQuality(data: any): number {
    if (!data || typeof data !== 'object') return 0

    // Check for citation indicators
    const citationCount = data.items?.length || data.citations?.length || data.references?.length || 0

    if (citationCount === 0) return 0
    if (citationCount < 3) return 40
    if (citationCount < 5) return 60
    if (citationCount < 8) return 75
    if (citationCount < 10) return 85
    return 95 // 10+ citations
  }
}
