/**
 * Stream Builder Module
 * 
 * Handles stream creation and core tools for the chat API.
 * Includes orchestrator tool, client UI tool, and image generation tool.
 */

import {
  streamText,
  tool,
  type ModelMessage,
  stepCountIs,
  createIdGenerator,
  type UIMessage,
} from 'ai'
import { z } from 'zod'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import { RAGWriterOrchestrator } from '@/lib/agents/rag-writer-orchestrator'
import { generateImageWithGatewayGemini } from '@/lib/ai/image-generation'
import { createTelemetryConfig } from '@/lib/observability/langfuse'
import type { AgentType } from './intent-classifier'
import type { Tool } from 'ai'

// Using Moonshot Kimi K2 - advanced reasoning model for chat
const CHAT_MODEL_ID = 'moonshotai/kimi-k2'

export interface StreamOptions {
  modelMessages: ModelMessage[]
  systemPrompt: string
  tools: Record<string, Tool>
  userId?: string
  conversationId?: string
  agentType: AgentType
  context?: Record<string, unknown>
  originalMessages: UIMessage[]
  onFinish?: (params: { messages: UIMessage[] }) => Promise<void>
}

/**
 * Create the orchestrator tool for content generation.
 */
export function createOrchestratorTool(userId?: string) {
  return tool({
    description:
      "Generate high-quality, researched, and SEO-optimized content (blog posts, articles). This tool runs a comprehensive workflow: Research (Perplexity + RAG) -> Write -> DataForSEO Scoring -> EEAT QA Review -> Revision Feedback Loop.",
    inputSchema: z.object({
      topic: z.string().describe("The main topic of the content"),
      type: z
        .enum(["blog_post", "article", "social_media", "landing_page"])
        .describe("Type of content to generate"),
      keywords: z.array(z.string()).describe("Target keywords"),
      tone: z.string().optional().describe("Desired tone (e.g., professional, casual)"),
      wordCount: z.number().optional().describe("Target word count"),
      competitorUrls: z.array(z.string()).optional().describe("Optional competitor URLs for comparison"),
    }),
    execute: async (args) => {
      try {
        console.log('[Stream Builder] Orchestrator starting with args:', args)

        if (!userId) {
          return '❌ Authentication required. Please sign in to use this feature.'
        }

        const orchestrator = new RAGWriterOrchestrator()
        const result = await orchestrator.generateContent({
          ...args,
          userId,
        })

        console.log('[Stream Builder] Orchestrator completed successfully')
        console.log(`[Stream Builder] Quality Scores - Overall: ${result.qualityScores.overall}, EEAT: ${result.qualityScores.eeat}`)

        let contentResult = result.content || "Content generation completed but no content was returned."

        const scoreSummary = `
## Quality Scores
- **Overall Quality**: ${result.qualityScores.overall}/100
- **DataForSEO Score**: ${result.qualityScores.dataforseo}/100
- **EEAT Score**: ${result.qualityScores.eeat}/100
- **Content Depth**: ${result.qualityScores.depth}/100
- **Factual Accuracy**: ${result.qualityScores.factual}/100
- **Revision Rounds**: ${result.revisionCount}

${(result.qaReport?.improvement_instructions?.length ?? 0) > 0 ? `\n## QA Review Notes\n${result.qaReport.improvement_instructions!.slice(0, 3).map((inst: string, i: number) => `${i + 1}. ${inst}`).join('\n')}` : ''}
`

        return contentResult + scoreSummary
      } catch (error) {
        console.error("[Stream Builder] Orchestrator error:", error)
        return "Failed to generate content. Please try again."
      }
    },
  })
}

/**
 * Create the client UI tool for displaying interactive components.
 */
export function createClientUiTool() {
  return tool({
    description:
      "Display an interactive UI component to the user. Use this when you need to collect specific information or show structured data.",
    inputSchema: z.object({
      component: z
        .enum([
          "url_input",
          "card_selector",
          "location_picker",
          "confirmation_buttons",
          "loading_indicator",
          "analysis_result",
        ])
        .describe("The type of component to display"),
      props: z.object({}).passthrough().describe("The properties/data for the component"),
    }),
    execute: async ({ component }) => {
      return { displayed: true, component }
    },
  })
}

/**
 * Create the gateway image generation tool.
 */
export function createGatewayImageTool() {
  return tool({
    description: "Generate images with Google Gemini 2.5 Flash Image via Vercel AI Gateway. Use when the user asks for an image or wants edits/regenerations.",
    inputSchema: z.object({
      prompt: z.string().describe("Base prompt for the image"),
      previousPrompt: z.string().optional().describe("Previous prompt to refine from"),
      editInstructions: z.string().optional().describe("Refinements or edits requested by the user"),
      size: z.enum(["1024x1024", "1792x1024", "1024x1792"]).optional(),
      aspectRatio: z.enum(["1:1", "4:3", "3:4", "16:9", "9:16"]).optional(),
      seed: z.number().optional().describe("Optional seed for deterministic output"),
      n: z.number().optional().describe("Number of images to request (default 1)"),
      abortTimeoutMs: z.number().optional().describe("Timeout in milliseconds for generation"),
    }),
    execute: async (args) => {
      try {
        console.log('[Stream Builder] Generating image with prompt:', args.prompt)

        const response = await generateImageWithGatewayGemini({
          prompt: args.prompt,
          previousPrompt: args.previousPrompt,
          editInstructions: args.editInstructions,
          size: args.size,
          aspectRatio: args.aspectRatio,
          seed: args.seed,
          n: args.n,
          abortTimeoutMs: args.abortTimeoutMs || 60000,
        })

        console.log('[Stream Builder] Image generated, returning base64 URLs...')

        const uploadedImages = response.images.map((img, idx) => ({
          url: img.dataUrl,
          name: `image-${idx + 1}.png`,
          mediaType: img.mediaType || 'image/png',
        }))

        const primary = uploadedImages[0]

        return {
          type: 'image',
          model: 'google/gemini-2.5-flash-image',
          prompt: response.prompt,
          size: args.size || '1024x1024',
          url: primary?.url,
          imageUrl: primary?.url,
          mediaType: primary?.mediaType,
          warnings: response.warnings,
          count: uploadedImages.length,
          files: uploadedImages.map(img => ({
            name: img.name,
            mediaType: img.mediaType,
            url: img.url,
          })),
          parts: uploadedImages.map(img => ({
            type: 'file',
            mimeType: img.mediaType,
            name: img.name,
            url: img.url,
          })),
          content: `Image generated successfully! [View Image](${primary?.url})`,
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Image generation failed'
        console.error('[Stream Builder] Gateway image tool failed:', error)
        return {
          type: 'image',
          model: 'google/gemini-2.5-flash-image',
          status: 'error',
          errorMessage: message,
        }
      }
    }
  })
}

/**
 * Get core tools that are always available regardless of agent type.
 */
export function getCoreTools(userId?: string): Record<string, Tool> {
  return {
    generate_researched_content: createOrchestratorTool(userId),
    client_ui: createClientUiTool(),
    gateway_image: createGatewayImageTool(),
  }
}

/**
 * Build and return the streaming response.
 */
export async function buildStreamResponse(options: StreamOptions): Promise<Response> {
  const {
    modelMessages,
    systemPrompt,
    tools,
    userId,
    conversationId,
    agentType,
    context,
    originalMessages,
    onFinish,
  } = options

  const serverMessageIdGenerator = createIdGenerator({ prefix: 'msg', size: 16 })

  // Merge core tools with provided tools
  const allTools = {
    ...getCoreTools(userId),
    ...tools,
  }

  console.log('[Stream Builder] Starting streamText with tools:', {
    count: Object.keys(allTools).length,
    tools: Object.keys(allTools),
  })

  const result = streamText({
    model: vercelGateway.languageModel(CHAT_MODEL_ID),
    messages: modelMessages,
    system: systemPrompt,
    tools: allTools,
    toolChoice: 'auto',
    // AI SDK 6: Model fallbacks via Vercel AI Gateway
    providerOptions: {
      gateway: {
        models: ['openai/gpt-4o-mini', 'google/gemini-2.0-flash'],
      },
    },
    // AI SDK 6: Use stopWhen instead of maxSteps
    stopWhen: [
      stepCountIs(10),
    ],
    experimental_telemetry: createTelemetryConfig('chat-stream', {
      userId,
      sessionId: conversationId,
      agentType,
      page: context?.page as string | undefined,
      isOnboarding: context?.page === 'onboarding',
      onboardingStep: (context?.onboarding as Record<string, unknown>)?.currentStep as number | undefined,
      toolsCount: Object.keys(allTools).length,
      conversationId,
      mcpDataforseoEnabled: agentType === 'seo-aeo' || agentType === 'content',
      mcpFirecrawlEnabled: agentType === 'seo-aeo' || agentType === 'content',
      mcpJinaEnabled: agentType === 'content',
      mcpWinstonEnabled: agentType === 'content',
    }),
    onFinish: async ({ response, usage }) => {
      console.log('[Stream Builder] streamText onFinish:', {
        messagesCount: response.messages.length,
        usage,
      })
    },
  })

  // Return streaming response
  return result.toUIMessageStreamResponse({
    headers: {
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
    originalMessages,
    generateMessageId: serverMessageIdGenerator,
    onFinish: async ({ messages: uiMessages }) => {
      console.log('[Stream Builder] toUIMessageStreamResponse onFinish:', {
        hasMessages: !!uiMessages?.length,
        messageCount: uiMessages?.length || 0,
      })

      if (onFinish && uiMessages?.length) {
        await onFinish({ messages: uiMessages })
      }
    },
  })
}
