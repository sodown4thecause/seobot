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
import { getLangWatchClient } from '@/lib/observability/langwatch'
import { EVALUATION_SCHEMAS } from '@/lib/observability/evaluation-schemas'
import { createIdGenerator } from 'ai'
import { startActiveObservation, updateActiveTrace } from '@langfuse/tracing'

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
  private langWatch = getLangWatchClient()
  private traceIdGenerator = createIdGenerator()

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
    const traceId = this.traceIdGenerator()
    let contentId: string | undefined
    let contentVersionId: string | undefined
    let revisionRound = 0

    // Create Langfuse observation for full orchestration trace
    return await startActiveObservation('rag-writer-orchestrator', async (span) => {
      // Set initial trace context
      updateActiveTrace({
        name: 'rag-content-generation',
        userId: params.userId || undefined,
        input: {
          topic: params.topic,
          type: params.type,
          keywords: params.keywords,
          tone: params.tone,
          wordCount: params.wordCount,
        },
        metadata: {
          contentType: params.type,
          keywords: params.keywords.join(', '),
          tone: params.tone,
          wordCount: params.wordCount,
        },
      });

      span.update({
        input: {
          topic: params.topic,
          type: params.type,
          keywords: params.keywords,
          tone: params.tone,
          wordCount: params.wordCount,
        },
      });

      // Log trace start to LangWatch (for backward compatibility)
      await this.langWatch.logTrace({
        traceId,
        agent: 'rag-writer-orchestrator',
        model: 'multi-agent',
        telemetry: {
          topic: params.topic,
          contentType: params.type,
          keywords: params.keywords,
          userId: params.userId,
        },
        metadata: {
          startTime: new Date().toISOString(),
        },
      });

      try {
      // Step 1: Research Phase (Perplexity + RAG + DataForSEO)
      console.log('[Orchestrator] Phase 1: Research')
      const researchTraceId = this.traceIdGenerator()
      await this.langWatch.logTrace({
        traceId: researchTraceId,
        agent: 'enhanced-research',
        model: 'perplexity',
        telemetry: {
          topic: params.topic,
          targetKeyword: params.keywords[0] || params.topic,
        },
      })

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
      const writerTraceId = this.traceIdGenerator()
      await this.langWatch.logTrace({
        traceId: writerTraceId,
        agent: 'content-writer',
        model: 'gemini-2.0-flash',
        telemetry: {
          contentType: params.type,
          topic: params.topic,
          wordCount: params.wordCount,
        },
      })

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
        throw new Error(`Failed to create content record: ${contentError.message}`)
      }

      contentId = contentData.id

      // Create initial content version
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
        throw new Error(`Failed to create content version: ${versionError.message}`)
      }

      contentVersionId = versionData.id

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
          contentType: params.type,
          searchIntent: researchResult.searchIntent,
          serpData: researchResult.serpData,
          competitorContent: researchResult.competitorContent, // Firecrawl scraped content
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

        // Evaluate content with LangWatch LLM-as-a-judge
        // Wrap in try-catch so evaluation failures don't break the main flow
        let eeatEvaluation: any = { passed: true, scores: {}, evaluationId: EVALUATION_SCHEMAS.EEAT }
        let contentQualityEvaluation: any = { passed: true, scores: {}, evaluationId: EVALUATION_SCHEMAS.CONTENT_QUALITY }

        try {
          // Run EEAT evaluation
          eeatEvaluation = await this.langWatch.evaluate({
            evaluationId: EVALUATION_SCHEMAS.EEAT,
            content: currentDraft.content,
            context: {
              userId: params.userId,
              topic: params.topic,
              contentType: params.type,
              revisionRound,
              contentId,
              contentVersionId,
            },
            scores: {
              eeat_score: qaResult.qaReport.eeat_score,
              depth_score: qaResult.qaReport.depth_score,
              factual_score: qaResult.qaReport.factual_score,
            },
            metadata: {
              traceId,
              dataforseoRaw: scoringResult.dataforseoRaw,
              qaReport: qaResult.qaReport,
            },
          })
        } catch (error) {
          console.error('[Orchestrator] LangWatch EEAT evaluation failed:', error)
          // Continue with default passed status
        }

        try {
          // Run Content Quality evaluation
          contentQualityEvaluation = await this.langWatch.evaluate({
            evaluationId: EVALUATION_SCHEMAS.CONTENT_QUALITY,
            content: currentDraft.content,
            context: {
              userId: params.userId,
              topic: params.topic,
              contentType: params.type,
              revisionRound,
            },
            scores: {
              overall_score: overallScore,
              depth_score: qaResult.qaReport.depth_score,
              factual_score: qaResult.qaReport.factual_score,
            },
            metadata: {
              traceId,
              wordCount: currentDraft.content.split(/\s+/).length,
            },
          })
        } catch (error) {
          console.error('[Orchestrator] LangWatch Content Quality evaluation failed:', error)
          // Continue with default passed status
        }

        // Store quality review in Supabase with LangWatch evaluation results
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
              qa_report: {
                ...qaResult.qaReport,
                langwatch_evaluations: {
                  eeat: {
                    evaluationId: eeatEvaluation.evaluationId,
                    passed: eeatEvaluation.passed,
                    scores: eeatEvaluation.scores,
                    feedback: eeatEvaluation.feedback,
                  },
                  content_quality: {
                    evaluationId: contentQualityEvaluation.evaluationId,
                    passed: contentQualityEvaluation.passed,
                    scores: contentQualityEvaluation.scores,
                    feedback: contentQualityEvaluation.feedback,
                  },
                },
              },
              revision_round: revisionRound,
              status: eeatEvaluation.passed && contentQualityEvaluation.passed ? 'passed' : 'pending',
            })
        }

        // Step 5: Check if revision is needed
        // Use LangWatch evaluation results to determine if revision is needed
        const needsRevision = shouldTriggerRevision(finalScores) || 
          !eeatEvaluation.passed || 
          !contentQualityEvaluation.passed

        if (!needsRevision || revisionRound >= QUALITY_THRESHOLDS.MAX_REVISION_ROUNDS) {
          console.log('[Orchestrator] ✓ Quality thresholds met or max revisions reached')

          // Log final trace to LangWatch
          try {
            await this.langWatch.logTrace({
              traceId,
              agent: 'rag-writer-orchestrator',
              model: 'multi-agent',
              telemetry: {
                completed: true,
                revisionRounds: revisionRound,
                finalScores,
                evaluationsPassed: eeatEvaluation.passed && contentQualityEvaluation.passed,
              },
              metadata: {
                endTime: new Date().toISOString(),
                contentId,
                contentVersionId,
              },
            })
          } catch (error) {
            console.error('[Orchestrator] Failed to log final trace to LangWatch:', error)
          }

          // Update status to passed if thresholds met and evaluations passed
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

        const result = {
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
        };

        // Update trace with final output
        updateActiveTrace({
          output: {
            contentId,
            contentVersionId,
            qualityScores: finalScores,
            revisionCount: revisionRound,
            wordCount: bestDraft.split(/\s+/).length,
          },
        });

        span.update({
          output: {
            contentId,
            contentVersionId,
            qualityScores: finalScores,
            revisionCount: revisionRound,
            wordCount: bestDraft.split(/\s+/).length,
          },
        });

        return result;
      } catch (error) {
        console.error('[Orchestrator] Error in content generation:', error)
        
        // Update trace with error
        updateActiveTrace({
          output: {
            error: true,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        span.update({
          output: {
            error: true,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
          level: 'ERROR',
        });
        
        // Log error to LangWatch (for backward compatibility)
        try {
          await this.langWatch.logTrace({
            traceId,
            agent: 'rag-writer-orchestrator',
            model: 'multi-agent',
            telemetry: {
              error: true,
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            },
            metadata: {
              error: true,
              errorStack: error instanceof Error ? error.stack : undefined,
              topic: params.topic,
              userId: params.userId,
            },
          })
        } catch (langWatchError) {
          console.error('[Orchestrator] Failed to log error to LangWatch:', langWatchError)
        }
        
        throw error
      }
    });
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

