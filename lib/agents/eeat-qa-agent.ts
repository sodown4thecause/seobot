/**
 * EEAT QA Review Agent
 * Uses Vercel AI Gateway to review content for EEAT signals, depth, and factual accuracy
 */

import { generateObject } from 'ai'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import { z } from 'zod'
import type { GatewayModelId } from '@ai-sdk/gateway'

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
  userId?: string // For usage logging
}

export interface EEATQAResult {
  qaReport: QAReport
  overallScore: number
}

export class EEATQAAgent {
  /**
   * Review content for EEAT signals, depth, and factual accuracy
   */
  async reviewContent(params: EEATQAParams): Promise<EEATQAResult> {
    console.log('[EEAT QA Agent] Reviewing content for:', params.topic)

    try {
      const systemPrompt = this.buildSystemPrompt()
      const userPrompt = this.buildReviewPrompt(params)

      const { object: qaReport, usage } = await generateObject({
        model: vercelGateway.languageModel('anthropic/claude-sonnet-4' as GatewayModelId),
        schema: QA_REPORT_SCHEMA,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.3, // Lower temperature for more consistent scoring
      })

      // Log usage
      if (params.userId) {
        try {
          const { logAIUsage } = await import('@/lib/analytics/usage-logger');
          await logAIUsage({
            userId: params.userId,
            agentType: 'eeat_qa',
            model: 'anthropic/claude-sonnet-4',
            promptTokens: usage?.promptTokens || 0,
            completionTokens: usage?.completionTokens || 0,
            metadata: {
              topic: params.topic,
            },
          });
        } catch (error) {
          console.error('[EEAT QA Agent] Error logging usage:', error);
        }
      }

      // Calculate overall weighted score
      const overallScore = this.calculateOverallScore(qaReport)

      console.log('[EEAT QA Agent] ✓ Review complete')
      console.log(`[EEAT QA Agent] Scores - EEAT: ${qaReport.eeat_score}, Depth: ${qaReport.depth_score}, Factual: ${qaReport.factual_score}, Overall: ${overallScore}`)

      return {
        qaReport,
        overallScore,
      }
    } catch (error) {
      console.error('[EEAT QA Agent] Error reviewing content:', error)
      
      // Return default scores on error
      return {
        qaReport: {
          eeat_score: 50,
          depth_score: 50,
          factual_score: 50,
          improvement_instructions: ['Error during QA review. Manual review recommended.'],
          missing_citations: [],
          competitor_gaps: [],
          eeat_signals: {
            citations: 0,
            data_backed_claims: 0,
            author_credentials: false,
            on_page_signals: [],
          },
        },
        overallScore: 50,
      }
    }
  }

  private buildSystemPrompt(): string {
    return `You are an expert content quality reviewer specializing in EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) evaluation for SEO content.

Your role is to:
1. Evaluate EEAT signals: citations, data-backed claims, author credentials, on-page trust signals
2. Compare content depth against top-ranking competitors
3. Validate factual claims and identify missing citations
4. Provide specific, actionable improvement instructions

Scoring Guidelines:
- EEAT Score (0-100): Based on presence of citations, author credentials, data-backed claims, and trust signals
- Depth Score (0-100): Compare topic coverage, section depth, examples, FAQs vs competitors
- Factual Score (0-100): Assess accuracy, citation quality, and factual rigor

Be thorough but fair. Provide constructive feedback that helps improve content quality.`
  }

  private buildReviewPrompt(params: EEATQAParams): string {
    const competitorInfo = params.competitors.map((comp, i) => {
      return `${i + 1}. ${comp.title} (${comp.url})
   - Word count: ${comp.wordCount || 'unknown'}
   - Sections: ${comp.sections?.join(', ') || 'unknown'}
   - Snippet: ${comp.snippet || 'N/A'}`
    }).join('\n\n')

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

CONTENT TO REVIEW:
${params.draft}

DATAFORSEO ANALYSIS SUMMARY:
${JSON.stringify(params.dataforseoSummary, null, 2)}

TOP-RANKING COMPETITORS:
${competitorInfo}${serpInfo}

RESEARCH CONTEXT:
${researchContext}

Please:
1. Evaluate EEAT signals (citations, data, author credentials, trust signals)
2. Compare content depth vs competitors (what topics/sections are missing?)
3. Check if content matches the search intent (if provided)
4. Identify factual claims that need citations
5. Use SERP data to identify content gaps (People Also Ask, Related Searches)
6. Provide specific improvement instructions
7. Score each dimension (EEAT, depth, factual) on a 0-100 scale`
  }

  /**
   * Calculate overall weighted quality score
   */
  private calculateOverallScore(qaReport: QAReport): number {
    // Weighted average: EEAT 40%, Depth 35%, Factual 25%
    const overallScore = (
      qaReport.eeat_score * 0.4 +
      qaReport.depth_score * 0.35 +
      qaReport.factual_score * 0.25
    )

    return Math.round(overallScore)
  }
}

