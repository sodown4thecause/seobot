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
      console.log('[SEO/AEO Agent] Starting SEO strategy creation with timeout...')
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('SEO agent timeout after 10s')), 10000)
      })
      
      const generatePromise = generateText({
        model: vercelGateway.languageModel('anthropic/claude-haiku-4.5' as GatewayModelId),
        prompt,
        temperature: 0.4,
      })
      
      const { text } = await Promise.race([generatePromise, timeoutPromise]) as { text: string }
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
    } catch (error) {
      console.error('[SEO/AEO Agent] Strategy creation failed:', error)
      // Return comprehensive fallback strategy
      const fallbackStrategy = {
        contentStructure: {
          structure: 'Introduction > Key Points > Tools Overview > Conclusion',
          sections: ['intro', 'tools-overview', 'comparison', 'conclusion'],
          wordCount: 200
        },
        keywordPlacement: {
          primary: ['SEO tools', 'content writing'],
          secondary: ['optimization', 'AI tools', 'writing assistant'],
          density: '2-3%'
        },
        citationStrategy: {
          format: 'inline citations',
          sources: 'tool websites and reviews',
          authority: 'focus on established SEO platforms'
        },
        platformOptimizations: {
          chatgpt: 'clear section headers and bullet points',
          perplexity: 'include tool comparisons and statistics',
          claude: 'structured format with actionable insights'
        }
      }
      
      console.log('[SEO/AEO Agent] ✓ Using fallback strategy due to error')
      return fallbackStrategy
    }
  }
}










