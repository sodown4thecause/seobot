/**
 * Orchestrator Agent - Coordinates multi-agent content generation workflow
 */

import { ResearchAgent } from './research-agent'
import { SEOAEOAgent } from './seo-aeo-agent'
import { ContentWriterAgent } from './content-writer-agent'
import { QualityAssuranceAgent } from './quality-assurance-agent'
import { ImageAgent } from './image-agent'
import { cachedAEOCall, AEO_CACHE_PREFIXES, AEO_CACHE_TTL } from '@/lib/ai/aeo-cache'
import { analyzeContent } from '@/lib/mcp/winston-client'
import { storeAndLearn, getCrossUserInsights } from '@/lib/ai/learning-storage'

export interface ContentGenerationParams {
  type: 'blog_post' | 'article' | 'social_media' | 'landing_page'
  topic: string
  keywords: string[]
  tone?: string
  wordCount?: number
  targetPlatforms?: string[] // ['chatgpt', 'perplexity', 'claude', 'gemini']
  userId?: string // User ID for learning storage
}

export interface ContentGenerationResult {
  content: string
  featuredImage?: string
  metadata: {
    aiDetectionScore: number
    humanProbability: number
    seoScore: number
    iterations: number
    learningsApplied: number
    researchSummary?: string
    seoStrategy?: any
  }
  suggestions: string[]
}

export class OrchestratorAgent {
  private researchAgent: ResearchAgent
  private seoAeoAgent: SEOAEOAgent
  private contentWriterAgent: ContentWriterAgent
  private qaAgent: QualityAssuranceAgent
  private imageAgent: ImageAgent

  constructor() {
    this.researchAgent = new ResearchAgent()
    this.seoAeoAgent = new SEOAEOAgent()
    this.contentWriterAgent = new ContentWriterAgent()
    this.qaAgent = new QualityAssuranceAgent()
    this.imageAgent = new ImageAgent()
  }

  /**
   * Main orchestration method - coordinates the full content generation workflow
   */
  async generateContent(params: ContentGenerationParams): Promise<ContentGenerationResult> {
    console.log('[Orchestrator] Starting content generation for:', params.topic)

    try {
      // Cache the full workflow to improve performance
      const cacheKey = `${AEO_CACHE_PREFIXES.WORKFLOW}:${params.type}:${params.topic}`

      return await cachedAEOCall(
        cacheKey,
        async () => {
          // Step 1: Research Phase
          console.log('[Orchestrator] Phase 1: Research')
          const researchResult = await this.researchAgent.research({
            topic: params.topic,
            depth: 'standard',
          })

          // Step 2: SEO/AEO Strategy
          console.log('[Orchestrator] Phase 2: SEO/AEO Strategy')
          const seoStrategy = await this.seoAeoAgent.optimizeForAEO({
            topic: params.topic,
            keywords: params.keywords,
            targetPlatforms: params.targetPlatforms || ['chatgpt', 'perplexity'],
            researchData: researchResult,
            userId: params.userId,
          })

          // Step 3: Content Generation
          console.log('[Orchestrator] Phase 3: Content Generation')
          const draftContent = await this.contentWriterAgent.write({
            type: params.type,
            topic: params.topic,
            keywords: params.keywords,
            tone: params.tone,
            wordCount: params.wordCount,
            researchContext: researchResult,
            seoStrategy: seoStrategy,
            userId: params.userId,
          })

          const maxWords = params.wordCount
            ? Math.max(Math.ceil(params.wordCount * 1.2), 120)
            : null
          const cappedDraft = maxWords
            ? this.trimToWordCount(draftContent.content, maxWords)
            : draftContent.content

          // Step 4: Quality Assurance Loop
          console.log('[Orchestrator] Phase 4: Quality Assurance')
          const qaResult = await this.qaAgent.reviewAndImprove({
            content: cappedDraft,
            contentType: params.type,
            topic: params.topic,
            keywords: params.keywords,
            userId: params.userId,
          })

          // Step 5: Image Generation (Parallel with QA or after)
          console.log('[Orchestrator] Phase 5: Image Generation')
          let featuredImage: string | undefined
          try {
            featuredImage = await this.imageAgent.generate({
              prompt: `Professional, high-quality feature image for a blog post about ${params.topic}. Keywords: ${params.keywords.join(', ')}. Style: modern, digital art, minimalist.`,
              aspectRatio: "16:9"
            })
          } catch (error) {
            console.warn('[Orchestrator] Image generation failed:', error)
          }

          let finalContent = maxWords
            ? this.trimToWordCount(qaResult.content, maxWords)
            : qaResult.content

          const finalAnalysis = await analyzeContent(finalContent)

          if (params.userId) {
            await this.storeFinalLearning({
              userId: params.userId,
              contentType: params.type,
              topic: params.topic,
              keywords: params.keywords,
              aiDetectionScore: finalAnalysis.score,
              humanProbability: finalAnalysis.humanProbability,
              techniques: qaResult.techniques,
              feedback: finalAnalysis.feedback || null,
            })
          }

          console.log('[Orchestrator] ✓ Content generation complete')
          console.log('[Orchestrator] Final AI Score:', finalAnalysis.score)

          return {
            content: finalContent,
            featuredImage,
            metadata: {
              ...qaResult.metadata,
              aiDetectionScore: finalAnalysis.score,
              humanProbability: finalAnalysis.humanProbability,
              learningsApplied: draftContent.metadata.learningsApplied,
              researchSummary: researchResult.summary,
              seoStrategy,
            },
            suggestions: qaResult.suggestions,
          }
        },
        AEO_CACHE_TTL.WORKFLOW
      )
    } catch (error) {
      console.error('[Orchestrator] Error in content generation:', error)
      throw error
    }
  }

  private trimToWordCount(content: string, maxWords: number): string {
    if (!content || !maxWords) return content
    const words = content.split(/\s+/)
    if (words.length <= maxWords) return content
    return words.slice(0, maxWords).join(' ') + '…'
  }

  private async storeFinalLearning(params: {
    userId: string
    contentType: string
    topic: string
    keywords: string[]
    aiDetectionScore: number
    humanProbability: number
    techniques: string[]
    feedback?: string | null
  }) {
    try {
      await storeAndLearn({
        userId: params.userId,
        contentType: params.contentType,
        topic: params.topic,
        keywords: params.keywords,
        aiDetectionScore: params.aiDetectionScore,
        humanProbability: params.humanProbability,
        successful: params.aiDetectionScore <= 30,
        techniques: params.techniques,
        feedback: params.feedback || null,
      })

      const insights = await getCrossUserInsights(params.contentType)
      console.log(
        `[Learning Storage] 🌍 Global learning: ${insights.uniqueUsers} users, ${insights.successfulLearnings}/${insights.totalLearnings} successful patterns`,
      )
    } catch (error) {
      console.error('[Learning Storage] Failed to store learning:', error)
    }
  }
}

