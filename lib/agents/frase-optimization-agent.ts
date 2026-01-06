/**
 * Frase Content Optimization Agent
 * Leverages Frase.io API for advanced SEO/AEO content analysis and optimization
 * Frase specializes in SERP analysis, content briefs, and topic modeling
 */

export interface FraseOptimizationParams {
  content?: string // Optional: Content to analyze (if not provided, will create new brief)
  targetKeyword: string
  competitorUrls?: string[] // Optional: Provide custom URLs instead of SERP scraping
  language?: string
  country?: string
  userId?: string // For usage logging
  contentType?: 'blog_post' | 'article' | 'landing_page' | 'social_media'
  abortSignal?: AbortSignal // Optional: signal to abort Frase optimization
}

export interface FraseOptimizationResult {
  fraseRaw: any
  optimizationScore: number // 0-100 normalized score
  contentBrief: {
    topicClusters?: Array<{
      topic: string
      frequency: number
      importance: number
    }>
    questions?: string[]
    headings?: Array<{
      heading: string
      frequency: number
      importance: number
    }>
    keyTerms?: Array<{
      term: string
      frequency: number
      tfidf?: number
    }>
    competitorInsights?: {
      avgWordCount?: number
      avgHeadingCount?: number
      commonSections?: string[]
      topPerformingUrls?: Array<{
        url: string
        wordCount?: number
        title?: string
      }>
    }
  }
  recommendations: {
    missingTopics?: string[]
    missingQuestions?: string[]
    suggestedHeadings?: string[]
    suggestedTerms?: string[]
    suggestedTopics?: string[]
    suggestedQuestions?: string[]
    contentGaps?: string[]
    optimizationTips?: string[]
  }
  searchIntent?: 'informational' | 'transactional' | 'navigational' | 'commercial'
}

export class FraseOptimizationAgent {
  private apiKey: string
  private baseUrl = 'https://api.frase.io/api/v1'  // Correct path per Frase docs

  constructor() {
    this.apiKey = process.env.FRASE_API_KEY || ''
    // Don't throw - Frase is optional, will handle missing key gracefully in methods
  }

  /**
   * Main optimization method - analyzes content against SERP competitors
   */
  async optimizeContent(params: FraseOptimizationParams): Promise<FraseOptimizationResult> {
    console.log('[Frase Agent] Starting content optimization for:', params.targetKeyword)

    // Check if API key is available
    if (!this.apiKey) {
      console.warn('[Frase Agent] FRASE_API_KEY not configured, returning fallback result')
      return {
        fraseRaw: { error: 'FRASE_API_KEY not configured' },
        optimizationScore: 50, // Neutral fallback score
        contentBrief: {},
        recommendations: {
          optimizationTips: ['Frase API key not configured. Add FRASE_API_KEY to enable SERP analysis.'],
        },
      }
    }

    try {
      // Step 1: Process SERP or custom URLs to get competitive insights
      const serpData = await this.processSERP({
        query: params.targetKeyword,
        customUrls: params.competitorUrls,
        language: params.language || 'en',
        country: params.country || 'us',
        userId: params.userId,
      })

      // Step 2: Analyze content if provided
      let contentAnalysis: any = null
      if (params.content) {
        contentAnalysis = await this.analyzeContent({
          content: params.content,
          targetKeyword: params.targetKeyword,
          serpData,
          userId: params.userId,
        })
      }

      // Step 3: Extract optimization insights
      const optimizationResult = this.extractOptimizationInsights(
        serpData,
        contentAnalysis,
        params.content
      )

      console.log('[Frase Agent] ✓ Optimization complete, score:', optimizationResult.optimizationScore)

      return optimizationResult
    } catch (error) {
      console.error('[Frase Agent] Error during optimization:', error)

      // Return default result on error
      return {
        fraseRaw: { error: error instanceof Error ? error.message : 'Unknown error' },
        optimizationScore: 40,
        contentBrief: {},
        recommendations: {
          optimizationTips: ['Error occurred during Frase analysis. Please try again.'],
        },
      }
    }
  }

  /**
   * Process SERP to get competitive analysis
   */
  private async processSERP(params: {
    query: string
    customUrls?: string[]
    language: string
    country: string
    userId?: string
  }): Promise<any> {
    console.log('[Frase Agent] Processing SERP for query:', params.query)

    try {
      const endpoint = `${this.baseUrl}/process_serp`

      const requestBody = params.customUrls
        ? {
          serp_urls: params.customUrls,
          query: params.query,
        }
        : {
          query: params.query,
          lang: params.language,
          country: params.country,
        }

      // Make API request directly without MCP logging
      const serpResult = await this.makeAPIRequest(endpoint, requestBody)

      console.log('[Frase Agent] SERP processing complete')
      return serpResult
    } catch (error) {
      console.error('[Frase Agent] SERP processing failed:', error)
      throw error
    }
  }

  /**
   * Analyze existing content against SERP data
   */
  private async analyzeContent(params: {
    content: string
    targetKeyword: string
    serpData: any
    userId?: string
  }): Promise<any> {
    console.log('[Frase Agent] Analyzing content structure and coverage')

    // Extract topics, questions, and key terms from SERP data
    const serpTopics = this.extractTopicsFromSERP(params.serpData)
    const serpQuestions = this.extractQuestionsFromSERP(params.serpData)
    const serpKeyTerms = this.extractKeyTermsFromSERP(params.serpData)

    // Analyze current content coverage
    const contentLower = params.content.toLowerCase()
    const coveredTopics = serpTopics.filter(topic =>
      topic.topic.trim() && contentLower.includes(topic.topic.toLowerCase())
    )
    const coveredQuestions = serpQuestions.filter(q =>
      q.trim() && contentLower.includes(q.toLowerCase())
    )
    const coveredTerms = serpKeyTerms.filter(term =>
      term.term.trim() && contentLower.includes(term.term.toLowerCase())
    )

    return {
      serpTopics,
      serpQuestions,
      serpKeyTerms,
      coveredTopics,
      coveredQuestions,
      coveredTerms,
      coverageScore: {
        topics: serpTopics.length > 0 ? (coveredTopics.length / serpTopics.length) * 100 : 0,
        questions: serpQuestions.length > 0 ? (coveredQuestions.length / serpQuestions.length) * 100 : 0,
        terms: serpKeyTerms.length > 0 ? (coveredTerms.length / serpKeyTerms.length) * 100 : 0,
      },
    }
  }

  /**
   * Extract optimization insights from SERP and content analysis
   */
  private extractOptimizationInsights(
    serpData: any,
    contentAnalysis: any | null,
    content?: string
  ): FraseOptimizationResult {
    // Extract topics from SERP
    const topicClusters = this.extractTopicsFromSERP(serpData)
    const questions = this.extractQuestionsFromSERP(serpData)
    const headings = this.extractHeadingsFromSERP(serpData)
    const keyTerms = this.extractKeyTermsFromSERP(serpData)
    const competitorInsights = this.extractCompetitorInsights(serpData)

    // Calculate optimization score
    let optimizationScore = 50 // Base score

    if (contentAnalysis) {
      // Boost score based on coverage
      const topicCoverage = contentAnalysis.coverageScore.topics || 0
      const questionCoverage = contentAnalysis.coverageScore.questions || 0
      const termCoverage = contentAnalysis.coverageScore.terms || 0

      optimizationScore = Math.round(
        topicCoverage * 0.4 + // 40% weight on topic coverage
        questionCoverage * 0.3 + // 30% weight on question coverage
        termCoverage * 0.3 // 30% weight on term coverage
      )

      // Bonus for comprehensive content (word count)
      if (content && competitorInsights) {
        const wordCount = content.split(/\s+/).length
        const avgCompetitorWords = competitorInsights.avgWordCount || 2000
        if (wordCount >= avgCompetitorWords * 0.9) {
          optimizationScore = Math.min(100, optimizationScore + 10)
        }
      }
    }

    // Generate recommendations
    const recommendations: FraseOptimizationResult['recommendations'] = {
      optimizationTips: [],
    }

    if (contentAnalysis) {
      // Find missing topics
      recommendations.missingTopics = topicClusters
        .filter(t => !contentAnalysis.coveredTopics.some((ct: any) => ct.topic === t.topic))
        .slice(0, 10)
        .map(t => t.topic)

      // Find missing questions
      recommendations.missingQuestions = questions
        .filter(q => !contentAnalysis.coveredQuestions.includes(q))
        .slice(0, 10)

      // Suggest missing key terms
      recommendations.suggestedTerms = keyTerms
        .filter(t => !contentAnalysis.coveredTerms.some((ct: any) => ct.term === t.term))
        .slice(0, 15)
        .map(t => t.term)

      // Suggest headings based on SERP
      recommendations.suggestedHeadings = headings
        .slice(0, 8)
        .map(h => h.heading)

      // Generate optimization tips
      recommendations.optimizationTips = this.generateOptimizationTips(
        contentAnalysis,
        competitorInsights,
        content
      )
    } else {
      // No content provided - give general optimization tips
      recommendations.suggestedTopics = topicClusters.slice(0, 10).map(t => t.topic)
      recommendations.suggestedQuestions = questions.slice(0, 10)
      recommendations.suggestedHeadings = headings.slice(0, 8).map(h => h.heading)
      recommendations.suggestedTerms = keyTerms.slice(0, 15).map(t => t.term)
      recommendations.optimizationTips = [
        `Target word count: ${competitorInsights?.avgWordCount || 2000}+ words`,
        `Include ${competitorInsights?.avgHeadingCount || 8}+ headings for better structure`,
        'Cover all major topic clusters identified from SERP analysis',
        'Answer key questions users are asking',
      ]
    }

    // Determine search intent from SERP
    const searchIntent = this.determineSearchIntent(serpData)

    return {
      fraseRaw: serpData,
      optimizationScore,
      contentBrief: {
        topicClusters,
        questions,
        headings,
        keyTerms,
        competitorInsights,
      },
      recommendations,
      searchIntent,
    }
  }

  /**
   * Extract topic clusters from SERP data
   */
  private extractTopicsFromSERP(serpData: any): Array<{ topic: string; frequency: number; importance: number }> {
    const topics: Array<{ topic: string; frequency: number; importance: number }> = []

    try {
      // Handle different Frase API response structures
      const results = serpData?.results || serpData?.data?.results || serpData?.items || []

      // Extract topics from NLP analysis
      if (serpData?.topics || serpData?.data?.topics) {
        const topicData = serpData.topics || serpData.data.topics
        for (const topic of topicData.slice(0, 20)) {
          const topicText = topic.name || topic.topic || topic.text || ''
          // Skip empty strings to prevent false coverage matches
          if (topicText.trim()) {
            topics.push({
              topic: topicText,
              frequency: topic.frequency || topic.count || 1,
              importance: topic.importance || topic.score || topic.relevance || 0.5,
            })
          }
        }
      }

      // Fallback: Extract from page titles and snippets
      if (topics.length === 0 && results.length > 0) {
        const textContent = results
          .map((r: any) => `${r.title || ''} ${r.snippet || ''}`)
          .join(' ')
        const words = textContent.toLowerCase().split(/\s+/)
        const wordFreq: Record<string, number> = {}

        for (const word of words) {
          if (word.length > 4) {
            // Filter short words
            wordFreq[word] = (wordFreq[word] || 0) + 1
          }
        }

        // Get top words as topics
        const sortedWords = Object.entries(wordFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)

        for (const [word, freq] of sortedWords) {
          topics.push({
            topic: word,
            frequency: freq,
            importance: freq / results.length,
          })
        }
      }
    } catch (error) {
      console.warn('[Frase Agent] Error extracting topics:', error)
    }

    return topics
  }

  /**
   * Extract questions from SERP data
   */
  private extractQuestionsFromSERP(serpData: any): string[] {
    const questions: string[] = []

    try {
      // Extract from Frase questions field
      if (serpData?.questions || serpData?.data?.questions) {
        const questionData = serpData.questions || serpData.data.questions
        for (const q of questionData.slice(0, 15)) {
          const questionText = typeof q === 'string' ? q : q.question || q.text || ''
          // Skip empty strings to prevent false coverage matches
          if (questionText.trim()) {
            questions.push(questionText)
          }
        }
      }

      // Extract from PAA (People Also Ask)
      if (serpData?.people_also_ask || serpData?.data?.people_also_ask) {
        const paaData = serpData.people_also_ask || serpData.data.people_also_ask
        for (const paa of paaData.slice(0, 10)) {
          const paaText = typeof paa === 'string' ? paa : paa.question || paa.text || ''
          // Skip empty strings to prevent false coverage matches
          if (paaText.trim()) {
            questions.push(paaText)
          }
        }
      }

      // Fallback: Extract question patterns from content
      const results = serpData?.results || serpData?.data?.results || []
      for (const result of results) {
        const text = `${result.title || ''} ${result.snippet || ''}`
        const questionMatches = text.match(/\b(what|why|how|when|where|who|which|can|is|are|do|does)[^.?!]*\?/gi)
        if (questionMatches) {
          questions.push(...questionMatches.slice(0, 3))
        }
      }
    } catch (error) {
      console.warn('[Frase Agent] Error extracting questions:', error)
    }

    // Deduplicate and return
    return Array.from(new Set(questions)).slice(0, 20)
  }

  /**
   * Extract common headings from SERP data
   */
  private extractHeadingsFromSERP(serpData: any): Array<{ heading: string; frequency: number; importance: number }> {
    const headings: Array<{ heading: string; frequency: number; importance: number }> = []

    try {
      // Extract from Frase headings field
      if (serpData?.headings || serpData?.data?.headings) {
        const headingData = serpData.headings || serpData.data.headings
        for (const h of headingData.slice(0, 15)) {
          headings.push({
            heading: typeof h === 'string' ? h : h.heading || h.text || '',
            frequency: h.frequency || h.count || 1,
            importance: h.importance || h.score || 0.5,
          })
        }
      }
    } catch (error) {
      console.warn('[Frase Agent] Error extracting headings:', error)
    }

    return headings
  }

  /**
   * Extract key terms from SERP data
   */
  private extractKeyTermsFromSERP(serpData: any): Array<{ term: string; frequency: number; tfidf?: number }> {
    const keyTerms: Array<{ term: string; frequency: number; tfidf?: number }> = []

    try {
      // Extract from Frase terms/keywords field
      if (serpData?.terms || serpData?.keywords || serpData?.data?.terms || serpData?.data?.keywords) {
        const termData = serpData.terms || serpData.keywords || serpData.data.terms || serpData.data.keywords
        for (const t of termData.slice(0, 30)) {
          const termText = typeof t === 'string' ? t : t.term || t.keyword || t.text || ''
          // Skip empty strings to prevent false coverage matches
          if (termText.trim()) {
            keyTerms.push({
              term: termText,
              frequency: t.frequency || t.count || 1,
              tfidf: t.tfidf || t.score || undefined,
            })
          }
        }
      }
    } catch (error) {
      console.warn('[Frase Agent] Error extracting key terms:', error)
    }

    return keyTerms
  }

  /**
   * Extract competitor insights from SERP data
   */
  private extractCompetitorInsights(serpData: any): FraseOptimizationResult['contentBrief']['competitorInsights'] {
    const insights: FraseOptimizationResult['contentBrief']['competitorInsights'] = {}

    try {
      const results = serpData?.results || serpData?.data?.results || serpData?.items || []

      if (results.length > 0) {
        // Calculate average word count
        const wordCounts = results
          .map((r: any) => r.word_count || r.wordCount || 0)
          .filter((wc: number) => wc > 0)
        if (wordCounts.length > 0) {
          insights.avgWordCount = Math.round(
            wordCounts.reduce((a: number, b: number) => a + b, 0) / wordCounts.length
          )
        }

        // Calculate average heading count
        const headingCounts = results
          .map((r: any) => r.heading_count || r.headingCount || 0)
          .filter((hc: number) => hc > 0)
        if (headingCounts.length > 0) {
          insights.avgHeadingCount = Math.round(
            headingCounts.reduce((a: number, b: number) => a + b, 0) / headingCounts.length
          )
        }

        // Get top performing URLs
        insights.topPerformingUrls = results.slice(0, 5).map((r: any) => ({
          url: r.url || r.link || '',
          wordCount: r.word_count || r.wordCount || undefined,
          title: r.title || '',
        }))
      }
    } catch (error) {
      console.warn('[Frase Agent] Error extracting competitor insights:', error)
    }

    return insights
  }

  /**
   * Determine search intent from SERP data
   */
  private determineSearchIntent(serpData: any): FraseOptimizationResult['searchIntent'] {
    try {
      // Check if Frase provides intent directly
      if (serpData?.intent || serpData?.data?.intent) {
        return serpData.intent || serpData.data.intent
      }

      // Infer from SERP features and URL patterns
      const results = serpData?.results || serpData?.data?.results || []
      const urls = results.map((r: any) => (r.url || r.link || '').toLowerCase())

      // Transactional indicators
      const transactionalKeywords = ['buy', 'price', 'shop', 'purchase', 'order', 'discount', 'deal']
      const hasTransactional = urls.some((url: string) =>
        transactionalKeywords.some(keyword => url.includes(keyword))
      )
      if (hasTransactional) return 'transactional'

      // Commercial indicators
      const commercialKeywords = ['review', 'best', 'top', 'comparison', 'vs', 'alternative']
      const hasCommercial = urls.some((url: string) =>
        commercialKeywords.some(keyword => url.includes(keyword))
      )
      if (hasCommercial) return 'commercial'

      // Navigational indicators (brand/product names)
      const hasNavigational = results.some((r: any) => {
        try {
          const urlString = r.url || r.link || ''
          if (!urlString) return false
          const domain = new URL(urlString).hostname
          const title = (r.title || '').toLowerCase()
          return title.includes(domain.replace('www.', '').split('.')[0])
        } catch {
          // Skip malformed URLs
          return false
        }
      })
      if (hasNavigational) return 'navigational'

      // Default to informational
      return 'informational'
    } catch (error) {
      console.warn('[Frase Agent] Error determining search intent:', error)
      return 'informational'
    }
  }

  /**
   * Generate actionable optimization tips
   */
  private generateOptimizationTips(
    contentAnalysis: any,
    competitorInsights: FraseOptimizationResult['contentBrief']['competitorInsights'],
    content?: string
  ): string[] {
    const tips: string[] = []

    try {
      // Word count tip
      if (content && competitorInsights?.avgWordCount) {
        const currentWordCount = content.split(/\s+/).length
        const targetWordCount = competitorInsights.avgWordCount
        if (currentWordCount < targetWordCount * 0.9) {
          tips.push(`Increase content length to ${targetWordCount}+ words (currently ${currentWordCount})`)
        }
      }

      // Topic coverage tip
      if (contentAnalysis?.coverageScore?.topics < 70) {
        tips.push(`Improve topic coverage (current: ${Math.round(contentAnalysis.coverageScore.topics)}%)`)
      }

      // Question coverage tip
      if (contentAnalysis?.coverageScore?.questions < 60) {
        tips.push(`Address more user questions (current: ${Math.round(contentAnalysis.coverageScore.questions)}%)`)
      }

      // Term usage tip
      if (contentAnalysis?.coverageScore?.terms < 60) {
        tips.push(`Include more relevant key terms (current: ${Math.round(contentAnalysis.coverageScore.terms)}%)`)
      }

      // Heading structure tip
      if (content && competitorInsights?.avgHeadingCount) {
        const currentHeadingCount = this.countHeadings(content)
        if (currentHeadingCount < competitorInsights.avgHeadingCount * 0.8) {
          tips.push(`Add more headings for better structure (target: ${competitorInsights.avgHeadingCount}+)`)
        }
      }

      // General tips if analysis is limited
      if (tips.length === 0) {
        tips.push('Content is well-optimized! Continue monitoring SERP changes.')
      }
    } catch (error) {
      console.warn('[Frase Agent] Error generating optimization tips:', error)
      tips.push('Review content against SERP competitors for optimization opportunities')
    }

    return tips
  }

  /**
   * Count headings in content, detecting format (HTML, Markdown, or plain text)
   */
  private countHeadings(content: string): number {
    if (!content) return 0

    // Detect HTML content
    if (/<h[1-6][^>]*>/i.test(content)) {
      // Count HTML heading tags (h1-h6)
      const htmlHeadingMatches = content.match(/<h[1-6][^>]*>/gi)
      return htmlHeadingMatches ? htmlHeadingMatches.length : 0
    }

    // Detect Markdown content (has markdown heading syntax)
    if (/^#{1,6}\s+/m.test(content)) {
      // Count Markdown headings
      const markdownHeadingMatches = content.match(/^#{1,6}\s+/gm)
      return markdownHeadingMatches ? markdownHeadingMatches.length : 0
    }

    // Plain text heuristic: count lines that look like headings
    // Characteristics: short lines (< 80 chars), title case, not ending with punctuation
    const lines = content.split('\n')
    let headingCount = 0

    for (const line of lines) {
      const trimmed = line.trim()

      // Skip empty lines or very long lines
      if (!trimmed || trimmed.length > 80) continue

      // Skip lines ending with sentence punctuation (likely not headings)
      if (/[.!?,;:]$/.test(trimmed)) continue

      // Check if line starts with capital letter and is relatively short
      if (/^[A-Z]/.test(trimmed) && trimmed.length >= 10 && trimmed.length <= 80) {
        // Additional check: has at least one space (multi-word) or is all caps
        if (/\s/.test(trimmed) || trimmed === trimmed.toUpperCase()) {
          headingCount++
        }
      }
    }

    return headingCount
  }

  /**
   * Make API request to Frase with timeout and retry
   */
  private async makeAPIRequest(
    endpoint: string,
    body: any,
    retries: number = 2,
    timeoutMs: number = 30000
  ): Promise<any> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      // Create a new AbortController for each attempt
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'token': this.apiKey,  // Frase uses 'token' header, not 'Authorization: Bearer'
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          const errorMsg = `Frase API error (${response.status}): ${errorText}`

          // Retry on 5xx errors or rate limits
          if (response.status >= 500 || response.status === 429) {
            if (attempt < retries) {
              console.warn(`[Frase Agent] ${errorMsg}, retrying (${attempt + 1}/${retries})...`)
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
              continue
            }
          }

          throw new Error(errorMsg)
        }

        const data = await response.json()
        return data
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof Error && error.name === 'AbortError') {
          console.error(`[Frase Agent] Request timed out after ${timeoutMs}ms`)
          if (attempt < retries) {
            console.warn(`[Frase Agent] Retrying after timeout (${attempt + 1}/${retries})...`)
            continue
          }
          throw new Error(`Frase API request timed out after ${timeoutMs}ms`)
        }

        if (attempt < retries) {
          console.warn(`[Frase Agent] Request failed, retrying (${attempt + 1}/${retries}):`, error)
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
          continue
        }

        console.error('[Frase Agent] API request failed after retries:', error)
        throw error
      }
    }

    throw new Error('Frase API request failed after all retries')
  }

  /**
   * Get a Frase document by ID (for retrieving saved content briefs)
   */
  async getDocument(documentId: string, userId?: string): Promise<any> {
    console.log('[Frase Agent] Fetching document:', documentId)

    try {
      // Frase uses POST to /get_document_id with doc_id in body
      const endpoint = `${this.baseUrl}/get_document_id`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'token': this.apiKey,  // Frase uses 'token' header
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doc_id: documentId }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Frase API error (${response.status}): ${errorText}`)
      }

      const result = await response.json()
      console.log('[Frase Agent] Document retrieved successfully')
      return result
    } catch (error) {
      console.error('[Frase Agent] Error fetching document:', error)
      throw error
    }
  }
}
