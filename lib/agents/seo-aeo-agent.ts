/**
 * SEO/AEO Agent - Optimizes content for search engines and AI answer engines
 */

import { vercelGateway } from '@/lib/ai/gateway-provider'
import type { GatewayModelId } from '@ai-sdk/gateway'
import { generateObject } from 'ai'
import { z } from 'zod'
import { createTelemetryConfig } from '@/lib/observability/langfuse'
import { retrieveAgentDocuments } from '@/lib/ai/content-rag'

export interface SEOAEOParams {
  topic: string
  keywords: string[]
  targetPlatforms?: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  researchData?: any
  userId?: string // For usage logging
  langfuseTraceId?: string // For grouping spans under a parent trace
  sessionId?: string // For Langfuse session tracking
  abortSignal?: AbortSignal // Optional: signal to abort strategy generation
  // Business context for personalized strategies
  businessContext?: {
    websiteUrl?: string
    industry?: string
    location?: string
    goals?: string[]
    brandVoice?: string
  }
}


// Zod schema for structured SEO/AEO strategy output
const SEOAEOStrategySchema = z.object({
  contentStructure: z.object({
    structure: z.string().describe('Recommended heading hierarchy (e.g., H1 > H2 > H3)'),
    sections: z.array(z.string()).describe('List of recommended sections'),
    wordCount: z.number().optional().describe('Recommended minimum word count'),
    format: z.string().optional().describe('Content format recommendations'),
  }),
  keywordPlacement: z.object({
    primary: z.union([z.string(), z.array(z.string())]).describe('Primary keyword placement strategy'),
    secondary: z.union([z.string(), z.array(z.string())]).describe('Secondary keyword placement'),
    density: z.string().optional().describe('Recommended keyword density'),
    semanticVariations: z.array(z.string()).optional().describe('Semantic keyword variations to include'),
  }),
  citationStrategy: z.object({
    format: z.string().describe('Citation format recommendation'),
    sources: z.string().describe('Types of sources to cite'),
    authority: z.string().optional().describe('Authority signals to include'),
  }),
  platformOptimizations: z.object({
    chatgpt: z.string().describe('ChatGPT optimization tips'),
    perplexity: z.string().describe('Perplexity optimization tips'),
    claude: z.string().optional().describe('Claude optimization tips'),
    google: z.string().optional().describe('Google Search optimization tips'),
  }),
  schemaMarkup: z.array(z.string()).optional().describe('Recommended schema.org types'),
  agentExperience: z.object({
    structuredData: z.string().optional(),
    actionableSteps: z.string().optional(),
    toolIntegration: z.string().optional(),
  }).optional().describe('Agent Experience (AX) recommendations'),
})

export type SEOAEOResult = z.infer<typeof SEOAEOStrategySchema>

export class SEOAEOAgent {
  /**
   * Create SEO/AEO optimization strategy
   */
  async optimizeForAEO(params: SEOAEOParams): Promise<SEOAEOResult> {
    console.log('[SEO/AEO Agent] Creating optimization strategy for:', params.topic)

    // Retrieve relevant SEO/AEO knowledge from RAG
    let knowledgeContext = ''
    try {
      // Allow caller to specify document limit, default to 20 for better context
      const maxDocs = params.researchData?.maxDocs ?? 20
      const seoKnowledge = await retrieveAgentDocuments(
        `${params.topic} ${params.keywords.join(' ')}`,
        'seo_aeo',
        maxDocs
      )
      if (seoKnowledge && seoKnowledge.length > 0) {
        knowledgeContext = seoKnowledge
          .map((doc: unknown) => {
            const d = doc as { title: string; content: string };
            return `### ${d.title}\n${d.content}`;
          })
          .join('\n\n')
        console.log(`[SEO/AEO Agent] ✓ Retrieved ${seoKnowledge.length} knowledge documents (limit: ${params.researchData?.maxDocs ?? 20})`)
      }
    } catch (error) {
      console.error('[SEO/AEO Agent] Error retrieving knowledge:', error)
      // Continue without knowledge context
    }

    // Build business context section
    let businessContextSection = ''
    if (params.businessContext) {
      const parts: string[] = []
      if (params.businessContext.websiteUrl) parts.push(`Website: ${params.businessContext.websiteUrl}`)
      if (params.businessContext.industry) parts.push(`Industry: ${params.businessContext.industry}`)
      if (params.businessContext.location) parts.push(`Target Location: ${params.businessContext.location}`)
      if (params.businessContext.goals?.length) parts.push(`Business Goals: ${params.businessContext.goals.join(', ')}`)
      if (params.businessContext.brandVoice) parts.push(`Brand Voice: ${params.businessContext.brandVoice}`)

      if (parts.length > 0) {
        businessContextSection = `## Business Context
${parts.join('\n')}

`
      }
    }

    const prompt = `Create an SEO and AEO optimization strategy for content about: "${params.topic}"

Target Keywords: ${params.keywords.join(', ')}
Target Platforms: ${params.targetPlatforms?.join(', ') || 'General search + AI engines'}

${businessContextSection}${knowledgeContext ? `## Expert SEO/AEO Knowledge Base
Use the following research insights to inform your strategy:

${knowledgeContext}

---

` : ''}Provide:
1. Optimal content structure for both traditional SEO and AI answer engines (consider the CSQAF framework if relevant)
2. Strategic keyword placement recommendations
3. Citation and source linking strategy for AI engine visibility
4. Platform-specific optimizations (ChatGPT, Perplexity, Claude, etc.)
5. Semantic keyword variations to include
6. Schema markup recommendations (FAQPage, HowTo, etc.)
7. Agent Experience (AX) considerations for agentic search
${params.businessContext?.industry ? `8. Industry-specific recommendations for ${params.businessContext.industry}` : ''}

Format as JSON.`


    // Create abort controller with cleanup
    const controller = new AbortController()
    const timeoutMs = 90000
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    // Track whether we added the abort listener (for defensive cleanup)
    let listenerAdded = false
    const callerAbortListener = () => controller.abort()
    if (params.abortSignal) {
      if (params.abortSignal.aborted) {
        controller.abort()
      } else {
        params.abortSignal.addEventListener('abort', callerAbortListener, { once: true })
        listenerAdded = true
      }
    }

    try {
      console.log('[SEO/AEO Agent] Starting SEO strategy creation with generateObject...')

      const { object: strategy, usage } = await generateObject({
        model: vercelGateway.languageModel('google/gemini-2.5-flash' as GatewayModelId),
        schema: SEOAEOStrategySchema,
        prompt,
        temperature: 0.4,
        maxRetries: 3,
        abortSignal: controller.signal,
        experimental_telemetry: createTelemetryConfig('seo-aeo', {
          userId: params.userId,
          sessionId: params.sessionId,
          langfuseTraceId: params.langfuseTraceId,
          topic: params.topic,
          keywords: params.keywords,
          targetPlatforms: params.targetPlatforms,
          hasResearchData: !!params.researchData,
          hasKnowledgeContext: !!knowledgeContext,
          provider: 'google',
          model: 'gemini-2.5-flash',
        }),
      })

      // Log usage
      if (params.userId) {
        try {
          const { logAIUsage } = await import('@/lib/analytics/usage-logger')
          await logAIUsage({
            userId: params.userId,
            agentType: 'seo_aeo',
            model: 'google/gemini-2.5-flash',
            promptTokens: usage?.inputTokens || 0,
            completionTokens: usage?.outputTokens || 0,
            metadata: {
              topic: params.topic,
              keywords: params.keywords,
              hasKnowledgeContext: !!knowledgeContext,
            },
          })
        } catch (error) {
          console.error('[SEO/AEO Agent] Error logging usage:', error)
        }
      }

      console.log('[SEO/AEO Agent] ✓ Strategy created successfully with structured output')
      return strategy
    } catch (error: unknown) {
      const errorName = error instanceof Error ? error.name : 'Unknown'
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (errorName === 'AbortError') {
        if (params.abortSignal?.aborted) {
          console.error('[SEO/AEO Agent] Strategy creation aborted by caller')
          throw error
        }
        console.error('[SEO/AEO Agent] Strategy creation aborted (timeout)')
      } else {
        console.error('[SEO/AEO Agent] Strategy creation failed:', errorMessage)
      }

      // Type-safe fallback strategy
      const fallbackStrategy: SEOAEOResult = {
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
    } finally {
      clearTimeout(timeout)
      // Only remove listener if it was actually added
      if (listenerAdded && params.abortSignal) {
        params.abortSignal.removeEventListener('abort', callerAbortListener)
      }
    }
  }
}
