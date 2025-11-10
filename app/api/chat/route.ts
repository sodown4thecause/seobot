import { ToolLoopAgent, createAgentUIStreamResponse, tool, stepCountIs } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { buildOnboardingSystemPrompt } from '@/lib/onboarding/prompts'
import { type OnboardingData, type OnboardingStep } from '@/lib/onboarding/state'
import { serverEnv } from '@/lib/config/env'
import {
  findRelevantFrameworks,
  formatFrameworksForPrompt,
  batchIncrementUsage
} from '@/lib/ai/rag-service'
import {
  handleDataForSEOFunctionCall
} from '@/lib/ai/dataforseo-tools'
import { getDataForSEOTools } from '@/lib/mcp/dataforseo-client'
import { rateLimitMiddleware } from '@/lib/redis/rate-limit'
import { z } from 'zod'

export const runtime = 'edge'

// Using xAI Grok for fast reasoning and tool calling support
const CHAT_MODEL_ID = 'grok-beta'
const xai = createOpenAI({
  apiKey: serverEnv.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
})

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content?: string  // Legacy format
  parts?: Array<{ type: string; text?: string }>  // AI SDK v5 format
}

interface OnboardingContext {
  currentStep?: number
  data?: OnboardingData
}

interface ChatContext {
  page?: string
  onboarding?: OnboardingContext
  [key: string]: unknown
}

interface RequestBody {
  messages: ChatMessage[]
  context?: ChatContext
}

export async function POST(req: Request) {
  // Check rate limit
  const rateLimitResponse = await rateLimitMiddleware(req as any, 'CHAT')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = (await req.json()) as RequestBody
    const { messages, context } = body
    
    // Debug logging
    console.log('[Chat API] Received request:', {
      messageCount: messages?.length || 0,
      lastMessage: messages?.[messages.length - 1],
      hasContext: !!context
    })
    
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Extract onboarding context if present
    const onboardingContext = context?.onboarding
    const isOnboarding = context?.page === 'onboarding'
    
    // Extract message content - handle both AI SDK v5 format (parts) and legacy format (content)
    const extractMessageContent = (msg: ChatMessage): string => {
      if (msg.parts && Array.isArray(msg.parts)) {
        // AI SDK v5 format
        const textPart = msg.parts.find(p => p.type === 'text')
        return textPart?.text || ''
      }
      return msg.content || ''
    }
    
    // Extract last user message
    const lastUserMessage = messages[messages.length - 1]
    const lastUserMessageContent = extractMessageContent(lastUserMessage)

    // WORKFLOW DETECTION: Check if user wants to run a workflow
    const { detectWorkflow, isWorkflowRequest, extractWorkflowId } = await import('@/lib/workflows')
    const detectedWorkflowId = detectWorkflow(lastUserMessageContent)
    const isExplicitWorkflowRequest = isWorkflowRequest(lastUserMessageContent)
    const explicitWorkflowId = extractWorkflowId(lastUserMessageContent)

    const workflowId = explicitWorkflowId || detectedWorkflowId

    if (workflowId) {
      console.log('[Chat API] Workflow detected:', workflowId)
      // Return a message indicating workflow execution
      // The actual workflow will be executed via the /api/workflows/execute endpoint
      return new Response(
        JSON.stringify({
          type: 'workflow',
          workflowId,
          message: `Starting workflow: ${workflowId}. Please use the workflow API endpoint to execute.`,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // RAG: Detect if query needs framework assistance
    const shouldUseRAG = detectFrameworkIntent(lastUserMessageContent)

    let retrievedFrameworks: string = ''
    let frameworkIds: string[] = []
    
    // RAG: Retrieve relevant frameworks if needed
    if (shouldUseRAG && !isOnboarding) {
      try {
        const ragStartTime = Date.now()
        const frameworks = await findRelevantFrameworks(lastUserMessageContent, {
          maxResults: 3,
        })
        
        if (frameworks.length > 0) {
          retrievedFrameworks = formatFrameworksForPrompt(frameworks)
          frameworkIds = frameworks.map(f => f.id)
          const ragDuration = Date.now() - ragStartTime
          console.log(`[Chat] RAG retrieved ${frameworks.length} frameworks in ${ragDuration}ms`)
        }
      } catch (error) {
        // Graceful degradation: continue without RAG if retrieval fails
        console.warn('[Chat] RAG retrieval failed, continuing without frameworks:', error)
      }
    }
    
    // Build system prompt based on context
    let systemPrompt: string
    if (isOnboarding && onboardingContext) {
      const currentStep = onboardingContext.currentStep || 1
      const onboardingData = onboardingContext.data || {}
      systemPrompt = buildOnboardingSystemPrompt(currentStep as OnboardingStep, onboardingData as OnboardingData)
    } else {
      systemPrompt = buildGeneralSystemPrompt(context, retrievedFrameworks)
    }

    // Convert messages to AI SDK v5 format
    const systemMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = []
    const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    
    // Add system prompt
    systemMessages.push({ role: 'system', content: systemPrompt })
    
    // Convert user messages
    messages.forEach((msg) => {
      const content = extractMessageContent(msg)
      if (content) {
        if (msg.role === 'user') {
          conversationMessages.push({ role: 'user', content })
        } else if (msg.role === 'assistant') {
          conversationMessages.push({ role: 'assistant', content })
        }
      }
    })
    
    // Load tools from DataForSEO MCP server
    let seoTools: Record<string, any>
    let mcpConnected = false

    console.log('[Chat API] Attempting to load tools from MCP server...')
    console.log('[Chat API] MCP URL:', serverEnv.DATAFORSEO_MCP_URL)

    try {
      const mcpTools = await getDataForSEOTools()
      if (mcpTools && Object.keys(mcpTools).length > 0) {
        mcpConnected = true
        seoTools = mcpTools
        console.log(`[Chat API] Successfully loaded ${Object.keys(seoTools).length} tools from MCP server`)
        console.log('[Chat API] Sample MCP tools:', Object.keys(seoTools).slice(0, 5))
      } else {
        console.log('[Chat API] No tools returned from MCP server, using fallback')
        mcpConnected = false
        seoTools = {
          ai_keyword_search_volume: tool({
            description: 'Get search volume for keywords in AI platforms like ChatGPT, Claude, Perplexity. Use for GEO (Generative Engine Optimization) analysis.',
            inputSchema: z.object({
              keywords: z.array(z.string()).describe('Keywords to analyze in AI platforms'),
              location: z.string().optional().describe('Location (e.g., "United States", "United Kingdom")'),
            }),
            execute: async (args: { keywords: string[]; location?: string }) => {
              return await handleDataForSEOFunctionCall('ai_keyword_search_volume', args)
            },
          }),
          keyword_search_volume: tool({
            description: 'Get Google search volume, CPC, and competition for keywords. Core keyword research tool.',
            inputSchema: z.object({
              keywords: z.array(z.string()).describe('Keywords to analyze (max 100)'),
              location: z.string().optional().describe('Location for data'),
            }),
            execute: async (args: { keywords: string[]; location?: string }) => {
              return await handleDataForSEOFunctionCall('keyword_search_volume', args)
            },
          }),
          google_rankings: tool({
            description: 'Get current Google SERP results for a keyword including position, URL, title, and SERP features.',
            inputSchema: z.object({
              keyword: z.string().describe('Keyword to check rankings for'),
              location: z.string().optional().describe('Location for SERP results'),
            }),
            execute: async (args: { keyword: string; location?: string }) => {
              return await handleDataForSEOFunctionCall('google_rankings', args)
            },
          }),
          domain_overview: tool({
            description: 'Get comprehensive SEO metrics for a domain: traffic, keywords, rankings, visibility. This is an expensive operation that requires user approval.',
            inputSchema: z.object({
              domain: z.string().describe('Domain to analyze (without http://)'),
              location: z.string().optional().describe('Location for metrics'),
            }),
            needsApproval: true,
            execute: async (args: { domain: string; location?: string }) => {
              return await handleDataForSEOFunctionCall('domain_overview', args)
            },
          }),
        }
        console.log(`[Chat API] Using fallback: ${Object.keys(seoTools).length} direct API tools`)
      }
    } catch (error) {
      console.error('[Chat API] Failed to load MCP tools:', error)
      mcpConnected = false
      seoTools = {
        ai_keyword_search_volume: tool({
          description: 'Get search volume for keywords in AI platforms like ChatGPT, Claude, Perplexity. Use for GEO (Generative Engine Optimization) analysis.',
          inputSchema: z.object({
            keywords: z.array(z.string()).describe('Keywords to analyze in AI platforms'),
            location: z.string().optional().describe('Location (e.g., "United States", "United Kingdom")'),
          }),
          execute: async (args: { keywords: string[]; location?: string }) => {
            return await handleDataForSEOFunctionCall('ai_keyword_search_volume', args)
          },
        }),
        keyword_search_volume: tool({
          description: 'Get Google search volume, CPC, and competition for keywords. Core keyword research tool.',
          inputSchema: z.object({
            keywords: z.array(z.string()).describe('Keywords to analyze (max 100)'),
            location: z.string().optional().describe('Location for data'),
          }),
          execute: async (args: { keywords: string[]; location?: string }) => {
            return await handleDataForSEOFunctionCall('keyword_search_volume', args)
          },
        }),
        google_rankings: tool({
          description: 'Get current Google SERP results for a keyword including position, URL, title, and SERP features.',
          inputSchema: z.object({
            keyword: z.string().describe('Keyword to check rankings for'),
            location: z.string().optional().describe('Location for SERP results'),
          }),
          execute: async (args: { keyword: string; location?: string }) => {
            return await handleDataForSEOFunctionCall('google_rankings', args)
          },
        }),
        domain_overview: tool({
          description: 'Get comprehensive SEO metrics for a domain: traffic, keywords, rankings, visibility. This is an expensive operation that requires user approval.',
          inputSchema: z.object({
            domain: z.string().describe('Domain to analyze (without http://)'),
            location: z.string().optional().describe('Location for metrics'),
          }),
          needsApproval: true,
          execute: async (args: { domain: string; location?: string }) => {
            return await handleDataForSEOFunctionCall('domain_overview', args)
          },
        }),
      }
      console.log(`[Chat API] Using fallback after error: ${Object.keys(seoTools).length} direct API tools`)
    }
    
    // Debug logging
    console.log('[Chat API] Streaming with:', {
      conversationMessageCount: conversationMessages.length,
      systemPromptLength: systemPrompt.length,
      toolsCount: Object.keys(seoTools).length,
      mcpConnected: mcpConnected,
      mcpUrl: serverEnv.DATAFORSEO_MCP_URL || 'not set (using default)'
    })

    // Create ToolLoopAgent for automatic multi-step tool calling (AI SDK 6)
    const agent = new ToolLoopAgent({
      model: xai(CHAT_MODEL_ID),
      instructions: systemPrompt,
      tools: seoTools,
      // Stop after 5 steps OR when no tools are called (prevents runaway costs)
      stopWhen: [
        stepCountIs(5), // Stop after 5 steps max
        ({ steps }) => {
          // Stop if the last step had no tool calls
          const lastStep = steps[steps.length - 1]
          return lastStep?.toolCalls?.length === 0
        },
      ],
      // Enable telemetry for monitoring
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'chat-api',
        metadata: {
          environment: process.env.NODE_ENV || 'development',
          runtime: 'edge',
          model: CHAT_MODEL_ID,
        },
      },
    })

    // Convert messages to UIMessage format expected by AI SDK 6
    const uiMessages = conversationMessages.map((m) => ({
      id: (globalThis as any).crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role: m.role,
      parts: [{ type: 'text' as const, text: m.content }],
    }))

    console.log('[Chat API] Starting agent stream response...')
    console.log('[Chat API] Passing to agent:', {
      messageCount: uiMessages.length,
      lastMessage: uiMessages[uiMessages.length - 1]?.parts[0]?.text?.slice(0, 100),
      toolCount: Object.keys(seoTools).length,
    })

    // Stream UI messages using the agent
    return createAgentUIStreamResponse({
      agent,
      messages: uiMessages,
      onFinish: async ({ messages: finalMessages, responseMessage, isAborted }) => {
        console.log('[Chat API] Agent finished:', {
          messageCount: finalMessages.length,
          isAborted,
          responseMessageId: responseMessage.id,
        })

        // Save messages after completion
        if (user && !authError) {
          await saveChatMessages(supabase, user.id, messages, isOnboarding ? onboardingContext : undefined)
          if (isOnboarding && onboardingContext?.data && user.id) {
            await saveOnboardingProgress(supabase, user.id, onboardingContext.data)
          }
        }

        // Track framework usage
        if (frameworkIds.length > 0) {
          batchIncrementUsage(frameworkIds).catch(err =>
            console.warn('[Chat] Failed to track framework usage:', err)
          )
        }
      },
      onError: (error) => {
        const err = error as Error
        console.error('[Chat API] Stream error:', {
          message: err?.message,
          stack: err?.stack,
          name: err?.name,
        })

        // Return user-friendly error message
        const errorMessage = 'An error occurred while processing your request. Please try again.'
        return process.env.NODE_ENV === 'development' && err?.message
          ? `${errorMessage} (${err.message})`
          : errorMessage
      },
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Chat API error:', err)
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Detect if user's query should trigger RAG framework retrieval
 */
function detectFrameworkIntent(message: string): boolean {
  const messageLower = message.toLowerCase()
  
  // Action keywords indicating content creation
  const actionKeywords = [
    'write', 'create', 'generate', 'draft', 'compose',
    'build', 'make', 'develop', 'produce', 'craft'
  ]
  
  // Content type keywords
  const contentTypes = [
    'blog post', 'article', 'landing page', 'email',
    'ad', 'social post', 'tweet', 'copy', 'content',
    'headline', 'title', 'description', 'snippet'
  ]
  
  // Framework-specific keywords
  const frameworkKeywords = [
    'structure', 'framework', 'template', 'format',
    'outline', 'organize', 'layout', 'pattern'
  ]
  
  // SEO-specific keywords
  const seoKeywords = [
    'seo', 'optimize', 'rank', 'serp', 'meta',
    'keywords', 'snippet', 'schema', 'featured',
    'paa', 'people also ask', 'header', 'h1', 'h2'
  ]
  
  // Check if message contains relevant keywords
  const hasActionKeyword = actionKeywords.some(kw => messageLower.includes(kw))
  const hasContentType = contentTypes.some(kw => messageLower.includes(kw))
  const hasFrameworkKeyword = frameworkKeywords.some(kw => messageLower.includes(kw))
  const hasSeoKeyword = seoKeywords.some(kw => messageLower.includes(kw))
  
  // Trigger RAG if:
  // - Action keyword + content type ("write a blog post")
  // - Framework keyword ("what structure should I use")
  // - Action keyword + SEO keyword ("optimize my title")
  return (
    (hasActionKeyword && hasContentType) ||
    hasFrameworkKeyword ||
    (hasActionKeyword && hasSeoKeyword)
  )
}

function buildGeneralSystemPrompt(context?: ChatContext, ragFrameworks?: string): string {
  const basePrompt = `You are an expert SEO assistant helping users improve their search rankings and create optimized content. You are friendly, professional, and provide actionable advice.

Your capabilities include:
- Analyzing websites and competitors
- Finding keyword opportunities
- Creating SEO-optimized content
- Providing strategic recommendations
- Guiding users through setup processes

You have access to 40+ SEO tools through the DataForSEO MCP server. These tools use simplified filter schemas optimized for LLM usage, making them easy to use. The tools cover:
- AI Optimization (ChatGPT, Claude, Perplexity analysis)
- Keyword Research (search volume, suggestions, difficulty)
- SERP Analysis (Google rankings, SERP features)
- Competitor Analysis (domain overlap, competitor discovery)
- Domain Analysis (traffic, keywords, rankings, technologies)
- On-Page Analysis (content parsing, Lighthouse audits)
- Content Generation (optimized content creation)

Be conversational and helpful. Ask clarifying questions when needed. Keep responses concise but informative.`

  let prompt = basePrompt
  
  // Inject RAG frameworks if available
  if (ragFrameworks && ragFrameworks.length > 0) {
    prompt += '\n\n' + ragFrameworks
  }
  
  if (context) {
    prompt += `\n\nCurrent Context: ${JSON.stringify(context)}`
  }

  return prompt
}

async function saveChatMessages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  messages: ChatMessage[],
  onboardingContext?: OnboardingContext
) {
  try {
    const lastMessage = messages[messages.length - 1]
    const content = lastMessage.parts?.find(p => p.type === 'text')?.text || lastMessage.content || ''
    const chatMessage = {
      user_id: userId,
      role: lastMessage.role,
      content: content,
      metadata: onboardingContext ? { onboarding: onboardingContext } : {},
    }

    await supabase.from('chat_messages').insert(chatMessage)
  } catch (error) {
    console.error('Error saving chat messages:', error)
  }
}

async function saveOnboardingProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  data: OnboardingData
) {
  try {
    // Check if profile exists
    const { data: existing } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    const profileData: Record<string, unknown> = {
      user_id: userId,
      website_url: data.websiteUrl || null,
      industry: data.industry || null,
      goals: data.goals || null,
      locations: data.location ? [data.location] : null,
      content_frequency: data.contentFrequency || null,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      await supabase
        .from('business_profiles')
        .update(profileData)
        .eq('user_id', userId)
    } else {
      await supabase
        .from('business_profiles')
        .insert(profileData)
    }
  } catch (error) {
    console.error('Error saving onboarding progress:', error)
  }
}
