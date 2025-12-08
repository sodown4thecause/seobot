/**
 * EEAT QA Review Agent
 * Uses Vercel AI Gateway to review content for EEAT signals, depth, and factual accuracy
 * Enhanced with objective metrics validation for accurate scoring
 */

import { generateObject } from 'ai'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import { z } from 'zod'
import type { GatewayModelId } from '@ai-sdk/gateway'
import { serverEnv } from '@/lib/config/env'
import { createTelemetryConfig } from '@/lib/observability/langfuse'

const QA_REPORT_SCHEMA = z.object({
  eeat_score: z.number().min(0).max(100).describe('EEAT score (0-100) based on Experience, Expertise, Authoritativeness, Trustworthiness'),
  depth_score: z.number().min(0).max(100).describe('Content depth score (0-100) comparing to top-ranking competitors'),
  factual_score: z.number().min(0).max(100).describe('Factual accuracy and citation quality score (0-100)'),
  improvement_instructions: z.array(z.string()).describe('Specific, actionable instructions for improving the content'),
  missing_citations: z.array(z.string()).describe('List of claims that need citations'),
  competitor_gaps: z.array(z.string()).describe('Topics or sections that top competitors cover but this content lacks'),
  eeat_signals: z.object({
    citations: z.number().min(0).describe('Number of citations found'),
    data_backed_claims: z.number().min(0).describe('Number of data-backed claims'),
    author_credentials: z.boolean().describe('Whether author credentials are present'),
    on_page_signals: z.array(z.string()).describe('On-page EEAT signals found'),
  }).describe('Detailed EEAT signal breakdown'),
})

export type QAReport = z.infer<typeof QA_REPORT_SCHEMA>

export interface EEATQAParams {
  draft: string
  dataforseoSummary: any
  competitors: Array<{
    url: string
    title: string
    snippet?: string
    wordCount?: number
    sections?: string[]
  }>
  researchDocs?: Array<{
    title: string
    content: string
  }>
  targetKeyword: string
  topic: string
  contentType?: string
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
  // Firecrawl competitor content for accurate comparison
  competitorContent?: Array<{
    url: string
    markdown: string
    wordCount: number
    headings: string[]
  }>
  userId?: string // For usage logging
  langfuseTraceId?: string // For grouping spans under a parent trace
  sessionId?: string // For Langfuse session tracking
}

export interface EEATQAResult {
  qaReport: QAReport
  overallScore: number
  objectiveMetrics: ObjectiveContentMetrics
}

// Objective metrics calculated from content analysis
export interface ObjectiveContentMetrics {
  wordCount: number
  citationCount: number
  hasAuthorBio: boolean
  headingCount: number
  dataPointCount: number
  statisticsCount: number
  faqSectionPresent: boolean
  avgSentenceLength: number
  readabilityScore: number
  competitorWordCountAvg?: number
  contentGapPercentage?: number
}

export class EEATQAAgent {
  /**
   * Review content for EEAT signals, depth, and factual accuracy
   */
  async reviewContent(params: EEATQAParams): Promise<EEATQAResult> {
    console.log('[EEAT QA Agent] Reviewing content for:', params.topic)

    try {
      // Step 1: Calculate objective metrics first
      const objectiveMetrics = this.calculateObjectiveMetrics(params.draft, params.competitorContent)
      console.log('[EEAT QA Agent] Objective metrics:', objectiveMetrics)

      // Step 2: Build prompts with objective metrics for calibration
      const systemPrompt = this.buildSystemPrompt(objectiveMetrics)
      const userPrompt = this.buildReviewPrompt(params, objectiveMetrics)

      const { object: qaReport, usage } = await generateObject({
        model: vercelGateway.languageModel('anthropic/claude-sonnet-4' as GatewayModelId),
        schema: QA_REPORT_SCHEMA,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.3, // Lower temperature for more consistent scoring
        experimental_telemetry: createTelemetryConfig('eeat-qa', {
          userId: params.userId,
          sessionId: params.sessionId,
          langfuseTraceId: params.langfuseTraceId,
          topic: params.topic,
          targetKeyword: params.targetKeyword,
          contentType: params.contentType || 'blog_post',
          contentLength: params.draft?.length || 0,
          hasCompetitors: !!params.competitors && params.competitors.length > 0,
          hasResearchDocs: !!params.researchDocs,
          objectiveWordCount: objectiveMetrics.wordCount,
          objectiveCitationCount: objectiveMetrics.citationCount,
          provider: 'anthropic',
          model: 'claude-sonnet-4',
        }),
      })

      // Log usage
      if (params.userId) {
        try {
          const { logAIUsage } = await import('@/lib/analytics/usage-logger');
          await logAIUsage({
            userId: params.userId,
            agentType: 'eeat_qa',
            model: 'anthropic/claude-sonnet-4',
            promptTokens: (usage as any)?.promptTokens || (usage as any)?.inputTokens || 0,
            completionTokens: (usage as any)?.completionTokens || (usage as any)?.outputTokens || 0,
            metadata: {
              topic: params.topic,
              objectiveMetrics,
            },
          });
        } catch (error) {
          console.error('[EEAT QA Agent] Error logging usage:', error);
        }
      }

      // Step 3: Validate and adjust LLM scores against objective metrics
      const adjustedReport = this.validateAndAdjustScores(qaReport, objectiveMetrics)

      // Step 4: Calculate overall weighted score
      const overallScore = this.calculateOverallScore(adjustedReport, objectiveMetrics)

      console.log('[EEAT QA Agent] ✓ Review complete')
      console.log(`[EEAT QA Agent] Scores - EEAT: ${adjustedReport.eeat_score}, Depth: ${adjustedReport.depth_score}, Factual: ${adjustedReport.factual_score}, Overall: ${overallScore}`)

      return {
        qaReport: adjustedReport,
        overallScore,
        objectiveMetrics,
      }
    } catch (error) {
      console.error('[EEAT QA Agent] Error reviewing content:', error)

      // Return default scores on error with calculated objective metrics
      const fallbackMetrics = this.calculateObjectiveMetrics(params.draft || '', params.competitorContent)

      return {
        qaReport: {
          eeat_score: 50,
          depth_score: 50,
          factual_score: 50,
          improvement_instructions: ['Error during QA review. Manual review recommended.'],
          missing_citations: [],
          competitor_gaps: [],
          eeat_signals: {
            citations: fallbackMetrics.citationCount,
            data_backed_claims: fallbackMetrics.dataPointCount,
            author_credentials: fallbackMetrics.hasAuthorBio,
            on_page_signals: [],
          },
        },
        overallScore: 50,
        objectiveMetrics: fallbackMetrics,
      }
    }
  }

  /**
   * Calculate objective metrics from content
   */
  private calculateObjectiveMetrics(
    content: string,
    competitorContent?: Array<{ wordCount: number; headings: string[] }>
  ): ObjectiveContentMetrics {
    const lowerContent = content.toLowerCase()
    const words = content.split(/\s+/).filter(w => w.length > 0)
    const wordCount = words.length

    // Count citations (markdown links, URLs, "according to", "source:", etc.)
    const markdownLinks = (content.match(/\[[^\]]+\]\([^)]+\)/g) || []).length
    const nakedUrls = (content.match(/https?:\/\/[^\s)]+/g) || []).length
    const attributions = (lowerContent.match(/according to|source:|cited in|study by|research by|report from|data from/g) || []).length
    const citationCount = markdownLinks + Math.max(0, nakedUrls - markdownLinks) + attributions

    // Check for author bio patterns
    const hasAuthorBio = /about the author|written by|author bio|by\s+[A-Z][a-z]+\s+[A-Z][a-z]+(?:,|\.|$)/i.test(content)

    // Count headings
    const headingCount = (content.match(/^#{1,6}\s+/gm) || []).length +
      (content.match(/<h[1-6][^>]*>/gi) || []).length

    // Count data points (numbers with context)
    const dataPointCount = (content.match(/\d+(?:\.\d+)?(?:%|\s*percent|million|billion|thousand)/gi) || []).length

    // Count statistics patterns
    const statisticsCount = (content.match(/\d+%|\d+\s*out of\s*\d+|average|median|mean|study found|research shows/gi) || []).length

    // Check for FAQ section
    const faqSectionPresent = /faq|frequently asked questions|common questions/i.test(content) ||
      (content.match(/\?\s*\n/g) || []).length >= 3

    // Calculate readability
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0

    // Simplified Flesch Reading Ease approximation
    const avgSyllables = this.estimateAverageSyllables(words)
    const readabilityScore = Math.max(0, Math.min(100, 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllables)))

    // Calculate competitor comparison
    let competitorWordCountAvg: number | undefined
    let contentGapPercentage: number | undefined

    if (competitorContent && competitorContent.length > 0) {
      competitorWordCountAvg = competitorContent.reduce((sum, c) => sum + c.wordCount, 0) / competitorContent.length

      // Calculate content gap based on word count difference
      if (competitorWordCountAvg > 0) {
        contentGapPercentage = Math.max(0, ((competitorWordCountAvg - wordCount) / competitorWordCountAvg) * 100)
      }
    }

    return {
      wordCount,
      citationCount,
      hasAuthorBio,
      headingCount,
      dataPointCount,
      statisticsCount,
      faqSectionPresent,
      avgSentenceLength,
      readabilityScore,
      competitorWordCountAvg,
      contentGapPercentage,
    }
  }

  private estimateAverageSyllables(words: string[]): number {
    if (words.length === 0) return 0

    let totalSyllables = 0
    for (const word of words) {
      const syllables = (word.toLowerCase().match(/[aeiouy]+/g) || []).length || 1
      totalSyllables += Math.max(1, syllables)
    }

    return totalSyllables / words.length
  }

  /**
   * Validate and adjust LLM scores against objective metrics
   */
  private validateAndAdjustScores(qaReport: QAReport, metrics: ObjectiveContentMetrics): QAReport {
    const adjusted = { ...qaReport }

    // Adjust EEAT score based on objective citation count
    // Rubric: 0 citations = max 50, 1-3 = max 65, 4-6 = max 80, 7+ = max 100
    let citationCeiling = 50
    if (metrics.citationCount >= 7) citationCeiling = 100
    else if (metrics.citationCount >= 4) citationCeiling = 80
    else if (metrics.citationCount >= 1) citationCeiling = 65

    if (adjusted.eeat_score > citationCeiling && metrics.citationCount < 4) {
      console.log(`[EEAT QA Agent] Adjusting EEAT score from ${adjusted.eeat_score} to ${citationCeiling} (low citations: ${metrics.citationCount})`)
      adjusted.eeat_score = citationCeiling
    }

    // Adjust depth score based on word count vs competitors
    if (metrics.competitorWordCountAvg && metrics.contentGapPercentage) {
      // If content is significantly shorter than competitors, cap depth score
      if (metrics.contentGapPercentage > 30) {
        const depthCeiling = Math.round(70 - (metrics.contentGapPercentage - 30) * 0.5)
        if (adjusted.depth_score > depthCeiling) {
          console.log(`[EEAT QA Agent] Adjusting depth score from ${adjusted.depth_score} to ${depthCeiling} (content gap: ${metrics.contentGapPercentage.toFixed(1)}%)`)
          adjusted.depth_score = Math.max(40, depthCeiling)
        }
      }
    }

    // Adjust factual score based on data points
    // Rubric: 0 data points = max 50, 1-3 = max 70, 4-7 = max 85, 8+ = max 100
    let factualCeiling = 50
    if (metrics.dataPointCount >= 8) factualCeiling = 100
    else if (metrics.dataPointCount >= 4) factualCeiling = 85
    else if (metrics.dataPointCount >= 1) factualCeiling = 70

    if (adjusted.factual_score > factualCeiling && metrics.dataPointCount < 4) {
      console.log(`[EEAT QA Agent] Adjusting factual score from ${adjusted.factual_score} to ${factualCeiling} (low data points: ${metrics.dataPointCount})`)
      adjusted.factual_score = factualCeiling
    }

    // Ensure eeat_signals matches objective counts
    adjusted.eeat_signals = {
      ...adjusted.eeat_signals,
      citations: metrics.citationCount,
      data_backed_claims: metrics.dataPointCount + metrics.statisticsCount,
      author_credentials: metrics.hasAuthorBio,
    }

    return adjusted
  }

  private buildSystemPrompt(metrics: ObjectiveContentMetrics): string {
    return `You are an expert content quality reviewer specializing in EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) evaluation for SEO content.

Your role is to:
1. Evaluate EEAT signals: citations, data-backed claims, author credentials, on-page trust signals
2. Compare content depth against top-ranking competitors
3. Validate factual claims and identify missing citations
4. Provide specific, actionable improvement instructions

OBJECTIVE METRICS (Pre-calculated - use for calibration):
- Word Count: ${metrics.wordCount}
- Citation Count: ${metrics.citationCount}
- Data Points: ${metrics.dataPointCount}
- Statistics: ${metrics.statisticsCount}
- Headings: ${metrics.headingCount}
- Has Author Bio: ${metrics.hasAuthorBio}
- FAQ Section: ${metrics.faqSectionPresent}
- Readability Score: ${metrics.readabilityScore.toFixed(1)}
${metrics.competitorWordCountAvg ? `- Competitor Avg Word Count: ${Math.round(metrics.competitorWordCountAvg)}` : ''}
${metrics.contentGapPercentage !== undefined ? `- Content Gap vs Competitors: ${metrics.contentGapPercentage.toFixed(1)}%` : ''}

SCORING RUBRICS (Be strict and consistent):

EEAT Score (0-100):
- 85-100: 7+ citations, author credentials, multiple trust signals, expert voice
- 70-84: 4-6 citations, some trust signals, knowledgeable voice
- 55-69: 1-3 citations, minimal trust signals
- 40-54: No citations, generic voice
- Below 40: Low-quality, no EEAT signals

Depth Score (0-100):
- 85-100: Covers all competitor topics + unique insights, 2000+ words for blog
- 70-84: Covers most competitor topics, adequate length
- 55-69: Missing some key topics, shorter than competitors
- Below 55: Major content gaps, insufficient depth

Factual Score (0-100):
- 85-100: 8+ data points, all claims sourced, current information
- 70-84: 4-7 data points, most claims supported
- 55-69: 1-3 data points, some unsupported claims
- Below 55: No data, many unverified claims

Be thorough but fair. Your scores MUST align with objective metrics. If citation count is 0, EEAT cannot exceed 50.`
  }

  private buildReviewPrompt(params: EEATQAParams, metrics: ObjectiveContentMetrics): string {
    const competitorInfo = params.competitors.map((comp, i) => {
      return `${i + 1}. ${comp.title} (${comp.url})
   - Word count: ${comp.wordCount || 'unknown'}
   - Sections: ${comp.sections?.join(', ') || 'unknown'}
   - Snippet: ${comp.snippet || 'N/A'}`
    }).join('\n\n')

    // Add scraped competitor analysis if available
    let scrapedCompetitorInfo = ''
    if (params.competitorContent && params.competitorContent.length > 0) {
      scrapedCompetitorInfo = `\nSCRAPED COMPETITOR CONTENT ANALYSIS:
${params.competitorContent.map((comp, i) => `
${i + 1}. ${comp.url}
   - Word Count: ${comp.wordCount}
   - Headings: ${comp.headings.slice(0, 8).join(' | ')}
`).join('')}`
    }

    const researchContext = params.researchDocs?.map((doc, i) => {
      return `${i + 1}. ${doc.title}\n${doc.content.substring(0, 500)}...`
    }).join('\n\n') || 'No research documents provided.'

    let searchIntentInfo = ''
    if (params.searchIntent) {
      searchIntentInfo = `\nSEARCH INTENT ANALYSIS:
Primary Intent: ${params.searchIntent.intent} (${(params.searchIntent.probability * 100).toFixed(1)}% confidence)
${params.searchIntent.alternativeIntents ? `Alternative Intents: ${params.searchIntent.alternativeIntents.map(alt => `${alt.intent} (${(alt.probability * 100).toFixed(1)}%)`).join(', ')}` : ''}

The content should match this search intent. If it doesn't, this is a critical issue.`
    }

    let serpInfo = ''
    if (params.serpData) {
      serpInfo = `\nSERP ANALYSIS:
Top Ranking Results:
${params.serpData.topResults.slice(0, 5).map((r, i) => `${i + 1}. ${r.title} - ${r.snippet.substring(0, 150)}...`).join('\n')}

${params.serpData.peopleAlsoAsk && params.serpData.peopleAlsoAsk.length > 0 ? `People Also Ask:\n${params.serpData.peopleAlsoAsk.slice(0, 5).map((q, i) => `${i + 1}. ${q}`).join('\n')}\n` : ''}
${params.serpData.relatedSearches && params.serpData.relatedSearches.length > 0 ? `Related Searches: ${params.serpData.relatedSearches.slice(0, 8).join(', ')}\n` : ''}

Use this SERP data to identify content gaps and ensure the content addresses what users are actually searching for.`
    }

    return `Review the following content for EEAT signals, content depth, and factual accuracy.

TARGET KEYWORD: ${params.targetKeyword}
TOPIC: ${params.topic}${searchIntentInfo}

OBJECTIVE METRICS SUMMARY:
- This content has ${metrics.citationCount} citations
- This content has ${metrics.dataPointCount} data points
- Word count: ${metrics.wordCount}
- Author bio present: ${metrics.hasAuthorBio}
${metrics.competitorWordCountAvg ? `- Competitor average: ${Math.round(metrics.competitorWordCountAvg)} words` : ''}

CONTENT TO REVIEW:
${params.draft}

DATAFORSEO ANALYSIS SUMMARY:
${JSON.stringify(params.dataforseoSummary, null, 2)}

TOP-RANKING COMPETITORS:
${competitorInfo}${scrapedCompetitorInfo}${serpInfo}

RESEARCH CONTEXT:
${researchContext}

Please:
1. Evaluate EEAT signals (your citation count MUST match ${metrics.citationCount})
2. Compare content depth vs competitors (they average ${metrics.competitorWordCountAvg ? Math.round(metrics.competitorWordCountAvg) : 'unknown'} words)
3. Check if content matches the search intent (if provided)
4. Identify factual claims that need citations
5. Use SERP data to identify content gaps (People Also Ask, Related Searches)
6. Provide specific improvement instructions
7. Score each dimension strictly per the rubrics`
  }

  /**
   * Calculate overall weighted quality score
   */
  private calculateOverallScore(qaReport: QAReport, metrics: ObjectiveContentMetrics): number {
    // Weighted average: EEAT 40%, Depth 35%, Factual 25%
    let overallScore = (
      qaReport.eeat_score * 0.4 +
      qaReport.depth_score * 0.35 +
      qaReport.factual_score * 0.25
    )

    // Bonus for having author credentials (+3)
    if (metrics.hasAuthorBio) {
      overallScore += 3
    }

    // Bonus for FAQ section (+2)
    if (metrics.faqSectionPresent) {
      overallScore += 2
    }

    // Penalty for very short content (<1500 words for blog)
    if (metrics.wordCount < 1500) {
      overallScore -= 5
    }

    return Math.max(0, Math.min(100, Math.round(overallScore)))
  }
}
