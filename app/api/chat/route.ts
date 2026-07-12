/**
 * Chat API Route
 *
 * Handles chat messages by orchestrating intent classification, tool assembly,
 * and streaming responses. Uses the lib/chat modules for all core logic.
 *
 * Flow:
 * 1. Rate limiting
 * 2. Parse and validate request body
 * 3. Subscription + credit limit checks
 * 4. Get user and resolve conversation
 * 5. Check for workflow triggers
 * 6. Orchestrate chat (classify, assemble tools, stream)
 * 7. Return streaming response
 */

import { after } from 'next/server'
import { NextRequest } from 'next/server'
import { trace } from '@opentelemetry/api'
import {
  observe,
  updateActiveObservation,
} from '@langfuse/tracing'
import { updateActiveTrace } from '@/lib/observability/langfuse-tracing'

import { getCurrentUser } from '@/lib/auth'
import { requireApiSubscription } from '@/lib/billing/subscription-guard'
import { checkCreditLimit } from '@/lib/usage/limit-check'
import { rateLimitMiddleware } from '@/lib/redis/rate-limit'
import { handleApiError } from '@/lib/errors/handlers'
import {
  validateMessages,
  extractLastUserMessageContent,
  convertToModelFormat,
  type RequestBody,
} from '@/lib/chat/message-handler'
import { classifyUserIntent, buildAgentSystemPrompt, type AgentType } from '@/lib/chat/intent-classifier'
import { resolveEffectiveAgent, shouldLoadRagContext } from '@/lib/chat/api-routing'
import { assembleTools } from '@/lib/chat/tool-assembler'
import { buildStreamResponse, type StreamOptions } from '@/lib/chat/stream-builder'
import {
  autosaveUserMessage,
  persistAssistantMessages,
  ensureChatForUser,
  type PersistedMessage,
} from '@/lib/chat/persistence'
import { detectWorkflowTrigger } from '@/lib/chat/orchestrator'
import { buildSeoAeoContext } from '@/lib/chat/seo-aeo-context'
import { normalizeChatMode } from '@/lib/chat/modes'
import { scheduleLangfuseFlush } from '@/lib/observability/flush-traces'
import { appLogger } from '@/lib/observability/app-logger'
import { buildProductionTraceTags } from '@/lib/observability/langfuse-ops'
import { captureServerProductEvent } from '@/lib/analytics/posthog-server'
import { PRODUCT_EVENTS } from '@/lib/analytics/product-events'

export const maxDuration = 300 // 5 minutes

const handler = async (req: Request) => {
  appLogger.info('Chat API POST handler called', { endpoint: '/api/chat' })

  const nextReq = req as unknown as NextRequest

  // 1. Rate limiting
  const rateLimitResponse = await rateLimitMiddleware(nextReq, 'CHAT')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Wire request abort through the full handler lifecycle
  const abortController = new AbortController()
  req.signal.addEventListener('abort', () => {
    console.log('[Chat API] Client disconnected, aborting chat stream')
    abortController.abort()
  })

  try {
    // 2. Parse request body
    const body = (await req.json()) as RequestBody
    console.log('[Chat API] Request body:', JSON.stringify({
      messagesCount: body.messages?.length,
      hasContext: !!body.context,
      chatId: body.chatId,
      mode: body.context?.mode,
    }))

    const { messages: incomingMessages, chatId, context } = body
    const mode = normalizeChatMode(context?.mode)
    const modeContext = { ...(context || {}), mode, chatMode: mode }
    const agentId = context?.agentId || 'general'
    const isOnboardingPage = context?.page === 'onboarding'

    // 3. Validate messages
    const validationError = validateMessages(incomingMessages)
    if (validationError) return validationError

    // 4. Subscription + credit limit enforcement
    const subscriptionCheck = await requireApiSubscription()
    if (!subscriptionCheck.success) {
      return new Response(
        JSON.stringify({
          error: subscriptionCheck.error?.code || 'subscription_required',
          message: subscriptionCheck.error?.message || 'Active subscription required to use chat.',
          code: subscriptionCheck.error?.code || 'subscription_required',
        }),
        {
          status: subscriptionCheck.error?.status || 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const authUserId = subscriptionCheck.userId
    if (!authUserId) {
      return new Response(
        JSON.stringify({
          error: 'authentication_required',
          message: 'Authentication required',
          code: 'authentication_required',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const creditCheck = await checkCreditLimit(authUserId, nextReq)
    if (!creditCheck.allowed) {
      void captureServerProductEvent(authUserId, PRODUCT_EVENTS.SUBSCRIPTION_BLOCKED, {
        remainingUsd: creditCheck.remainingUsd,
        limitUsd: creditCheck.limitUsd,
        isPaused: creditCheck.isPaused ?? false,
      })
      appLogger.warn('Chat blocked by credit limit', {
        endpoint: '/api/chat',
        userId: authUserId,
        metadata: {
          remainingUsd: creditCheck.remainingUsd,
          limitUsd: creditCheck.limitUsd,
        },
      })
      return new Response(
        JSON.stringify({
          error: 'credit_limit_exceeded',
          code: 'credit_limit_exceeded',
          message: creditCheck.reason || 'Monthly usage limit reached. Please upgrade to continue.',
          remainingUsd: creditCheck.remainingUsd,
          limitUsd: creditCheck.limitUsd,
          resetDate: creditCheck.resetDate?.toISOString(),
          isPaused: creditCheck.isPaused ?? false,
          pauseUntil: creditCheck.pauseUntil?.toISOString(),
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 5. Get current user (for display metadata; auth already verified above)
    const user = await getCurrentUser()

    // Apply user-specific rate limiting
    const userRateLimitResponse = await rateLimitMiddleware(nextReq, 'CHAT', authUserId)
    if (userRateLimitResponse) {
      return userRateLimitResponse
    }

    // 6. Resolve conversation
    const requestedConversationId = chatId || context?.conversationId
    const resolvedAgentType = agentId || context?.agentType || 'general'
    let activeConversationId = requestedConversationId ?? null

    if (user) {
      try {
        const conversationRecord = await ensureChatForUser({
          userId: user.id,
          requestedChatId: requestedConversationId,
          agentType: resolvedAgentType,
        })

        activeConversationId = conversationRecord.id
      } catch (error) {
        console.error('[Chat API] Conversation lookup/creation failed:', error)
        activeConversationId = null
      }
    }

    // 7. Extract last user message for intent detection and workflow check
    const lastUserMessageContent = extractLastUserMessageContent(incomingMessages!)

    // 8. Check for workflow triggers
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

    // 9. Classify user intent — skipped when chatMode is set (SEO/GEO/Content)
    const classification = await classifyUserIntent({
      query: lastUserMessageContent,
      context: modeContext,
    })

    console.log('[Chat API] Agent routing result:', {
      agent: classification.agent,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      toolsCount: classification.tools.length,
    })

    // 10. Update Langfuse trace with context
    updateActiveObservation({
      input: lastUserMessageContent,
    })

    updateActiveTrace({
      name: 'chat-message',
      sessionId: activeConversationId || undefined,
      userId: user?.id || authUserId,
      input: lastUserMessageContent,
      tags: buildProductionTraceTags(mode),
      metadata: {
        agentType: classification.agent,
        mode,
        page: context?.page,
        isOnboarding: isOnboardingPage,
        workflowId: workflowResult.workflowId || undefined,
      },
    })

    // 11. Build system prompt for the selected agent
    const effectiveAgent: AgentType = resolveEffectiveAgent(classification.agent, mode)

    const systemPrompt = buildAgentSystemPrompt(
      effectiveAgent,
      modeContext,
      classification.allIntents
    )

    // 12. Assemble tools + (for seo-aeo) fetch RAG context in parallel
    const emptyRagContext = { systemPromptAddendum: '', ragDocsFound: 0 }
    const [tools, ragContext] = await Promise.all([
      assembleTools({
        agent: effectiveAgent,
        intentTools: classification.tools,
        userId: user?.id,
        request: req,
      }),
      shouldLoadRagContext(effectiveAgent)
        ? (async () => {
            const controller = new AbortController()
            let timeoutId: ReturnType<typeof setTimeout> | undefined

            const onClientAbort = () => controller.abort()
            abortController.signal.addEventListener('abort', onClientAbort)

            const ragPromise = buildSeoAeoContext(lastUserMessageContent, user?.id, {
              signal: controller.signal,
              mode,
            }).catch(err => {
              const message = err instanceof Error ? err.message : String(err)
              console.warn('[Chat API] SEO-AEO context fetch failed:', message)
              return emptyRagContext
            })

            try {
              return await Promise.race([
                ragPromise,
                new Promise<typeof emptyRagContext>(resolve => {
                  timeoutId = setTimeout(() => {
                    console.warn('[Chat API] SEO-AEO RAG timed out after 6s; skipping to avoid blocking stream')
                    controller.abort(new Error('SEO-AEO RAG timed out after 6s'))
                    resolve(emptyRagContext)
                  }, 6000)
                })
              ])
            } finally {
              if (timeoutId) clearTimeout(timeoutId)
              abortController.signal.removeEventListener('abort', onClientAbort)
              controller.abort()
            }
          })()
        : Promise.resolve(emptyRagContext),
    ])

    if (abortController.signal.aborted) {
      return new Response(null, { status: 499 })
    }

    if (ragContext.ragDocsFound > 0) {
      console.log(`[Chat API] Injecting ${ragContext.ragDocsFound} RAG docs into system prompt`)
    }

    console.log('[Chat API] Final validated tools for streamText:', {
      count: Object.keys(tools).length,
      tools: Object.keys(tools),
    })

    // 13. Convert messages to model format (with context trimming)
    const modelMessages = await convertToModelFormat(incomingMessages!)
    console.log('[Chat API] Converted to ModelMessage[], count:', modelMessages.length)

    // 13.5 Save user message off the critical path
    if (activeConversationId && user) {
      const lastUserMessage = incomingMessages![incomingMessages!.length - 1]
      if (lastUserMessage?.role === 'user') {
        after(async () => {
          try {
            await autosaveUserMessage({
              userId: user.id,
              chatId: activeConversationId!,
              message: lastUserMessage as PersistedMessage,
            })
            console.log('[Chat API] User message saved (background)')
          } catch (saveError) {
            console.error('[Chat API] Failed to save user message:', saveError)
          }
        })
      }
    }

    // 14. Build stream options
    const enrichedSystemPrompt = systemPrompt + ragContext.systemPromptAddendum
    const streamOptions: StreamOptions = {
      modelMessages,
      systemPrompt: enrichedSystemPrompt,
      tools,
      userId: user?.id ?? authUserId,
      conversationId: activeConversationId || undefined,
      agentType: effectiveAgent,
      context: modeContext as Record<string, unknown>,
      originalMessages: incomingMessages!,
      abortSignal: abortController.signal,
      onFinish: async ({ messages: uiMessages }) => {
        console.log('[Chat API] toUIMessageStreamResponse onFinish:', {
          hasMessages: !!uiMessages?.length,
          messageCount: uiMessages?.length || 0,
          activeConversationId,
          hasUser: !!user,
        })

        if (!uiMessages?.length || !activeConversationId || !user) {
          console.warn('[Chat API] Skipping assistant message save - missing required data')
          return
        }

        try {
          await persistAssistantMessages({
            userId: user.id,
            chatId: activeConversationId,
            messagesToPersist: uiMessages as PersistedMessage[],
          })
          console.log('[Chat API] Assistant message(s) saved successfully')
        } catch (saveError) {
          console.error('[Chat API] Failed to save assistant message:', saveError)
        }
      },
    }

    // 15. Build and return streaming response
    const streamResponse = await buildStreamResponse(streamOptions)

    // 16. Critical for serverless: flush traces before function terminates
    scheduleLangfuseFlush()

    return streamResponse
  } catch (error) {
    console.error('Chat API error:', error)

    updateActiveObservation({
      output: error instanceof Error ? error.message : String(error),
      level: 'ERROR',
    })
    updateActiveTrace({
      output: error instanceof Error ? error.message : String(error),
    })
    trace.getActiveSpan()?.end()

    return handleApiError(error, 'Failed to process chat request')
  }
}

export const POST = observe(handler, {
  name: 'handle-chat-message',
  endOnExit: false,
})

// _review
