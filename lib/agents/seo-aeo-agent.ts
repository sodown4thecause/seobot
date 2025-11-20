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
      const { text } = await generateText({
        model: vercelGateway.languageModel('google/gemini-3-pro-preview' as GatewayModelId),
        prompt,
        temperature: 0.4,
      })

      // Try to parse as JSON, fallback to structured object
      let strategy: SEOAEOResult
      try {
        strategy = JSON.parse(text)
      } catch {
        strategy = {
          contentStructure: {},
          keywordPlacement: {},
          citationStrategy: {},
          platformOptimizations: {},
        }
      }

      console.log('[SEO/AEO Agent] ✓ Strategy created')
      return strategy
    } catch (error) {
      console.error('[SEO/AEO Agent] Strategy creation failed:', error)
      // Return empty strategy as fallback
      return {
        contentStructure: {},
        keywordPlacement: {},
        citationStrategy: {},
        platformOptimizations: {},
      }
    }
  }
}




