/**
 * RAG Writer + EEAT QA Feedback Loop Orchestrator
 * Implements the new content generation pipeline with DataForSEO scoring and Gateway-based QA
 */

import { EnhancedResearchAgent } from './enhanced-research-agent'
import { ContentWriterAgent } from './content-writer-agent'
import { DataForSEOScoringAgent } from './dataforseo-scoring-agent'
import { EEATQAAgent } from './eeat-qa-agent'
import { SEOAEOSyntaxAgent } from './seo-aeo-syntax-agent'
import { FraseOptimizationAgent } from './frase-optimization-agent'
import { db } from '@/lib/db'
import { content } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { QUALITY_THRESHOLDS, shouldTriggerRevision } from '@/lib/config/quality-thresholds'
import { getLangWatchClient } from '@/lib/observability/langwatch'
import { EVALUATION_SCHEMAS } from '@/lib/observability/evaluation-schemas'
import { createIdGenerator } from 'ai'
import { startActiveObservation, updateActiveTrace } from '@langfuse/tracing'
import { storeAndLearn } from '@/lib/ai/learning-storage'
import { AbortError } from '@/lib/errors/types'
import { checkAborted } from '@/lib/agents/utils/abort-handler'

export interface ProgressUpdate {
  phase: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  message: string
  details?: string
}

export interface RAGWriterParams {
  type: 'blog_post' | 'article' | 'social_media' | 'landing_page'
  topic: string
  keywords: string[]
  tone?: string
  wordCount?: number
  userId?: string
  competitorUrls?: string[]
  onProgress?: (update: ProgressUpdate) => void | Promise<void>
  onProgressError?: (error: Error, update: ProgressUpdate) => void | Promise<void>
  abortSignal?: AbortSignal
  searchIntent?: string
}

export interface QualityScores {
  dataforseo: number
  eeat: number
  depth: number
  factual: number
  frase: number
  aeo?: number
  overall: number
}

export interface QAReport {
  eeat_score: number
  depth_score: number
  factual_score: number
  improvement_instructions?: string[]
  strengths?: string[]
  weaknesses?: string[]
  expertise_signals?: string[]
  trust_indicators?: string[]
}

export interface FraseOptimization {
  score: number
  contentBrief: Record<string, unknown>
  recommendations: {
    optimizationTips?: string[]
    missingTopics?: string[]
    missingQuestions?: string[]
    suggestedTopics?: string[]
  }
  searchIntent?: string
}

export interface ContentMetadata {
  researchSummary?: string
  citations?: Array<{ url: string; title?: string }>
  metaTitle?: string
  metaDescription?: string
  slug?: string
  directAnswer?: string
}

export interface RAGWriterResult {
  content: string
  contentId?: string
  contentVersionId?: string
  qualityScores: QualityScores
  revisionCount: number
  qaReport: QAReport
  fraseOptimization?: FraseOptimization
  metadata: ContentMetadata
}

export class RAGWriterOrchestrator {
  private researchAgent: EnhancedResearchAgent
  private writerAgent: ContentWriterAgent
  private scoringAgent: DataForSEOScoringAgent
  private qaAgent: EEATQAAgent
  private syntaxAgent: SEOAEOSyntaxAgent
  private fraseAgent: FraseOptimizationAgent
  private langWatch = getLangWatchClient()
  private traceIdGenerator = createIdGenerator()

  constructor() {
    this.researchAgent = new EnhancedResearchAgent()
    this.writerAgent = new ContentWriterAgent()
    this.scoringAgent = new DataForSEOScoringAgent()
    this.qaAgent = new EEATQAAgent()
    this.syntaxAgent = new SEOAEOSyntaxAgent()
    this.fraseAgent = new FraseOptimizationAgent()
  }

  /**
   * Helper to emit progress updates
   */
  private async emitProgress(
    params: RAGWriterParams,
    phase: string,
    status: ProgressUpdate['status'],
    message: string,
    details?: string
  ) {
    if (params.onProgress) {
      const update: ProgressUpdate = { phase, status, message, details }
      try {
        await params.onProgress(update)
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        console.warn('[RAG Writer Orchestrator] Progress callback error:', error)
        
        // Notify caller of callback error so they can handle it
        if (params.onProgressError) {
          try {
            await params.onProgressError(err, update)
          } catch (handlerError) {
            console.error('[RAG Writer Orchestrator] Progress error handler failed:', handlerError)
          }
        }
      }
    }
  }

  /**
   * Main orchestration method - implements the full RAG + EEAT feedback loop
   */
  async generateContent(params: RAGWriterParams): Promise<RAGWriterResult> {
    console.log('[RAG Writer Orchestrator] Starting content generation for:', params.topic)

    // Check abort signal immediately
    if (params.abortSignal?.aborted) {
      throw new AbortError('Content generation aborted by client')
    }

    const database = db
    const traceId = this.traceIdGenerator()
    // Use traceId as sessionId for content generation (one session per generation)
    const sessionId = `content-session-${traceId}`
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
          sessionId, // Include sessionId in trace metadata
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
        userId: params.userId, // Langfuse user tracking
        sessionId, // Langfuse session tracking
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
          // Abort signal reference for cleaner code
          const abortSignal = params.abortSignal

        // Step 0.5: Fetch user's business context for personalized content
        checkAborted(abortSignal, 'before user context fetch')
        let businessContext: { brandVoice?: any; profile?: any; context?: string } = {}
        if (params.userId) {
          try {
            const { getUserBusinessContext } = await import('@/lib/onboarding/user-context-service')
            const userContext = await getUserBusinessContext(params.userId)
            if (userContext.hasProfile) {
              businessContext = {
                brandVoice: userContext.brandVoice,
                profile: userContext.profile,
                context: userContext.context,
              }
              console.log(`[Orchestrator] ✓ Loaded business context - Industry: ${userContext.profile?.industry || 'N/A'}, Voice: ${userContext.brandVoice?.tone || 'N/A'}`)
            }
          } catch (error) {
            console.warn('[Orchestrator] Failed to load business context:', error)
          }
        }

        // Step 1: Research Phase (Perplexity + RAG + DataForSEO)
        console.log('[Orchestrator] Phase 1: Research')
        checkAborted(abortSignal, 'before research phase')
        await this.emitProgress(params, 'research', 'in_progress', 'Researching topic and analyzing competitors...', 'Using Perplexity AI, RAG, and DataForSEO')
        const researchTraceId = this.traceIdGenerator()

        await this.langWatch.logTrace({
          traceId: researchTraceId,
          agent: 'enhanced-research',
          model: 'perplexity',
          userId: params.userId, // Langfuse user tracking
          sessionId, // Langfuse session tracking
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
          langfuseTraceId: traceId, // Link to parent trace
          sessionId, // Link to session
          abortSignal: params.abortSignal,
        })
        await this.emitProgress(params, 'research', 'completed', 'Research complete', `Found ${researchResult.competitorSnippets?.length || 0} competitors`)

        // Step 1.5: Frase Content Brief Generation (SEO/AEO Optimization)
        console.log('[Orchestrator] Phase 1.5: Frase Content Brief')
        await this.emitProgress(params, 'frase-brief', 'in_progress', 'Generating SEO content brief...', 'Analyzing SERP with Frase.io')
        let fraseOptimizationResult: any = null
        let fraseContentBrief = ''

        try {
          const fraseTraceId = this.traceIdGenerator()
          await this.langWatch.logTrace({
            traceId: fraseTraceId,
            agent: 'frase-optimization',
            model: 'frase-api',
            userId: params.userId,
            sessionId,
            telemetry: {
              topic: params.topic,
              targetKeyword: params.keywords[0] || params.topic,
            },
          })

          fraseOptimizationResult = await this.fraseAgent.optimizeContent({
            targetKeyword: params.keywords[0] || params.topic,
            competitorUrls: params.competitorUrls || (researchResult.competitorSnippets?.length ? researchResult.competitorSnippets.map(c => c.url) : []),
            language: 'en',
            country: 'us',
            userId: params.userId,
            contentType: params.type,
            abortSignal: params.abortSignal,
          })

          // Create a comprehensive content brief from Frase results
          fraseContentBrief = this.formatFraseContentBrief(fraseOptimizationResult)

          console.log(`[Orchestrator] ✓ Frase brief generated - Search Intent: ${fraseOptimizationResult.searchIntent}, Topics: ${fraseOptimizationResult.contentBrief.topicClusters?.length || 0}`)
          await this.emitProgress(params, 'frase-brief', 'completed', 'SEO brief ready', `${fraseOptimizationResult.contentBrief.topicClusters?.length || 0} topics identified`)
        } catch (fraseError) {
          console.error('[Orchestrator] Frase optimization failed, continuing without it:', fraseError)
          await this.emitProgress(params, 'frase-brief', 'completed', 'Skipped Frase analysis', 'Continuing without SERP analysis')
          // Continue without Frase if it fails - don't break the pipeline
        }

        // Step 2: Initial Draft
        console.log('[Orchestrator] Phase 2: Initial Draft')
        checkAborted(abortSignal, 'before initial draft')
        await this.emitProgress(params, 'writing', 'in_progress', 'Writing initial draft...', `Target: ${params.wordCount || 2000} words`)
        const writerTraceId = this.traceIdGenerator()
        await this.langWatch.logTrace({
          traceId: writerTraceId,
          agent: 'content-writer',
          model: 'gemini-2.0-flash',
          userId: params.userId, // Langfuse user tracking
          sessionId, // Langfuse session tracking
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
          fraseContentBrief, // Frase optimization guidance
          userId: params.userId,
          langfuseTraceId: traceId, // Link to parent trace
          sessionId, // Link to session
          // Brand voice from user's business context
          brandVoice: businessContext.brandVoice,
          industry: businessContext.profile?.industry,
          // Citation enforcement - only cite from verified sources
          allowedCitations: researchResult.citations,
          abortSignal: params.abortSignal,
        })
        await this.emitProgress(params, 'writing', 'completed', 'Initial draft complete', `${currentDraft.content.split(/\s+/).length} words written`)


        // Create content record in database
        // Validate userId before inserting
        if (!params.userId) {
          throw new Error('userId is required to create content record')
        }

        const [contentData] = await database.insert(content).values({
          userId: params.userId,
          title: params.topic,
          slug: this.generateSlug(params.topic),
          contentType: params.type,
          targetKeyword: params.keywords[0] || params.topic,
          wordCount: currentDraft.content.split(/\s+/).length,
          status: 'draft',
        }).returning()

        if (!contentData) {
          throw new Error('Failed to create content record')
        }

        contentId = contentData.id
        contentVersionId = contentData.id // Use same ID for now

        // Step 2.5: SEO/AEO Syntax Optimization
        console.log('[Orchestrator] Phase 2.5: SEO/AEO Syntax Optimization')
        await this.emitProgress(params, 'syntax', 'in_progress', 'Optimizing SEO/AEO syntax...', 'Adding structured headings and meta tags')
        let syntaxMetadata: {
          metaTitle?: string
          metaDescription?: string
          slug?: string
          directAnswer?: string
        } = {}
        let aeoScore = 50 // Default AEO score (neutral fallback if syntax optimization fails)

        try {
          const syntaxResult = await this.syntaxAgent.optimize({
            content: currentDraft.content,
            primaryKeyword: params.keywords[0] || params.topic,
            secondaryKeywords: params.keywords.slice(1),
            contentType: params.type,
            userId: params.userId,
            langfuseTraceId: traceId, // Link to parent trace
            sessionId, // Link to session
            abortSignal: params.abortSignal,
          })

          // Use optimized content for subsequent phases
          currentDraft = {
            content: syntaxResult.formattedContent,
            metadata: currentDraft.metadata,
          }

          // Store syntax metadata for final result
          syntaxMetadata = {
            metaTitle: syntaxResult.metaTitle,
            metaDescription: syntaxResult.metaDescription,
            slug: syntaxResult.slug,
            directAnswer: syntaxResult.directAnswer,
          }

          // Calculate AEO compliance score from syntax report
          aeoScore = this.calculateAEOScore(syntaxResult.syntaxReport)

          console.log(`[Orchestrator] ✓ Syntax optimization complete - H1: ${syntaxResult.syntaxReport.h1Present}, Question H2: ${syntaxResult.syntaxReport.h2QuestionHeading}, AEO Score: ${aeoScore}`)
          await this.emitProgress(params, 'syntax', 'completed', 'Syntax optimization complete', `Meta tags optimized, AEO Score: ${aeoScore}`)
        } catch (syntaxError) {
          console.error('[Orchestrator] Syntax optimization failed, continuing with original draft:', syntaxError)
          await this.emitProgress(params, 'syntax', 'completed', 'Skipped syntax optimization', 'Continuing with original structure')
          // Continue with original draft if syntax optimization fails
        }

        // Step 3-5: Scoring, QA, and Revision Loop
        let finalScores: any = {}
        let finalQAReport: any = {}
        let finalFraseOptimization: any = null
        let bestDraft = currentDraft.content

        while (revisionRound <= QUALITY_THRESHOLDS.MAX_REVISION_ROUNDS) {
          console.log(`[Orchestrator] Phase 3-5: Scoring + QA + Frase (Round ${revisionRound + 1})`)
          checkAborted(abortSignal, `before scoring round ${revisionRound + 1}`)
          await this.emitProgress(params, 'scoring', 'in_progress', `Analyzing content quality (Round ${revisionRound + 1})...`, 'Running DataForSEO scoring')

          // Step 3: DataForSEO Scoring
          const scoringResult = await this.scoringAgent.analyzeContent({
            content: currentDraft.content,
            targetKeyword: params.keywords[0] || params.topic,
            contentUrl: params.competitorUrls?.[0], // Pass a URL if available for on-page analysis
            userId: params.userId,
            abortSignal: params.abortSignal,
          })

          // Step 4: EEAT QA Review
          await this.emitProgress(params, 'qa', 'in_progress', 'Running E-E-A-T quality review...', 'Analyzing expertise, experience, authority, trust')
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
            langfuseTraceId: traceId, // Link to parent trace
            sessionId, // Link to session
            abortSignal: params.abortSignal,
          })

          // Step 4.5: Frase Content Analysis (evaluate against SERP)
          await this.emitProgress(params, 'frase-analysis', 'in_progress', 'Analyzing SERP optimization...', 'Comparing against top-ranking content')
          let fraseContentAnalysis: any = null
          let fraseScore = 70 // Fallback score if Frase fails (aligned with quality thresholds)

          try {
            fraseContentAnalysis = await this.fraseAgent.optimizeContent({
              content: currentDraft.content, // Analyze the current draft
              targetKeyword: params.keywords[0] || params.topic,
              competitorUrls: params.competitorUrls || (researchResult.competitorSnippets?.length ? researchResult.competitorSnippets.map(c => c.url) : []),
              language: 'en',
              country: 'us',
              userId: params.userId,
              contentType: params.type,
              abortSignal: params.abortSignal,
            })

            fraseScore = fraseContentAnalysis.optimizationScore
            finalFraseOptimization = {
              score: fraseScore,
              contentBrief: fraseContentAnalysis.contentBrief,
              recommendations: fraseContentAnalysis.recommendations,
              searchIntent: fraseContentAnalysis.searchIntent,
            }

            console.log(`[Orchestrator] ✓ Frase content analysis - Score: ${fraseScore}, Missing Topics: ${fraseContentAnalysis.recommendations.missingTopics?.length || 0}`)
            await this.emitProgress(params, 'frase-analysis', 'completed', 'SERP analysis complete', `Optimization score: ${fraseScore}`)
          } catch (fraseError) {
            console.error('[Orchestrator] Frase content analysis failed:', fraseError)
            console.log(`[Orchestrator] Using fallback Frase score: ${fraseScore}`)

            // Set finalFraseOptimization with fallback score for downstream scoring
            finalFraseOptimization = {
              score: fraseScore,
              contentBrief: {},
              recommendations: {
                optimizationTips: ['Frase analysis unavailable - using neutral fallback score'],
              },
            }

            await this.emitProgress(params, 'frase-analysis', 'completed', 'Skipped SERP analysis', `Using fallback score: ${fraseScore}`)
          }

          // Store quality review
          const overallScore = this.calculateOverallScore(
            scoringResult.dataforseoQualityScore,
            qaResult.qaReport.eeat_score,
            qaResult.qaReport.depth_score,
            qaResult.qaReport.factual_score,
            aeoScore,
            fraseScore
          )

          finalScores = {
            dataforseo: scoringResult.dataforseoQualityScore,
            eeat: qaResult.qaReport.eeat_score,
            depth: qaResult.qaReport.depth_score,
            factual: qaResult.qaReport.factual_score,
            frase: fraseScore,
            aeo: aeoScore, // AEO compliance from syntax analysis
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
              userId: params.userId, // Langfuse user tracking
              sessionId, // Langfuse session tracking
              langfuseTraceId: traceId, // Link to parent trace
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

          // Store quality review in database metadata (using merge to preserve previous data)
          if (contentId) {
            await this.mergeContentMetadata(contentId, {
              qualityScores: finalScores,
              qaReport: finalQAReport,
              revisionRound,
              langwatchEvaluations: {
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
            })
          }

          // Step 5: Check if revision is needed
          // Use LangWatch evaluation results to determine if revision is needed
          const needsRevision = shouldTriggerRevision(finalScores) ||
            !eeatEvaluation.passed ||
            !contentQualityEvaluation.passed

          if (!needsRevision || revisionRound >= QUALITY_THRESHOLDS.MAX_REVISION_ROUNDS) {
            console.log('[Orchestrator] ? Quality thresholds met or max revisions reached')
            await this.emitProgress(params, 'complete', 'completed', 'Quality standards achieved', `Overall score: ${overallScore}, Revisions: ${revisionRound}`)

            // Log final trace to LangWatch
            try {
              await this.langWatch.logTrace({
                traceId,
                agent: 'rag-writer-orchestrator',
                model: 'multi-agent',
                userId: params.userId, // Langfuse user tracking
                sessionId, // Langfuse session tracking
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
              await database.update(content).set({ status: 'passed' }).where(eq(content.id, contentId))
            }

            break
          }

          // Trigger revision
          console.log(`[Orchestrator] Triggering revision (Round ${revisionRound + 1})`)
          await this.emitProgress(params, 'revision', 'in_progress', `Improving content (Revision ${revisionRound + 1})...`, `Current score: ${overallScore}, target: ${QUALITY_THRESHOLDS.MIN_OVERALL_SCORE}`)
          revisionRound++

          // Combine QA and Frase improvement instructions
          const combinedInstructions = [
            ...(qaResult.qaReport.improvement_instructions ?? []),
            ...(fraseContentAnalysis?.recommendations?.optimizationTips ?? []),
          ]

          // Add Frase-specific recommendations if available
          const missingTopics = fraseContentAnalysis?.recommendations?.missingTopics ?? []
          if (missingTopics.length > 0) {
            combinedInstructions.push(
              `Cover these missing topics: ${missingTopics.slice(0, 5).join(', ')}`
            )
          }
          const missingQuestions = fraseContentAnalysis?.recommendations?.missingQuestions ?? []
          if (missingQuestions.length > 0) {
            combinedInstructions.push(
              `Answer these user questions: ${missingQuestions.slice(0, 3).join('; ')}`
            )
          }

          const revisedDraft = await this.writerAgent.write({
            type: params.type,
            topic: params.topic,
            keywords: params.keywords,
            tone: params.tone,
            wordCount: params.wordCount,
            researchContext: researchResult.combinedSummary,
            fraseContentBrief, // Continue using Frase brief for revisions
            userId: params.userId,
            langfuseTraceId: traceId, // Link to parent trace
            sessionId, // Link to session
            previousDraft: currentDraft.content,
            improvementInstructions: combinedInstructions,
            dataforseoMetrics: scoringResult.metrics,
            qaReport: qaResult.qaReport,
            revisionRound,
            // Maintain brand voice consistency across revisions
            brandVoice: businessContext.brandVoice,
            industry: businessContext.profile?.industry,
            // Citation enforcement - only cite from verified sources
            allowedCitations: researchResult.citations,
            abortSignal: params.abortSignal,
          })

          currentDraft = revisedDraft
          bestDraft = revisedDraft.content

          // Update content with revision (using merge to preserve quality scores)
          if (contentId) {
            await this.mergeContentMetadata(contentId, {
              revisionRound,
              lastRevision: new Date().toISOString(),
            })
          }
        }

        console.log('[Orchestrator] ? Content generation complete')
        console.log(`[Orchestrator] Final scores - Overall: ${finalScores.overall}, Revisions: ${revisionRound}`)
        await this.emitProgress(params, 'finished', 'completed', 'Content generation complete!', `Final score: ${finalScores.overall}, Word count: ${bestDraft.split(/\s+/).length}`)

        // Store learning for cross-user feedback loop
        // This enables future content to benefit from this generation's quality scores
        const isSuccessful = finalScores.overall >= QUALITY_THRESHOLDS.MIN_OVERALL_SCORE
        if (params.userId) {
          try {
            await storeAndLearn({
              userId: params.userId,
              contentType: params.type,
              topic: params.topic,
              keywords: params.keywords || [],
              aiDetectionScore: 100 - finalScores.eeat, // Invert EEAT score as proxy for AI detection
              humanProbability: finalScores.eeat, // EEAT score as proxy for human-like content
              techniques: [
                `EEAT: ${finalScores.eeat}`,
                `DataForSEO: ${finalScores.dataforseo}`,
                `Depth: ${finalScores.depth}`,
                `Factual: ${finalScores.factual}`,
                `AEO: ${finalScores.aeo}`,
                `Frase: ${finalScores.frase}`,
                `Revisions: ${revisionRound}`,
              ],
              successful: isSuccessful,
              feedback: finalQAReport.improvement_instructions?.join('; ') || null,
            })
            console.log(`[Orchestrator] 📚 Learning stored (successful: ${isSuccessful})`)
          } catch (learningError) {
            console.error('[Orchestrator] Failed to store learning:', learningError)
            // Don't fail the main flow if learning storage fails
          }
        }

        const result = {
          content: bestDraft,
          contentId,
          contentVersionId,
          qualityScores: finalScores,
          revisionCount: revisionRound,
          qaReport: finalQAReport,
          fraseOptimization: finalFraseOptimization,
          metadata: {
            researchSummary: researchResult.combinedSummary,
            citations: researchResult.citations,
            ...syntaxMetadata,
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
   * Calculate overall weighted quality score (including Frase)
   */
  private calculateOverallScore(
    dataforseo: number,
    eeat: number,
    depth: number,
    factual: number,
    aeo: number,
    frase: number = 50
  ): number {
    const weights = QUALITY_THRESHOLDS.SCORING_WEIGHTS
    // Adjust weights to accommodate Frase (reduce others proportionally by 15%)
    // Original weights: dataforseo: 25%, eeat: 40%, depth: 20%, factual: 15%
    const adjustedWeights = {
      dataforseo: weights.dataforseo * 0.85, // 17% (was 20%)
      eeat: weights.eeat * 0.85, // 29.75% (was 35%)
      depth: weights.depth * 0.85, // 12.75% (was 15%)
      factual: weights.factual * 0.85, // 12.75% (was 15%)
      aeo: weights.aeo * 0.85,
      frase: 0.15, // 15% - Frase SEO/AEO optimization score
    }

    return Math.round(
      dataforseo * adjustedWeights.dataforseo +
      eeat * adjustedWeights.eeat +
      depth * adjustedWeights.depth +
      factual * adjustedWeights.factual +
      aeo * adjustedWeights.aeo +
      frase * adjustedWeights.frase
    )
  }

  /**
   * Type guard to check if a value is a plain object (not null, array, Date, RegExp, etc.)
   * 
   * @param value - The value to check
   * @returns true if the value is a plain object, false otherwise
   */
  private isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || value === undefined) {
      return false
    }
    
    if (typeof value !== 'object') {
      return false
    }
    
    // Exclude arrays, Date, RegExp, and other special objects
    if (
      Array.isArray(value) ||
      value instanceof Date ||
      value instanceof RegExp
    ) {
      return false
    }
    
    return true
  }

  /**
   * Deep merge utility for nested objects
   * 
   * **Behavior:**
   * - Plain objects: Recursively merged (nested keys preserved)
   * - Arrays: Replaced entirely (not concatenated/merged)
   * - Primitives: Source value replaces target value
   * - Date objects: Cloned to new Date instance
   * - RegExp: Cloned to new RegExp instance
   * - null: Treated as a value (replaces target)
   * - undefined: Ignored (target value preserved)
   * 
   * **Use case:** Merging JSONB metadata from database where new values
   * should override old values, but unaffected nested keys should be preserved.
   * 
   * @example
   * deepMerge(
   *   { a: 1, b: { c: 2, d: 3 } },
   *   { b: { c: 99 } }
   * )
   * // Result: { a: 1, b: { c: 99, d: 3 } }
   */
  private deepMerge<T extends Record<string, unknown>>(
    target: T,
    source: Partial<T>
  ): T {
    const result = { ...target } as T

    for (const key in source) {
      const sourceVal = source[key]
      const targetVal = target[key]

      // Skip undefined values (preserve target)
      if (sourceVal === undefined) {
        continue
      }

      // Handle Date objects - clone to avoid reference sharing
      if (sourceVal instanceof Date) {
        result[key] = new Date(sourceVal.getTime()) as T[Extract<keyof T, string>]
        continue
      }

      // Handle RegExp objects - clone to avoid reference sharing
      if (sourceVal instanceof RegExp) {
        result[key] = new RegExp(sourceVal.source, sourceVal.flags) as T[Extract<keyof T, string>]
        continue
      }

      // Handle null explicitly (replaces target)
      if (sourceVal === null) {
        result[key] = null as T[Extract<keyof T, string>]
        continue
      }

      // Handle arrays (replace entirely, don't merge)
      if (Array.isArray(sourceVal)) {
        result[key] = sourceVal as T[Extract<keyof T, string>]
        continue
      }

      // Recursively merge plain objects
      if (
        typeof sourceVal === 'object' &&
        sourceVal !== null &&
        targetVal !== null &&
        typeof targetVal === 'object' &&
        !Array.isArray(targetVal) &&
        !(targetVal instanceof Date) &&
        !(targetVal instanceof RegExp)
      ) {
        result[key] = this.deepMerge(
          targetVal as Record<string, unknown>,
          sourceVal as Record<string, unknown>
        ) as T[Extract<keyof T, string>]
        continue
      }

      // Default: replace with source value (primitives, functions, etc.)
      result[key] = sourceVal as T[Extract<keyof T, string>]
    }

    return result
  }

  /**
   * Merge new metadata with existing, preserving previous data
   * Uses deep merge to properly handle nested objects like langwatchEvaluations
   */
  private async mergeContentMetadata(
    contentId: string,
    newMetadata: Record<string, unknown>
  ): Promise<void> {
    // Fetch existing metadata
    const existing = await db
      .select({ metadata: content.metadata })
      .from(content)
      .where(eq(content.id, contentId))
      .limit(1)

    const rawExistingMeta = existing[0]?.metadata
    
    // Ensure both existingMeta and newMetadata are plain objects before merging
    // If either is not a plain object, handle gracefully
    let existingMeta: Record<string, unknown>
    
    if (this.isPlainObject(rawExistingMeta)) {
      existingMeta = rawExistingMeta
    } else {
      // If existing metadata is not a plain object (null, array, primitive, etc.)
      // start with an empty object to avoid corruption
      console.warn('[RAGWriter] Existing metadata is not a plain object, starting fresh:', {
        contentId,
        type: rawExistingMeta === null ? 'null' : Array.isArray(rawExistingMeta) ? 'array' : typeof rawExistingMeta
      })
      existingMeta = {}
    }
    
    if (!this.isPlainObject(newMetadata)) {
      // If new metadata is not a plain object, log error and skip merge
      console.error('[RAGWriter] New metadata is not a plain object, skipping merge:', {
        contentId,
        type: newMetadata === null ? 'null' : Array.isArray(newMetadata) ? 'array' : typeof newMetadata
      })
      return
    }

    // Deep merge: new values override old, preserves unaffected nested keys
    const merged = this.deepMerge(existingMeta, newMetadata)

    await db.update(content).set({ metadata: merged as unknown as typeof content.metadata }).where(eq(content.id, contentId))
  }

  /**
   * Calculate AEO compliance score from syntax report
   * This enables the revision loop to use AEO as a quality gate
   */
  private calculateAEOScore(syntaxReport: any): number {
    if (!syntaxReport) return 50 // Neutral fallback

    let score = 40 // Base score

    // +25 for following direct answer protocol (key AEO requirement)
    if (syntaxReport.directAnswerProtocolFollowed) score += 25

    // +15 for valid heading hierarchy (H1 > H2 > H3)
    if (syntaxReport.headingHierarchyValid) score += 15

    // +10 for H1 present
    if (syntaxReport.h1Present) score += 10

    // +10 for question-style H2 headings (AEO-friendly)
    if (syntaxReport.h2QuestionHeading) score += 10

    return Math.min(100, score)
  }

  /**
   * Format Frase optimization result into a content brief for the writer
   */
  private formatFraseContentBrief(fraseResult: any): string {
    if (!fraseResult) return ''

    const brief: string[] = []

    // Search Intent
    if (fraseResult.searchIntent) {
      brief.push(`📊 Search Intent: ${fraseResult.searchIntent.toUpperCase()}`)
    }

    // Topic Clusters
    if (fraseResult.contentBrief?.topicClusters?.length > 0) {
      brief.push('\n🎯 Key Topics to Cover (in order of importance):')
      fraseResult.contentBrief.topicClusters.slice(0, 15).forEach((topic: any, idx: number) => {
        brief.push(`  ${idx + 1}. ${topic.topic} (importance: ${Math.round((topic.importance || 0) * 100)}%)`)
      })
    }

    // Questions to Answer
    if (fraseResult.contentBrief?.questions?.length > 0) {
      brief.push('\n❓ User Questions to Answer:')
      fraseResult.contentBrief.questions.slice(0, 10).forEach((q: string) => {
        brief.push(`  • ${q}`)
      })
    }

    // Suggested Headings
    if (fraseResult.contentBrief?.headings?.length > 0) {
      brief.push('\n📑 Recommended Headings (based on SERP analysis):')
      fraseResult.contentBrief.headings.slice(0, 8).forEach((h: any) => {
        brief.push(`  • ${h.heading}`)
      })
    }

    // Key Terms
    if (fraseResult.contentBrief?.keyTerms?.length > 0) {
      const terms = fraseResult.contentBrief.keyTerms.slice(0, 20).map((t: any) => t.term).join(', ')
      brief.push(`\n🔑 Important Terms to Include: ${terms}`)
    }

    // Competitor Insights
    if (fraseResult.contentBrief?.competitorInsights) {
      const insights = fraseResult.contentBrief.competitorInsights
      brief.push('\n📈 Competitor Benchmarks:')
      if (insights.avgWordCount) {
        brief.push(`  • Target word count: ${insights.avgWordCount}+ words`)
      }
      if (insights.avgHeadingCount) {
        brief.push(`  • Target headings: ${insights.avgHeadingCount}+ headings`)
      }
      if (insights.topPerformingUrls?.length > 0) {
        brief.push('  • Top performing competitors:')
        insights.topPerformingUrls.slice(0, 3).forEach((url: any) => {
          brief.push(`    - ${url.title || url.url}`)
        })
      }
    }

    // Optimization Recommendations
    if (fraseResult.recommendations?.suggestedTopics?.length > 0) {
      brief.push('\n💡 Content Recommendations:')
      fraseResult.recommendations.suggestedTopics.slice(0, 5).forEach((topic: string) => {
        brief.push(`  • Include: ${topic}`)
      })
    }

    return brief.join('\n')
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

