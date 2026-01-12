/**
 * Enhanced Research Agent
 * Combines Perplexity web research with Supabase RAG and Firecrawl competitor scraping
 */

import { searchWithPerplexity, type PerplexitySearchResult } from '@/lib/external-apis/perplexity'
import { retrieveAgentDocuments } from '@/lib/ai/content-rag'
import { mcpDataforseoTools } from '@/lib/mcp/dataforseo/index'
import { mcpFirecrawlTools } from '@/lib/mcp/firecrawl/index'
import { checkAborted } from '@/lib/agents/utils/abort-handler'

// Helper to execute MCP tools (they only need args, not the full AI SDK context)
// The execute function can return string | AsyncIterable<string> | PromiseLike<string>
const executeTool = async <T>(
  tool: { execute?: (args: T, ctx?: any) => string | AsyncIterable<string> | PromiseLike<string> },
  args: T
): Promise<string> => {
  if (!tool.execute) throw new Error('Tool does not have execute function')
  const result = tool.execute(args, { toolCallId: 'agent-exec', messages: [] })
  // Handle different return types
  if (typeof result === 'string') return result
  if ('then' in result) return await result
  // AsyncIterable - collect all chunks
  let collected = ''
  for await (const chunk of result) {
    collected += chunk
  }
  return collected
}

export interface EnhancedResearchParams {
  topic: string
  targetKeyword: string
  depth?: 'quick' | 'standard' | 'deep'
  competitorUrls?: string[]
  languageCode?: string
  location?: string
  userId?: string // For usage logging
  langfuseTraceId?: string // Optional: link to Langfuse trace
  sessionId?: string // Optional: link to session
  abortSignal?: AbortSignal // Optional: signal to abort the research
}

export interface EnhancedResearchResult {
  perplexityResearch: PerplexitySearchResult
  ragContext: Array<{
    title: string
    content: string
    similarity?: number
  }>
  combinedSummary: string
  citations: Array<{
    url: string
    title?: string
    domain?: string
  }>
  competitorSnippets: Array<{
    url: string
    title: string
    snippet?: string
    wordCount?: number
    sections?: string[]
  }>
  searchIntent?: {
    intent: 'informational' | 'navigational' | 'commercial' | 'transactional'
    probability: number
    alternativeIntents?: Array<{ intent: string; probability: number }>
  }
  serpData?: {
    topResults: Array<{
      title: string
      url: string
      snippet: string
      position: number
    }>
    peopleAlsoAsk?: string[]
    relatedSearches?: string[]
  }
  // Firecrawl scraped competitor content for deep analysis
  competitorContent?: Array<{
    url: string
    markdown: string
    wordCount: number
    headings: string[]
  }>
}

export class EnhancedResearchAgent {
  /**
   * Conduct comprehensive research using Perplexity + RAG + Firecrawl
   */
  async research(params: EnhancedResearchParams): Promise<EnhancedResearchResult> {
    console.log('[Enhanced Research] Researching:', params.topic)
    const { abortSignal } = params

    try {
      // Check abort before starting
      checkAborted(abortSignal, 'before research start')

      // Step 1: Detect search intent using DataForSEO
      let searchIntent: EnhancedResearchResult['searchIntent'] | undefined
      try {
        checkAborted(abortSignal, 'before search intent detection')
        const intentResult = await executeTool(mcpDataforseoTools.dataforseo_labs_search_intent, {
          keywords: [params.targetKeyword],
          language_code: params.languageCode || 'en',
        })

        const intentData = typeof intentResult === 'string' ? JSON.parse(intentResult) : intentResult
        if (intentData && Array.isArray(intentData) && intentData.length > 0) {
          const keywordData = intentData[0]
          searchIntent = {
            intent: keywordData.main_intent || 'informational',
            probability: keywordData.main_intent_probability || 0,
            alternativeIntents: keywordData.other_intents?.map((alt: any) => ({
              intent: alt.intent,
              probability: alt.probability || 0,
            })),
          }
          console.log('[Enhanced Research] Search intent detected:', searchIntent.intent, `(${(searchIntent.probability * 100).toFixed(1)}%)`)
        }
      } catch (error) {
        console.warn('[Enhanced Research] Search intent detection failed:', error)
      }

      // Step 2: Get SERP data for competitor analysis
      let serpData: EnhancedResearchResult['serpData'] | undefined
      try {
        checkAborted(abortSignal, 'before SERP analysis')
        const serpResult = await executeTool(mcpDataforseoTools.serp_organic_live_advanced, {
          keyword: params.targetKeyword,
          language_code: params.languageCode || 'en',
          location_name: params.location || 'United States',
          search_engine: 'google',
          depth: 10,
          max_crawl_pages: 1,
          device: 'desktop',
        })

        const serpParsed = typeof serpResult === 'string' ? JSON.parse(serpResult) : serpResult
        if (serpParsed && serpParsed.tasks && serpParsed.tasks[0]?.result) {
          const results = serpParsed.tasks[0].result[0]?.items || []
          serpData = {
            topResults: results.slice(0, 10).map((item: any, idx: number) => ({
              title: item.title || '',
              url: item.url || '',
              snippet: item.snippet || '',
              position: idx + 1,
            })),
            peopleAlsoAsk: serpParsed.tasks[0].result[0]?.people_also_ask?.map((paa: any) => paa.question) || [],
            relatedSearches: serpParsed.tasks[0].result[0]?.related_searches?.map((rs: any) => rs.keyword) || [],
          }
          console.log('[Enhanced Research] SERP data retrieved:', serpData.topResults.length, 'top results')
        }
      } catch (error) {
        console.warn('[Enhanced Research] SERP analysis failed:', error)
      }

      // Step 2.5: Scrape top competitor pages with Firecrawl for detailed analysis
      let competitorContent: Array<{ url: string; markdown: string; wordCount: number; headings: string[] }> = []
      if (serpData && serpData.topResults.length > 0) {
        checkAborted(abortSignal, 'before Firecrawl competitor scraping')
        console.log('[Enhanced Research] Scraping top 3 competitors with Firecrawl...')
        const topUrls = serpData.topResults.slice(0, 3).map(r => r.url)

        const scrapePromises = topUrls.map(async (url) => {
          try {
            const scrapeResult = await executeTool(mcpFirecrawlTools.firecrawl_scrape, {
              url,
              formats: ['markdown'] as const,
            })

            const scrapeParsed = typeof scrapeResult === 'string' ? JSON.parse(scrapeResult) : scrapeResult
            if (scrapeParsed && scrapeParsed.data?.markdown) {
              const markdown = scrapeParsed.data.markdown
              const words = markdown.split(/\s+/).filter((w: string) => w.length > 0)
              const headings = (markdown.match(/^#{1,3}\s+.+$/gm) || []).slice(0, 15)

              return {
                url,
                markdown: markdown.substring(0, 5000), // First 5000 chars for context
                wordCount: words.length,
                headings: headings.map((h: string) => h.replace(/^#+\s+/, '')),
              }
            }
          } catch (error) {
            console.warn(`[Enhanced Research] Failed to scrape ${url}:`, error)
          }
          return null
        })

        const results = await Promise.all(scrapePromises)
        competitorContent = results.filter((r): r is NonNullable<typeof r> => r !== null)
        console.log(`[Enhanced Research] Scraped ${competitorContent.length} competitor pages`)
      }

      // Step 3: Perplexity web research
      checkAborted(abortSignal, 'before Perplexity research')
      const perplexityQuery = this.buildPerplexityQuery(params, searchIntent)
      const perplexityResult = await searchWithPerplexity({
        query: perplexityQuery,
        searchRecencyFilter: 'month',
        returnCitations: true,
        model: params.depth === 'deep' ? 'sonar-reasoning-pro' : 'sonar-pro',
      })

      // Step 4: Retrieve RAG context from Supabase agent_documents
      checkAborted(abortSignal, 'before RAG retrieval')
      const ragDocs = await retrieveAgentDocuments(
        `${params.topic} ${params.targetKeyword}`,
        'content_writer',
        5 // Get top 5 relevant documents
      )

      // Step 5: Extract competitor snippets (combine SERP + Perplexity citations)
      checkAborted(abortSignal, 'before combining research')
      const competitorSnippets = this.extractCompetitorSnippets(
        perplexityResult.citations,
        params.competitorUrls,
        serpData
      )

      // Step 6: Combine research into summary (now includes competitor content)
      const combinedSummary = this.combineResearch(
        perplexityResult.answer,
        ragDocs,
        competitorSnippets,
        searchIntent,
        serpData,
        competitorContent
      )

      console.log('[Enhanced Research] ✓ Research complete')
      console.log(`[Enhanced Research] Found ${perplexityResult.citations.length} citations, ${ragDocs.length} RAG docs, ${competitorContent.length} scraped pages`)

      return {
        perplexityResearch: perplexityResult,
        ragContext: ragDocs.map(doc => ({
          title: doc.title || 'Untitled',
          content: doc.content || '',
          similarity: doc.similarity,
        })),
        combinedSummary,
        citations: perplexityResult.citations,
        competitorSnippets,
        searchIntent,
        serpData,
        competitorContent,
      }
    } catch (error) {
      console.error('[Enhanced Research] Error during research:', error)

      // Return fallback result
      return {
        perplexityResearch: {
          success: false,
          answer: `Research about ${params.topic}`,
          citations: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        ragContext: [],
        combinedSummary: `Research summary for ${params.topic}`,
        citations: [],
        competitorSnippets: [],
      }
    }
  }

  private buildPerplexityQuery(params: EnhancedResearchParams, searchIntent?: EnhancedResearchResult['searchIntent']): string {
    let query = `Research "${params.topic}" focusing on "${params.targetKeyword}". `

    // Add search intent context if available
    if (searchIntent) {
      query += `The search intent for this keyword is primarily ${searchIntent.intent} (${(searchIntent.probability * 100).toFixed(1)}% confidence). `
      query += `Tailor the research to match this intent. `
    }

    if (params.competitorUrls && params.competitorUrls.length > 0) {
      query += `Also analyze these competitor pages: ${params.competitorUrls.join(', ')}. `
    }

    query += `Provide:
1. Comprehensive overview of the topic
2. Key insights and current trends
3. Statistics and data points
4. Expert perspectives
5. Top-ranking content analysis
6. Content gaps and opportunities

Focus on information valuable for creating SEO/AEO optimized content.`

    return query
  }

  private extractCompetitorSnippets(
    citations: Array<{ url: string; title?: string; domain?: string }>,
    competitorUrls?: string[],
    serpData?: EnhancedResearchResult['serpData']
  ): Array<{ url: string; title: string; snippet?: string; wordCount?: number; sections?: string[] }> {
    const snippets: Array<{ url: string; title: string; snippet?: string; wordCount?: number; sections?: string[] }> = []

    // Add SERP top results as competitors
    if (serpData && serpData.topResults.length > 0) {
      serpData.topResults.slice(0, 5).forEach(result => {
        snippets.push({
          url: result.url,
          title: result.title,
          snippet: result.snippet,
        })
      })
    }

    // Add Perplexity citations if not already included
    citations.forEach(c => {
      if (!snippets.some(s => s.url === c.url)) {
        snippets.push({
          url: c.url,
          title: c.title || c.domain || 'Untitled',
        })
      }
    })

    // Filter by competitor URLs if specified
    if (competitorUrls && competitorUrls.length > 0) {
      return snippets.filter(s =>
        competitorUrls.some(url => s.url.includes(url))
      )
    }

    return snippets.slice(0, 10) // Return top 10 competitors
  }

  private combineResearch(
    perplexityAnswer: string,
    ragDocs: any[],
    competitorSnippets: Array<{ url: string; title: string; snippet?: string }>,
    searchIntent?: EnhancedResearchResult['searchIntent'],
    serpData?: EnhancedResearchResult['serpData'],
    competitorContent?: Array<{ url: string; markdown: string; wordCount: number; headings: string[] }>
  ): string {
    const parts: string[] = []

    // Add search intent context
    if (searchIntent) {
      parts.push('## Search Intent Analysis')
      parts.push(`Primary Intent: **${searchIntent.intent}** (${(searchIntent.probability * 100).toFixed(1)}% confidence)`)
      if (searchIntent.alternativeIntents && searchIntent.alternativeIntents.length > 0) {
        parts.push(`Alternative Intents: ${searchIntent.alternativeIntents.map(alt => `${alt.intent} (${(alt.probability * 100).toFixed(1)}%)`).join(', ')}`)
      }
      parts.push('')
    }

    parts.push('## Web Research Summary')
    parts.push(perplexityAnswer)
    parts.push('')

    if (ragDocs.length > 0) {
      parts.push('## SEO/AEO Best Practices (from knowledge base)')
      ragDocs.forEach((doc, i) => {
        parts.push(`\n### ${i + 1}. ${doc.title}`)
        parts.push(doc.content.substring(0, 500) + (doc.content.length > 500 ? '...' : ''))
      })
      parts.push('')
    }

    // Add detailed competitor content analysis from Firecrawl
    if (competitorContent && competitorContent.length > 0) {
      parts.push('## Competitor Content Analysis (Scraped)')
      competitorContent.forEach((comp, i) => {
        parts.push(`\n### ${i + 1}. Competitor Page`)
        parts.push(`- URL: ${comp.url}`)
        parts.push(`- Word Count: ${comp.wordCount}`)
        if (comp.headings.length > 0) {
          parts.push(`- Key Headings: ${comp.headings.slice(0, 8).join(' | ')}`)
        }
      })
      parts.push('')
    }

    if (competitorSnippets.length > 0) {
      parts.push('## Top-Ranking Competitors')
      competitorSnippets.forEach((comp, i) => {
        parts.push(`\n${i + 1}. **${comp.title}**`)
        parts.push(`   URL: ${comp.url}`)
        if (comp.snippet) {
          parts.push(`   Snippet: ${comp.snippet.substring(0, 200)}${comp.snippet.length > 200 ? '...' : ''}`)
        }
      })
      parts.push('')
    }

    // Add People Also Ask and Related Searches
    if (serpData) {
      if (serpData.peopleAlsoAsk && serpData.peopleAlsoAsk.length > 0) {
        parts.push('## People Also Ask')
        serpData.peopleAlsoAsk.slice(0, 5).forEach((question, i) => {
          parts.push(`${i + 1}. ${question}`)
        })
        parts.push('')
      }

      if (serpData.relatedSearches && serpData.relatedSearches.length > 0) {
        parts.push('## Related Searches')
        parts.push(serpData.relatedSearches.slice(0, 8).join(', '))
      }
    }

    return parts.join('\n')
  }
}
