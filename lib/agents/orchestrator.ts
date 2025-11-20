/**
 * Orchestrator Agent - Coordinates multi-agent content generation workflow
 */

import { ResearchAgent } from './research-agent'
import { SEOAEOAgent } from './seo-aeo-agent'
import { ContentWriterAgent } from './content-writer-agent'
import { QualityAssuranceAgent } from './quality-assurance-agent'
import { ImageAgent } from './image-agent'
import { cachedAEOCall, AEO_CACHE_PREFIXES, AEO_CACHE_TTL } from '@/lib/ai/aeo-cache'

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
      // Use cached workflow results when available
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

          // Step 4: Quality Assurance Loop
          console.log('[Orchestrator] Phase 4: Quality Assurance')
          const qaResult = await this.qaAgent.reviewAndImprove({
            content: draftContent.content,
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

          console.log('[Orchestrator] ✓ Content generation complete')
          console.log('[Orchestrator] Final AI Score:', qaResult.metadata.aiDetectionScore)

          return {
            content: qaResult.content,
            featuredImage,
            metadata: {
              ...qaResult.metadata,
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
}

