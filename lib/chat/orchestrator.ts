/**
 * Chat Orchestrator Module
 * 
 * Orchestrates the chat flow by coordinating:
 * - Message handling and conversion
 * - Intent classification and agent routing
 * - Tool assembly
 * - Stream building
 * 
 * This module extracts the core orchestration logic from the API route,
 * making it testable and reusable.
 */

import { type UIMessage, type ModelMessage, type Tool } from 'ai'
import { 
  updateActiveObservation, 
  updateActiveTrace 
} from '@langfuse/tracing'

import { 
  convertToModelFormat, 
  extractLastUserMessageContent,
  validateMessages,
  type ChatContext,
  type RequestBody 
} from './message-handler'
import { 
  classifyUserIntent, 
  buildAgentSystemPrompt, 
  type AgentType,
  type ClassificationResult 
} from './intent-classifier'
import { assembleTools } from './tool-assembler'
import { buildStreamResponse, getCoreTools, type StreamOptions } from './stream-builder'
import { ensureConversationForUser } from './storage'
import { getCurrentUser } from '@/lib/auth/clerk'
import { AgentRouter } from '@/lib/agents/agent-router'

export interface ChatOrchestrationOptions {
  messages: UIMessage[]
  chatId?: string
  context?: ChatContext
  userId?: string
  request?: Request
}

export interface ChatOrchestrationResult {
  response: Response
  agent: AgentType
  conversationId: string | null
  classification: ClassificationResult
}

/**
 * Main orchestration function that coordinates the entire chat flow.
 * 
 * Flow:
 * 1. Validate messages
 * 2. Resolve user and conversation
 * 3. Extract user intent
 * 4. Classify intent and route to agent
 * 5. Build system prompt
 * 6. Assemble tools
 * 7. Convert messages
 * 8. Build and return stream
 */
export async function orchestrateChat(
  options: ChatOrchestrationOptions
): Promise<ChatOrchestrationResult> {
  const { messages, chatId, context, request } = options

  // Step 1: Validate messages
  const validationError = validateMessages(messages)
  if (validationError) {
    throw new ChatValidationError('Messages array is required and must not be empty')
  }

  // Step 2: Resolve user and conversation
  const user = await getCurrentUser()
  const resolvedAgentType = context?.agentId || context?.agentType || 'general'
  
  let conversationRecord: Awaited<ReturnType<typeof ensureConversationForUser>> | null = null
  let activeConversationId = chatId || context?.conversationId || null

  if (user) {
    try {
      conversationRecord = await ensureConversationForUser(
        user.id,
        resolvedAgentType
      )
      activeConversationId = conversationRecord?.id ?? activeConversationId
    } catch (error) {
      console.error('[Chat Orchestrator] Conversation lookup/creation failed:', error)
      // Continue without conversation persistence
    }
  }

  // Step 3: Extract user query for classification
  const lastUserMessageContent = extractLastUserMessageContent(messages)

  // Step 4: Classify intent and route to agent
  const classification = await classifyUserIntent({
    query: lastUserMessageContent,
    context,
  })

  console.log('[Chat Orchestrator] Classification result:', {
    agent: classification.agent,
    confidence: classification.confidence,
    toolsCount: classification.tools.length,
  })

  // Update Langfuse trace with context
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
      isOnboarding: context?.page === 'onboarding' || !!context?.onboarding,
      onboardingStep: (context?.onboarding as Record<string, unknown>)?.currentStep,
    },
  })

  // Step 5: Build system prompt
  const systemPrompt = buildAgentSystemPrompt(
    classification.agent,
    context,
    classification.allIntents
  )

  // Step 6: Assemble tools
  const tools = await assembleTools({
    agent: classification.agent,
    intentTools: classification.tools,
    userId: user?.id,
    request,
  })

  // Step 7: Convert messages to model format
  const modelMessages = convertToModelFormat(messages)

  console.log('[Chat Orchestrator] Building stream with:', {
    messageCount: modelMessages.length,
    toolCount: Object.keys(tools).length,
    agent: classification.agent,
  })

  // Step 8: Build and return stream
  const streamOptions: StreamOptions = {
    modelMessages,
    systemPrompt,
    tools,
    userId: user?.id,
    conversationId: activeConversationId || undefined,
    agentType: classification.agent,
    context: context as Record<string, unknown>,
    originalMessages: messages,
    onFinish: async ({ messages: uiMessages }) => {
      console.log('[Chat Orchestrator] Stream finished:', {
        messageCount: uiMessages?.length || 0,
        conversationId: activeConversationId,
      })
      // TODO: Re-enable message persistence when chat storage is migrated
    },
  }

  const response = await buildStreamResponse(streamOptions)

  return {
    response,
    agent: classification.agent,
    conversationId: activeConversationId,
    classification,
  }
}

/**
 * Check if a message contains a workflow trigger.
 */
export async function detectWorkflowTrigger(
  query: string
): Promise<{ isWorkflow: boolean; workflowId: string | null }> {
  const { detectWorkflow, isWorkflowRequest, extractWorkflowId } = 
    await import('@/lib/workflows')
  
  const detectedWorkflowId = detectWorkflow(query)
  const explicitWorkflowId = extractWorkflowId(query)

  // Ensure we have a string or null (not boolean)
  const workflowId: string | null = 
    (typeof explicitWorkflowId === 'string' && explicitWorkflowId) ||
    (typeof detectedWorkflowId === 'string' && detectedWorkflowId) ||
    null

  return {
    isWorkflow: workflowId !== null,
    workflowId,
  }
}

/**
 * Custom error class for chat validation errors.
 */
export class ChatValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChatValidationError'
  }
}

/**
 * Custom error class for chat orchestration errors.
 */
export class ChatOrchestrationError extends Error {
  public readonly code: string
  public readonly statusCode: number

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message)
    this.name = 'ChatOrchestrationError'
    this.code = code
    this.statusCode = statusCode
  }
}

// Re-export types for convenience
export type { ChatContext, RequestBody } from './message-handler'
export type { AgentType, ClassificationResult } from './intent-classifier'
