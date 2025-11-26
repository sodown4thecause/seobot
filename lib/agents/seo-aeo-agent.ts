/**
 * SEO/AEO Agent - Optimizes content for search engines and AI answer engines
 */

import { vercelGateway } from '@/lib/ai/gateway-provider'
import type { GatewayModelId } from '@ai-sdk/gateway'
import { generateText } from 'ai'

export interface SEOAEOParams {
  topic: string
  keywords: string[]
  targetPlatforms?: string[]
  researchData?: any
  userId?: string // For usage logging
}

export interface SEOAEOResult {
  contentStructure: any
  keywordPlacement: any
  citationStrategy: any
  platformOptimizations: any
}

export class SEOAEOAgent {
  /**
   * Create SEO/AEO optimization strategy
   */
  async optimizeForAEO(params: SEOAEOParams): Promise<SEOAEOResult> {
    console.log('[SEO/AEO Agent] Creating optimization strategy for:', params.topic)

    const prompt = `Create an SEO and AEO optimization strategy for content about: "${params.topic}"

Target Keywords: ${params.keywords.join(', ')}
Target Platforms: ${params.targetPlatforms?.join(', ') || 'General search + AI engines'}

Provide:
1. Optimal content structure for both traditional SEO and AI answer engines
2. Strategic keyword placement recommendations
3. Citation and source linking strategy for AI engine visibility
4. Platform-specific optimizations (ChatGPT, Perplexity, Claude, etc.)
5. Semantic keyword variations to include

Format as JSON.`

    try {
      console.log('[SEO/AEO Agent] Starting SEO strategy creation with timeout...')

      const controller = new AbortController()
      const timeoutMs = 90000
      const timeout = setTimeout(() => {
        controller.abort()
      }, timeoutMs)

      const { text, usage } = await generateText({
        // Use Gemini 2.5 Flash for better tool orchestration and faster responses
        model: vercelGateway.languageModel('google/gemini-2.5-flash' as GatewayModelId),
        prompt,
        temperature: 0.4,
        maxRetries: 3, // AI SDK 6: Add retries for transient failures
        abortSignal: controller.signal, // AI SDK 6: Use abortSignal instead of signal
      })

      // Log usage
      if (params.userId) {
        try {
          const { logAIUsage } = await import('@/lib/analytics/usage-logger');
          await logAIUsage({
            userId: params.userId,
            agentType: 'seo_aeo',
            model: 'google/gemini-2.5-flash',
            promptTokens: usage?.promptTokens || 0,
            completionTokens: usage?.completionTokens || 0,
            metadata: {
              topic: params.topic,
              keywords: params.keywords,
            },
          });
        } catch (error) {
          console.error('[SEO/AEO Agent] Error logging usage:', error);
        }
      }

      clearTimeout(timeout)
      console.log('[SEO/AEO Agent] ✓ Strategy generation completed')

      // Try to parse as JSON, fallback to structured object
      let strategy: SEOAEOResult
      try {
        strategy = JSON.parse(text)
      } catch {
        strategy = {
          contentStructure: { structure: 'H1 > H2 > H3', sections: ['intro', 'main', 'conclusion'] },
          keywordPlacement: { primary: 'title and first paragraph', secondary: 'headers and body' },
          citationStrategy: { format: 'inline links', sources: 'authoritative sites' },
          platformOptimizations: { chatgpt: 'clear headings', perplexity: 'cite sources' },
        }
      }

      console.log('[SEO/AEO Agent] ✓ Strategy created successfully')
      return strategy
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        console.error('[SEO/AEO Agent] Strategy creation aborted due to timeout')
      } else {
        console.error('[SEO/AEO Agent] Strategy creation failed:', error)
      }

      const fallbackStrategy = {
        contentStructure: {
          structure: 'Introduction > Key Points > Tools Overview > Conclusion',
          sections: ['intro', 'tools-overview', 'comparison', 'conclusion'],
          wordCount: 200,
        },
        keywordPlacement: {
          primary: ['SEO tools', 'content writing'],
          secondary: ['optimization', 'AI tools', 'writing assistant'],
          density: '2-3%',
        },
        citationStrategy: {
          format: 'inline citations',
          sources: 'tool websites and reviews',
          authority: 'focus on established SEO platforms',
        },
        platformOptimizations: {
          chatgpt: 'clear section headers and bullet points',
          perplexity: 'include tool comparisons and statistics',
          claude: 'structured format with actionable insights',
        },
      }

      console.log('[SEO/AEO Agent] ✓ Using fallback strategy due to error')
      return fallbackStrategy
    }
  }
}












