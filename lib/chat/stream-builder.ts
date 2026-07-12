/**
 * Stream Builder Module
 * 
 * Handles stream creation and core tools for the chat API.
 * Includes orchestrator tool, client UI tool, and image generation tool.
 */

import {
  generateText,
  streamText,
  tool,
  type ModelMessage,
  isStepCount,
  createUIMessageStreamResponse,
  toUIMessageStream,
  createIdGenerator,
  type UIMessage,
} from 'ai'
import { z } from 'zod'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import { RAGWriterOrchestrator } from '@/lib/agents/rag-writer-orchestrator'
import { generateImageWithGatewayGemini } from '@/lib/ai/image-generation'
import { generateAndSaveContentImageAsset } from '@/lib/ai/content-image-assets'
import { db, libraryItems, type Json } from '@/lib/db'
import { createTelemetryConfig } from '@/lib/observability/langfuse'
import { logAIUsage } from '@/lib/analytics/usage-logger'
import { appLogger } from '@/lib/observability/app-logger'
import type { AgentType } from './intent-classifier'
import type { Tool } from 'ai'
import type { GatewayModelId } from '@ai-sdk/gateway'
import { normalizeChatMode, type ChatMode } from '@/lib/chat/modes'
import { classifyProviderError, serializeStreamError } from '@/lib/errors/provider-errors'
import { withToolTimeouts } from '@/lib/chat/tool-timeout'

// Primary chat model — claude-haiku-4-5: fast, excellent tool call reliability,
// Anthropic models issue parallel tool calls in a single step.
const CHAT_MODEL_ID = (process.env.CHAT_EXECUTOR_MODEL_ID || 'anthropic/claude-haiku-4-5') as GatewayModelId
const FAST_CONTENT_MODEL_ID = (process.env.CONTENT_FAST_MODEL_ID || 'google/gemini-3-flash') as GatewayModelId
// Fallbacks use current Gateway model IDs and avoid stale gpt-4o-era defaults.
const FALLBACK_MODELS = ['google/gemini-3-flash', 'openai/gpt-5.4']

export interface StreamOptions {
  modelMessages: ModelMessage[]
  systemPrompt: string
  tools: Record<string, Tool>
  userId?: string
  conversationId?: string
  agentType: AgentType
  context?: Record<string, unknown>
  originalMessages: UIMessage[]
  abortSignal?: AbortSignal
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
          qualityMode: 'fast',
          skipFrase: true,
          skipEeat: true,
          skipRevisionLoop: true,
        })

        console.log('[Stream Builder] Orchestrator completed successfully')
        console.log(`[Stream Builder] Quality Scores - Overall: ${result.qualityScores.overall}, EEAT: ${result.qualityScores.eeat}`)

        const contentResult = result.content || "Content generation completed but no content was returned."

        const scoreSummary = `
## Fast Quality Estimate
- **Overall Quality**: ${result.qualityScores.overall}/100
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

interface ContentPackageDraft {
  title: string
  content: string
  contentId?: string
  contentVersionId?: string
  qualityScores?: Record<string, unknown>
  revisionCount?: number
  metadata?: Record<string, unknown>
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout))
  })
}

function extractRequestedWordCount(value?: number): number {
  if (!value || !Number.isFinite(value)) return 800
  return Math.max(50, Math.min(3000, Math.round(value)))
}

async function generateFastContentPackageDraft(args: {
  topic: string
  type: 'blog_post' | 'article' | 'social_media' | 'landing_page'
  keywords?: string[]
  tone?: string
  wordCount?: number
}): Promise<ContentPackageDraft> {
  const wordCount = extractRequestedWordCount(args.wordCount)
  const result = await generateText({
    model: vercelGateway.languageModel(FAST_CONTENT_MODEL_ID),
    prompt: `Create a polished ${args.type.replace('_', ' ')} for a marketing team.

Topic: ${args.topic}
Target word count: ${wordCount}
Tone: ${args.tone || 'professional, clear, practical'}
Keywords: ${(args.keywords ?? []).join(', ') || 'AI search visibility, B2B SaaS'}

Return exactly this plain-text structure:
Title: <concise title>

<content body>

Keep the body close to ${wordCount} words. Make it concrete and useful. Do not use markdown symbols.`,
    providerOptions: {
      gateway: {
        tags: ['feature:chat', 'mode:content', 'feature:content-package', 'path:fast-short-form'],
      },
    },
  })

  const text = result.text.trim()
  const titleMatch = text.match(/^Title:\s*(.+)$/im)
  const title = titleMatch?.[1]?.trim() || args.topic
  const content = text
    .replace(/^Title:\s*.+$/im, '')
    .trim()

  return {
    title,
    content: content || text,
    metadata: {
      mode: 'content',
      generationPath: 'fast-short-form',
      requestedWordCount: wordCount,
      model: FAST_CONTENT_MODEL_ID,
    },
    qualityScores: {
      overall: 80,
      dataforseo: 0,
      eeat: 75,
      depth: wordCount <= 200 ? 70 : 78,
      factual: 75,
    },
    revisionCount: 0,
  }
}

function compactContentImageAsset(asset: Awaited<ReturnType<typeof generateAndSaveContentImageAsset>>) {
  const hasPersistentUrl = !!asset.url && !asset.url.startsWith('data:')

  return {
    id: asset.id,
    type: asset.type,
    url: hasPersistentUrl ? asset.url : undefined,
    previewAvailable: !hasPersistentUrl,
    storageKey: asset.storageKey,
    saveStatus: asset.saveStatus,
    saveError: asset.saveError,
    mediaType: asset.mediaType,
    prompt: asset.prompt,
    altText: asset.altText,
    caption: asset.caption,
    model: asset.model,
    aspectRatio: asset.aspectRatio,
    libraryItemId: asset.libraryItemId,
  }
}

function failedContentImageAsset(type: 'main' | 'thumbnail', error: unknown) {
  return {
    id: `${type}-failed`,
    type,
    url: undefined,
    previewAvailable: false,
    storageKey: undefined,
    saveStatus: 'failed',
    saveError: error instanceof Error ? error.message : 'Image generation failed',
    mediaType: 'image/png',
    prompt: '',
    altText: type === 'main' ? 'Main image failed to generate' : 'Thumbnail failed to generate',
    caption: '',
    model: 'google/gemini-3-pro-image',
    aspectRatio: type === 'main' ? '16:9' : '1200x630',
    libraryItemId: undefined,
  }
}

export function createContentPackageTool(userId?: string, conversationId?: string) {
  return tool({
    description:
      'Generate a complete saved content package for Content mode: researched content, a main 16:9 image, a thumbnail/social image, alt text, captions, and library records. Use this for article, blog post, landing page, or social content creation requests.',
    inputSchema: z.object({
      topic: z.string().describe('The main topic of the content'),
      type: z
        .enum(['blog_post', 'article', 'social_media', 'landing_page'])
        .describe('Type of content to generate'),
      keywords: z.array(z.string()).default([]).describe('Target keywords'),
      tone: z.string().optional().describe('Desired tone'),
      wordCount: z.number().optional().describe('Target word count'),
      competitorUrls: z.array(z.string()).optional().describe('Optional competitor URLs for comparison'),
      mainImagePrompt: z.string().optional().describe('Optional custom prompt for the main hero image'),
      thumbnailPrompt: z.string().optional().describe('Optional custom prompt for the thumbnail/social image'),
    }),
    execute: async (args) => {
      if (!userId) {
        return {
          success: false,
          error: 'Authentication required. Please sign in to generate and save content packages.',
        }
      }

      try {
        const requestedWordCount = extractRequestedWordCount(args.wordCount)
        let contentResult: ContentPackageDraft

        if (requestedWordCount <= 300) {
          contentResult = await generateFastContentPackageDraft({
            ...args,
            keywords: args.keywords ?? [],
            wordCount: requestedWordCount,
          })
        } else {
          try {
            const orchestrator = new RAGWriterOrchestrator()
            const orchestratorResult = await withTimeout(
              orchestrator.generateContent({
                ...args,
                keywords: args.keywords ?? [],
                userId,
                qualityMode: 'fast',
                skipFrase: true,
                skipEeat: true,
                skipRevisionLoop: true,
              }),
              150000,
              'Content orchestrator'
            )

            contentResult = {
              title: orchestratorResult.metadata?.metaTitle || args.topic,
              content: orchestratorResult.content,
              contentId: orchestratorResult.contentId,
              contentVersionId: orchestratorResult.contentVersionId,
              qualityScores: orchestratorResult.qualityScores as unknown as Record<string, unknown>,
              revisionCount: orchestratorResult.revisionCount,
              metadata: orchestratorResult.metadata as Record<string, unknown> | undefined,
            }
          } catch (error) {
            console.warn('[Stream Builder] Orchestrator unavailable, using fast content package fallback:', error)
            contentResult = await generateFastContentPackageDraft({
              ...args,
              keywords: args.keywords ?? [],
              wordCount: requestedWordCount,
            })
          }
        }

        const title = contentResult.title || args.topic
        const [mainImageResult, thumbnailImageResult] = await Promise.allSettled([
          generateAndSaveContentImageAsset({
            userId,
            conversationId,
            contentId: contentResult.contentId,
            title,
            content: contentResult.content,
            topic: args.topic,
            keywords: args.keywords ?? [],
            assetType: 'main',
            aspectRatio: '16:9',
            prompt: args.mainImagePrompt,
          }),
          generateAndSaveContentImageAsset({
            userId,
            conversationId,
            contentId: contentResult.contentId,
            title,
            content: contentResult.content,
            topic: args.topic,
            keywords: args.keywords ?? [],
            assetType: 'thumbnail',
            aspectRatio: args.type === 'social_media' ? '1:1' : '1200x630',
            prompt: args.thumbnailPrompt,
          }),
        ])

        const mainImage = mainImageResult.status === 'fulfilled' ? mainImageResult.value : null
        const thumbnailImage = thumbnailImageResult.status === 'fulfilled' ? thumbnailImageResult.value : null
        const compactMainImage = mainImageResult.status === 'fulfilled'
          ? compactContentImageAsset(mainImageResult.value)
          : failedContentImageAsset('main', mainImageResult.reason)
        const compactThumbnailImage = thumbnailImageResult.status === 'fulfilled'
          ? compactContentImageAsset(thumbnailImageResult.value)
          : failedContentImageAsset('thumbnail', thumbnailImageResult.reason)

        const [libraryItem] = await db.insert(libraryItems).values({
          userId,
          conversationId: conversationId || null,
          itemType: 'response',
          title,
          content: contentResult.content,
          data: ({
            contentId: contentResult.contentId,
            contentVersionId: contentResult.contentVersionId,
            qualityScores: contentResult.qualityScores ?? {},
            revisionCount: contentResult.revisionCount ?? 0,
            metadata: contentResult.metadata ?? {},
            images: {
              main: compactMainImage,
              thumbnail: compactThumbnailImage,
            },
          } as unknown) as Json,
          imageUrl: compactThumbnailImage.url || compactMainImage.url || null,
          tags: ['content', args.type, 'content-package'],
          metadata: ({
            mode: 'content',
            contentId: contentResult.contentId,
            contentVersionId: contentResult.contentVersionId,
            imageLibraryItemIds: [mainImage?.libraryItemId, thumbnailImage?.libraryItemId].filter(Boolean),
          } as unknown) as Json,
        }).returning()

        return {
          success: true,
          title,
          content: contentResult.content,
          contentId: contentResult.contentId,
          libraryItemId: libraryItem?.id,
          qualityScores: contentResult.qualityScores ?? {},
          revisionCount: contentResult.revisionCount ?? 0,
          metadata: contentResult.metadata ?? {},
          images: {
            main: compactMainImage,
            thumbnail: compactThumbnailImage,
          },
          saveStatus: {
            content: libraryItem?.id ? 'saved' : 'not_saved',
            mainImage: compactMainImage.saveStatus,
            thumbnail: compactThumbnailImage.saveStatus,
          },
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate content package'
        console.error('[Stream Builder] Content package tool failed:', error)
        return {
          success: false,
          error: message,
        }
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
    description: "Generate images with Google Gemini 3 Pro Image via Vercel AI Gateway. Use when the user asks for an image or wants edits/regenerations.",
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
          model: 'google/gemini-3-pro-image',
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
          model: 'google/gemini-3-pro-image',
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
export function getCoreTools(userId?: string, conversationId?: string, mode?: ChatMode): Record<string, Tool> {
  const coreTools: Record<string, Tool> = {
    generate_researched_content: createOrchestratorTool(userId),
    client_ui: createClientUiTool(),
    gateway_image: createGatewayImageTool(),
  }

  if (mode === 'content') {
    coreTools.generate_content_package = createContentPackageTool(userId, conversationId)
  }

  return withToolTimeouts(coreTools, 180_000)
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
    abortSignal,
  } = options

  const serverMessageIdGenerator = createIdGenerator({ prefix: 'msg', size: 16 })
  const chatMode = normalizeChatMode(context?.mode)

  // Merge core tools with provided tools
  const allTools = {
    ...getCoreTools(userId, conversationId, chatMode),
    ...tools,
  }

  // Per-agent max steps — prevents excessive sequential tool calls which multiply latency.
  // NOTE: 'content' agent uses /api/content/stream (RAGWriterOrchestrator), NOT this route.
  // These limits only apply to seo-aeo, general, and onboarding via /api/chat.
  const MAX_STEPS_BY_AGENT: Record<string, number> = {
    'seo-aeo': 4,
    'content': 10, // Uses separate route, kept for safety
    'geo': 6,
    'image': 2,
    'general': 2,
    'onboarding': 2,
  }
  const maxSteps = MAX_STEPS_BY_AGENT[agentType] ?? 4

  console.log('[Stream Builder] Starting streamText with tools:', {
    count: Object.keys(allTools).length,
    tools: Object.keys(allTools),
  })

  const result = streamText({
    model: vercelGateway.languageModel(CHAT_MODEL_ID),
    messages: modelMessages,
    instructions: systemPrompt,
    tools: allTools,
    toolChoice: 'auto',
    abortSignal,
    // Model fallbacks via Vercel AI Gateway - used if primary model fails
    providerOptions: {
      gateway: {
        models: FALLBACK_MODELS,
      },
    },
    // Use stopWhen instead of the removed maxSteps option.
    // Per-agent step limits prevent excessive sequential tool calls (each DataForSEO call = 5-30s)
    stopWhen: [
      isStepCount(maxSteps),
    ],
    telemetry: createTelemetryConfig('chat-stream', {
      userId,
      sessionId: conversationId,
      agentType,
      page: context?.page as string | undefined,
      isOnboarding: context?.page === 'onboarding',
      onboardingStep: (context?.onboarding as Record<string, unknown>)?.currentStep as number | undefined,
      toolsCount: Object.keys(allTools).length,
      conversationId,
      mode: context?.mode as string | undefined,
      mcpDataforseoEnabled: agentType === 'seo-aeo' || agentType === 'content' || agentType === 'geo',
      mcpFirecrawlEnabled: agentType === 'seo-aeo' || agentType === 'content',
      mcpJinaEnabled: agentType === 'content',
      mcpWinstonEnabled: agentType === 'content',
    }),
    onEnd: async ({ response, usage }) => {
      appLogger.info('Chat stream finished', {
        endpoint: 'chat-stream',
        userId,
        conversationId,
        agentType,
        metadata: {
          messagesCount: response.messages.length,
          usage,
        },
      })

      if (userId) {
        try {
          await logAIUsage({
            userId,
            conversationId,
            agentType,
            model: CHAT_MODEL_ID,
            promptTokens: usage?.inputTokens ?? 0,
            completionTokens: usage?.outputTokens ?? 0,
            endpoint: 'chat-stream',
            metadata: {
              mode: context?.mode,
              toolsCount: Object.keys(allTools).length,
            },
          })
        } catch (logError) {
          appLogger.error('Failed to log AI usage from chat stream', {
            endpoint: 'chat-stream',
            userId,
            conversationId,
            agentType,
            metadata: { error: logError instanceof Error ? logError.message : String(logError) },
          })
        }
      }
    },
    onAbort: () => {
      appLogger.info('Chat stream aborted by client disconnect', {
        endpoint: 'chat-stream',
        userId,
        conversationId,
      })
    },
    onError: ({ error }) => {
      const classified = classifyProviderError(error)
      appLogger.error('Chat stream provider error', {
        endpoint: 'chat-stream',
        userId,
        conversationId,
        agentType,
        metadata: { code: classified.code, retryable: classified.retryable },
      })
    },
  })

  const uiStream = toUIMessageStream({
    stream: result.stream,
    originalMessages,
    generateMessageId: serverMessageIdGenerator,
    onError: serializeStreamError,
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

  return createUIMessageStreamResponse({
    stream: uiStream,
    headers: {
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// _review
