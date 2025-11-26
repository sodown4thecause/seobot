/**
 * Content Writer Agent - Generates high-quality content using RAG
 */

import { generateText } from 'ai'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import type { GatewayModelId } from '@ai-sdk/gateway'
import { getContentGuidance } from '@/lib/ai/content-rag'

export interface ContentWriteParams {
  type: 'blog_post' | 'article' | 'social_media' | 'landing_page'
  topic: string
  keywords: string[]
  tone?: string
  wordCount?: number
  researchContext?: any
  seoStrategy?: any
  userId?: string
  // Revision support
  previousDraft?: string
  improvementInstructions?: string[]
  dataforseoMetrics?: any
  qaReport?: any
  revisionRound?: number
}

export interface ContentWriteResult {
  content: string
  metadata: {
    learningsApplied: number
  }
}

export class ContentWriterAgent {
  /**
   * Write content based on requirements and guidance
   */
  async write(params: ContentWriteParams): Promise<ContentWriteResult> {
    console.log('[Content Writer] Generating content for:', params.topic)

    // Retrieve content guidance from RAG system (cross-user learnings + expert docs)
    const guidance = await getContentGuidance(
      params.type,
      params.topic,
      params.keywords
    )

    // Build the writing prompt
    const prompt = this.buildPrompt(params)

    // Generate content using Claude via Vercel AI Gateway for superior quality
    try {
      const { text, usage } = await generateText({
        model: vercelGateway.languageModel('google/gemini-3-pro-preview' as GatewayModelId),
        system: this.buildSystemPrompt(guidance),
        prompt: prompt,
        temperature: 0.7,
      })

      // Log usage
      if (params.userId) {
        try {
          const { logAIUsage } = await import('@/lib/analytics/usage-logger');
          await logAIUsage({
            userId: params.userId,
            agentType: 'content_writer',
            model: 'google/gemini-3-pro-preview',
            promptTokens: usage?.promptTokens || 0,
            completionTokens: usage?.completionTokens || 0,
            metadata: {
              content_type: params.type,
              topic: params.topic,
            },
          });
        } catch (error) {
          console.error('[Content Writer] Error logging usage:', error);
        }
      }

      console.log('[Content Writer] ✓ Content generated')

      return {
        content: text,
        metadata: {
          learningsApplied: this.countLearnings(guidance),
        },
      }
    } catch (error) {
      console.error('[Content Writer] Error generating content:', error)
      throw error
    }
  }

  private buildSystemPrompt(guidance: string): string {
    return `You are an expert SEO/AEO content writer. Your goal is to create engaging, human-like content that ranks well in both traditional search engines and AI answer engines.

CRITICAL: You must apply the following successful patterns and learnings from previous content:
${guidance}

Key principles:
- Write naturally with varied sentence structures
- Use personal insights and unique perspectives
- Include specific examples and data points
- Balance keywords naturally without stuffing
- Structure content for both humans and AI answer engines
- Add personality and voice to avoid generic AI tone
- If guidance mentions "Patterns Triggering AI Detectors", radically change the voice: use first-person anecdotes, rhetorical questions, and abrupt short sentences to avoid matching previous drafts.

Focus on creating content that:
1. Passes AI detection as human-written (target < 30% AI probability)
2. Ranks well in search engines
3. Gets cited by AI answer engines (ChatGPT, Perplexity, etc.)
4. Provides genuine value to readers`
  }

  private buildPrompt(params: ContentWriteParams): string {
    // If this is a revision, build revision prompt
    if (params.previousDraft && params.improvementInstructions) {
      return this.buildRevisionPrompt(params)
    }

    // Otherwise, build initial draft prompt
    let prompt = `Write a ${params.type.replace('_', ' ')} about "${params.topic}".

Target Keywords: ${params.keywords.join(', ')}
${params.tone ? `Tone: ${params.tone}` : ''}
${params.wordCount ? `Target Word Count: ${params.wordCount}` : ''}

${params.researchContext ? `\nResearch Context:\n${JSON.stringify(params.researchContext, null, 2)}` : ''}

${params.seoStrategy ? `\nSEO Strategy:\n${JSON.stringify(params.seoStrategy, null, 2)}` : ''}

Write the complete content now. Make it engaging, informative, and human-like.`

    return prompt
  }

  private buildRevisionPrompt(params: ContentWriteParams): string {
    const instructions = params.improvementInstructions?.join('\n- ') || 'Improve the content quality.'

    let prompt = `Revise the following content based on quality review feedback.

ORIGINAL DRAFT:
${params.previousDraft}

IMPROVEMENT INSTRUCTIONS:
- ${instructions}

${params.dataforseoMetrics ? `\nDataForSEO Metrics:\n${JSON.stringify(params.dataforseoMetrics, null, 2)}` : ''}

${params.qaReport ? `\nQA Report Summary:\n${JSON.stringify(params.qaReport, null, 2)}` : ''}

REQUIREMENTS:
- Keep the core topic and keywords: ${params.keywords.join(', ')}
${params.tone ? `- Maintain tone: ${params.tone}` : ''}
${params.wordCount ? `- Target word count: ${params.wordCount}` : ''}
- Address ALL improvement instructions above
- Do not change the fundamental structure unless specifically requested
- Enhance citations, data points, and depth as instructed

Write the revised, improved content now.`

    return prompt
  }

  private countLearnings(guidance: string): number {
    // Count how many learning patterns are in the guidance
    const learningMarkers = guidance.match(/##\s+\d+\./g)
    return learningMarkers ? learningMarkers.length : 0
  }
}












