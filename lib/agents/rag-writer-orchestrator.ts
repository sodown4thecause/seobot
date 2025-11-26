/**
 * RAG Writer + EEAT QA Feedback Loop Orchestrator
 * Implements the new content generation pipeline with DataForSEO scoring and Gateway-based QA
 */

import { EnhancedResearchAgent } from './enhanced-research-agent'
import { ContentWriterAgent } from './content-writer-agent'
import { DataForSEOScoringAgent } from './dataforseo-scoring-agent'
import { EEATQAAgent } from './eeat-qa-agent'
import { createClient } from '@/lib/supabase/server'
import { QUALITY_THRESHOLDS, shouldTriggerRevision } from '@/lib/config/quality-thresholds'

export interface RAGWriterParams {
  type: 'blog_post' | 'article' | 'social_media' | 'landing_page'
  topic: string
  keywords: string[]
  tone?: string
  wordCount?: number
  userId?: string
  competitorUrls?: string[]
}

export interface RAGWriterResult {
  content: string
  contentId?: string
  contentVersionId?: string
  qualityScores: {
    dataforseo: number
    eeat: number
    depth: number
    factual: number
    overall: number
  }
  revisionCount: number
  qaReport: any
  metadata: {
    researchSummary?: string
    citations?: Array<{ url: string; title?: string }>
  }
}

export class RAGWriterOrchestrator {
  private researchAgent: EnhancedResearchAgent
  private writerAgent: ContentWriterAgent
  private scoringAgent: DataForSEOScoringAgent
  private qaAgent: EEATQAAgent

  constructor() {
    this.researchAgent = new EnhancedResearchAgent()
    this.writerAgent = new ContentWriterAgent()
    this.scoringAgent = new DataForSEOScoringAgent()
    this.qaAgent = new EEATQAAgent()
  }

  /**
   * Main orchestration method - implements the full RAG + EEAT feedback loop
   */
  async generateContent(params: RAGWriterParams): Promise<RAGWriterResult> {
    console.log('[RAG Writer Orchestrator] Starting content generation for:', params.topic)

    const supabase = await createClient()
    let contentId: string | undefined
    let contentVersionId: string | undefined
    let revisionRound = 0

    try {
      // Step 1: Research Phase (Perplexity + RAG + DataForSEO)
      console.log('[Orchestrator] Phase 1: Research')
      const researchResult = await this.researchAgent.research({
        topic: params.topic,
        targetKeyword: params.keywords[0] || params.topic,
        depth: 'standard',
        competitorUrls: params.competitorUrls,
        languageCode: 'en', // TODO: Get from user preferences
        location: 'United States', // TODO: Get from user preferences
        userId: params.userId,
      })

      // Step 2: Initial Draft
      console.log('[Orchestrator] Phase 2: Initial Draft')
      let currentDraft = await this.writerAgent.write({
        type: params.type,
        topic: params.topic,
        keywords: params.keywords,
        tone: params.tone,
        wordCount: params.wordCount,
        researchContext: researchResult.combinedSummary,
        userId: params.userId,
      })

      // Create content record in Supabase
      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .insert({
          user_id: params.userId,
          title: params.topic,
          slug: this.generateSlug(params.topic),
          content_type: params.type,
          target_keyword: params.keywords[0] || params.topic,
          word_count: currentDraft.content.split(/\s+/).length,
          status: 'draft',
        })
        .select()
        .single()

      if (contentError) {
        console.error('[Orchestrator] Error creating content record:', contentError)
        // Continue without contentId - we'll skip version tracking but still generate content
      } else {
        contentId = contentData.id

        // Create initial content version only if content was created successfully
        const { data: versionData, error: versionError } = await supabase
          .from('content_versions')
          .insert({
            content_id: contentId,
            content_markdown: currentDraft.content,
            version_number: 1,
            created_by: params.userId,
          })
          .select()
          .single()

        if (versionError) {
          console.error('[Orchestrator] Error creating content version:', versionError)
          // Continue without version tracking
        } else {
          contentVersionId = versionData.id
        }
      }

      // Step 3-5: Scoring, QA, and Revision Loop
      let finalScores: any = {}
      let finalQAReport: any = {}
      let bestDraft = currentDraft.content

      while (revisionRound <= QUALITY_THRESHOLDS.MAX_REVISION_ROUNDS) {
        console.log(`[Orchestrator] Phase 3-5: Scoring + QA (Round ${revisionRound + 1})`)

        // Step 3: DataForSEO Scoring
        const scoringResult = await this.scoringAgent.analyzeContent({
          content: currentDraft.content,
          targetKeyword: params.keywords[0] || params.topic,
          contentUrl: params.competitorUrls?.[0], // Pass a URL if available for on-page analysis
          userId: params.userId,
        })

        // Step 4: EEAT QA Review
        const qaResult = await this.qaAgent.reviewContent({
          draft: currentDraft.content,
          dataforseoSummary: scoringResult.dataforseoRaw,
          competitors: researchResult.competitorSnippets.map(c => ({
            url: c.url,
            title: c.title,
            snippet: c.snippet,
            wordCount: c.wordCount,
            sections: c.sections,
          })),
          researchDocs: researchResult.ragContext,
          targetKeyword: params.keywords[0] || params.topic,
          topic: params.topic,
          searchIntent: researchResult.searchIntent,
          serpData: researchResult.serpData,
          userId: params.userId,
        })

        // Store quality review
        const overallScore = this.calculateOverallScore(
          scoringResult.dataforseoQualityScore,
          qaResult.qaReport.eeat_score,
          qaResult.qaReport.depth_score,
          qaResult.qaReport.factual_score
        )

        finalScores = {
          dataforseo: scoringResult.dataforseoQualityScore,
          eeat: qaResult.qaReport.eeat_score,
          depth: qaResult.qaReport.depth_score,
          factual: qaResult.qaReport.factual_score,
          overall: overallScore,
        }

        finalQAReport = qaResult.qaReport

        // Store quality review in Supabase
        if (contentId) {
          await supabase
            .from('content_quality_reviews')
            .insert({
              content_id: contentId,
              content_version_id: contentVersionId,
              user_id: params.userId,
              dataforseo_raw: scoringResult.dataforseoRaw,
              dataforseo_quality_score: scoringResult.dataforseoQualityScore,
              eeat_score: qaResult.qaReport.eeat_score,
              depth_score: qaResult.qaReport.depth_score,
              factual_score: qaResult.qaReport.factual_score,
              overall_quality_score: overallScore,
              qa_report: qaResult.qaReport,
              revision_round: revisionRound,
              status: 'pending',
            })
        }

        // Step 5: Check if revision is needed
        const needsRevision = shouldTriggerRevision(finalScores)

        if (!needsRevision || revisionRound >= QUALITY_THRESHOLDS.MAX_REVISION_ROUNDS) {
          console.log('[Orchestrator] ✓ Quality thresholds met or max revisions reached')
          
          // Update status to passed if thresholds met
          if (!needsRevision && contentId) {
            await supabase
              .from('content_quality_reviews')
              .update({ status: 'passed' })
              .eq('content_id', contentId)
              .eq('revision_round', revisionRound)
          }

          break
        }

        // Trigger revision
        console.log(`[Orchestrator] Triggering revision (Round ${revisionRound + 1})`)
        revisionRound++

        const revisedDraft = await this.writerAgent.write({
          type: params.type,
          topic: params.topic,
          keywords: params.keywords,
          tone: params.tone,
          wordCount: params.wordCount,
          researchContext: researchResult.combinedSummary,
          userId: params.userId,
          previousDraft: currentDraft.content,
          improvementInstructions: qaResult.qaReport.improvement_instructions,
          dataforseoMetrics: scoringResult.metrics,
          qaReport: qaResult.qaReport,
          revisionRound,
        })

        currentDraft = revisedDraft
        bestDraft = revisedDraft.content

        // Create new content version (only if contentId exists)
        if (contentId) {
          const { data: newVersion, error: versionError } = await supabase
            .from('content_versions')
            .insert({
              content_id: contentId,
              content_markdown: revisedDraft.content,
              version_number: revisionRound + 1,
              created_by: params.userId,
            })
            .select()
            .single()

          if (versionError) {
            console.error(`[Orchestrator] Error creating content version (round ${revisionRound + 1}):`, versionError)
          } else if (newVersion) {
            contentVersionId = newVersion.id
          }
        }
      }

      console.log('[Orchestrator] ✓ Content generation complete')
      console.log(`[Orchestrator] Final scores - Overall: ${finalScores.overall}, Revisions: ${revisionRound}`)

      return {
        content: bestDraft,
        contentId,
        contentVersionId,
        qualityScores: finalScores,
        revisionCount: revisionRound,
        qaReport: finalQAReport,
        metadata: {
          researchSummary: researchResult.combinedSummary,
          citations: researchResult.citations,
        },
      }
    } catch (error) {
      console.error('[Orchestrator] Error in content generation:', error)
      throw error
    }
  }

  /**
   * Calculate overall weighted quality score
   */
  private calculateOverallScore(
    dataforseo: number,
    eeat: number,
    depth: number,
    factual: number
  ): number {
    const weights = QUALITY_THRESHOLDS.SCORING_WEIGHTS
    return Math.round(
      dataforseo * weights.dataforseo +
      eeat * weights.eeat +
      depth * weights.depth +
      factual * weights.factual
    )
  }

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100)
  }
}

