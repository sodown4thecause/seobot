/**
 * Chat API Route
 * 
 * Handles chat messages by orchestrating intent classification, tool assembly,
 * and streaming responses. Uses the lib/chat modules for all core logic.
 * 
 * Flow:
 * 1. Rate limiting
 * 2. Parse and validate request body
 * 3. Get user and resolve conversation
 * 4. Check for workflow triggers
 * 5. Orchestrate chat (classify, assemble tools, stream)
 * 6. Return streaming response
 */

import { after } from 'next/server'
import { trace } from '@opentelemetry/api'
import {
  observe,
  updateActiveObservation,
  updateActiveTrace,
} from '@langfuse/tracing'

import { getCurrentUser } from '@/lib/auth/clerk'
import { rateLimitMiddleware } from '@/lib/redis/rate-limit'
import { handleApiError } from '@/lib/errors/handlers'
import {
  validateMessages,
  extractLastUserMessageContent,
  convertToModelFormat,
  type RequestBody,
} from '@/lib/chat/message-handler'
import { classifyUserIntent, buildAgentSystemPrompt } from '@/lib/chat/intent-classifier'
import { assembleTools } from '@/lib/chat/tool-assembler'
import { buildStreamResponse, type StreamOptions } from '@/lib/chat/stream-builder'
import { ensureConversationForUser } from '@/lib/chat/storage'
import { detectWorkflowTrigger } from '@/lib/chat/orchestrator'

export const maxDuration = 300 // 5 minutes

const handler = async (req: Request) => {
  console.log('[Chat API] POST handler called')

  // 1. Rate limiting
  const rateLimitResponse = await rateLimitMiddleware(
    req as unknown as import('next/server').NextRequest,
    'CHAT'
  )
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // 2. Parse request body
    const body = (await req.json()) as RequestBody
    console.log('[Chat API] Request body:', JSON.stringify({
      messagesCount: body.messages?.length,
      hasContext: !!body.context,
      chatId: body.chatId,
    }))

    const { messages: incomingMessages, chatId, context } = body
    const agentId = context?.agentId || 'general'
    const isOnboarding = context?.page === 'onboarding' || !!context?.onboarding

    // 3. Validate messages
    const validationError = validateMessages(incomingMessages)
    if (validationError) return validationError

    // 4. Get current user
    const user = await getCurrentUser()

    // Apply user-specific rate limiting if authenticated
    if (user) {
      const userRateLimitResponse = await rateLimitMiddleware(
        req as unknown as import('next/server').NextRequest,
        'CHAT',
        user.id
      )
      if (userRateLimitResponse) {
        return userRateLimitResponse
      }
    }

    // 5. Resolve conversation
    const requestedConversationId = chatId || context?.conversationId
    const resolvedAgentType = agentId || context?.agentType || 'general'
    let conversationRecord: Awaited<ReturnType<typeof ensureConversationForUser>> | null = null

    if (user) {
      try {
        conversationRecord = await ensureConversationForUser(
          user.id,
          resolvedAgentType
        )
      } catch (error) {
        console.error('[Chat API] Conversation lookup/creation failed:', error)
        // Continue without conversation persistence
      }
    }

    const activeConversationId = conversationRecord?.id ?? requestedConversationId ?? null

    // 6. Extract last user message for intent detection and workflow check
    const lastUserMessageContent = extractLastUserMessageContent(incomingMessages!)

    // 7. Check for workflow triggers
    const workflowResult = await detectWorkflowTrigger(lastUserMessageContent)
    if (workflowResult.isWorkflow && workflowResult.workflowId) {
      console.log('[Chat API] Workflow detected:', workflowResult.workflowId)
      return new Response(
        JSON.stringify({
          type: 'workflow',
          workflowId: workflowResult.workflowId,
          message: `Starting workflow: ${workflowResult.workflowId}. Please use the workflow API endpoint to execute.`,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 8. Classify user intent and route to agent
    const classification = await classifyUserIntent({
      query: lastUserMessageContent,
      context,
    })

    console.log('[Chat API] Agent routing result:', {
      agent: classification.agent,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      toolsCount: classification.tools.length,
    })

    // 9. Update Langfuse trace with context
    updateActiveObservation({
      input: lastUserMessageContent,
    })

    updateActiveTrace({
      name: 'chat-message',
      sessionId: activeConversationId || undefined,
      userId: user?.id || undefined,
      input: lastUserMessageContent,
      metadata: {
        agentType: classification.agent,
        page: context?.page,
        isOnboarding,
        onboardingStep: (context?.onboarding as Record<string, unknown> | undefined)?.currentStep,
        workflowId: workflowResult.workflowId || undefined,
      },
    })

    // 10. Build system prompt for the selected agent
    const systemPrompt = buildAgentSystemPrompt(
      classification.agent,
      context,
      classification.allIntents
    )

    // 11. Assemble tools for the agent
    const tools = await assembleTools({
      agent: classification.agent,
      intentTools: classification.tools,
      userId: user?.id,
      request: req,
    })

    console.log('[Chat API] Final validated tools for streamText:', {
      count: Object.keys(tools).length,
      tools: Object.keys(tools),
    })

    // 12. Convert messages to model format
    const modelMessages = convertToModelFormat(incomingMessages!)
    console.log('[Chat API] Converted to ModelMessage[], count:', modelMessages.length)

    // 13. Build stream options
    const streamOptions: StreamOptions = {
      modelMessages,
      systemPrompt,
      tools,
      userId: user?.id,
      conversationId: activeConversationId || undefined,
      agentType: classification.agent,
      context: context as Record<string, unknown>,
      originalMessages: incomingMessages!,
      onFinish: async ({ messages: uiMessages }) => {
        console.log('[Chat API] toUIMessageStreamResponse onFinish:', {
          hasMessages: !!uiMessages?.length,
          messageCount: uiMessages?.length || 0,
          activeConversationId,
          hasUser: !!user,
        })

        if (!uiMessages?.length || !activeConversationId || !user) {
          console.warn('[Chat API] Skipping assistant message save - missing required data:', {
            hasMessages: !!uiMessages?.length,
            activeConversationId,
            hasUser: !!user,
          })
          return
        }

        const finalAssistantMessage = uiMessages[uiMessages.length - 1]
        if (finalAssistantMessage?.role !== 'assistant') {
          console.warn('[Chat API] Last message is not assistant, skipping save')
          return
        }

        // Log tool invocations for debugging (AI SDK 6 uses parts)
        const toolParts = (finalAssistantMessage as unknown as { 
          parts?: Array<{ type: string; toolInvocation?: Record<string, unknown> }> 
        }).parts?.filter((p) => p.type === 'tool-invocation') || []

        if (toolParts.length > 0) {
          console.log('[Chat API] Final assistant message tool invocations:', {
            count: toolParts.length,
            tools: toolParts.map((t) => ({
              toolName: t.toolInvocation?.toolName,
              hasResult: !!t.toolInvocation?.result,
              resultKeys: t.toolInvocation?.result ? Object.keys(t.toolInvocation.result as Record<string, unknown>) : [],
            })),
          })
        }

        // TODO: Re-enable assistant message persistence once chat storage is migrated to Drizzle
      },
    }

    // 14. Build and return streaming response
    const streamResponse = await buildStreamResponse(streamOptions)

    // 15. Critical for serverless: flush traces before function terminates
    const langfuseSpanProcessor = (global as unknown as { langfuseSpanProcessor?: { forceFlush: () => Promise<void> } }).langfuseSpanProcessor
    if (langfuseSpanProcessor) {
      after(async () => await langfuseSpanProcessor.forceFlush())
    }

    return streamResponse

  } catch (error) {
    console.error('Chat API error:', error)

    // Update trace with error before returning
    updateActiveObservation({
      output: error instanceof Error ? error.message : String(error),
      level: 'ERROR',
    })
    updateActiveTrace({
      output: error instanceof Error ? error.message : String(error),
    })
    trace.getActiveSpan()?.end()

    // Use standardized error handler
    return handleApiError(error, 'Failed to process chat request')
  }
}

// Wrap handler with observe() to create a Langfuse trace
export const POST = observe(handler, {
  name: 'handle-chat-message',
  endOnExit: false, // Don't end observation until stream finishes
})
