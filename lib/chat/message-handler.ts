/**
 * Message Handler Module
 * 
 * Handles message extraction, conversion, and validation for the chat API.
 */

import { convertToModelMessages, type ModelMessage, type UIMessage } from 'ai'

export interface ChatContext {
  page?: string
  onboarding?: {
    currentStep?: number
    data?: Record<string, unknown>
  }
  agentId?: string
  agentType?: string
  conversationId?: string
  [key: string]: unknown
}

export interface RequestBody {
  messages?: UIMessage[]
  chatId?: string
  conversationId?: string
  agentId?: string
  context?: ChatContext
}

/**
 * Extract the last user message content from incoming messages.
 * Handles both legacy content format and AI SDK 6 parts format.
 */
export function extractLastUserMessageContent(messages: UIMessage[]): string {
  if (!messages || messages.length === 0) return ''

  const lastMsg = messages[messages.length - 1] as UIMessage & {
    content?: string
    parts?: Array<{ type: string; text?: string }>
  }

  // Legacy format: content is directly available
  if (lastMsg?.content && typeof lastMsg.content === 'string') {
    return lastMsg.content
  }

  // AI SDK 6: content is in parts array
  if (Array.isArray(lastMsg?.parts)) {
    const textParts = lastMsg.parts.filter((p) => p.type === 'text')
    return textParts.map((p) => p.text || '').join('')
  }

  return ''
}

/**
 * Convert UIMessage[] from useChat to ModelMessage[] for streamText.
 * AI SDK 6: Uses convertToModelMessages (renamed from convertToCoreMessages).
 */
export function convertToModelFormat(messages: UIMessage[]): ModelMessage[] {
  console.log('[Message Handler] Incoming messages count:', messages.length)

  try {
    const modelMessages = convertToModelMessages(messages)
    console.log('[Message Handler] Converted to ModelMessage[], count:', modelMessages.length)
    return modelMessages
  } catch (err) {
    console.error('[Message Handler] convertToModelMessages failed:', err)
    // Fallback: try again with type assertion (AI SDK 6 compatibility)
    return convertToModelMessages(messages as unknown as UIMessage[])
  }
}

/**
 * Validate incoming messages array.
 * Returns an error response if invalid, null if valid.
 */
export function validateMessages(messages: unknown): Response | null {
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "Messages array is required and must not be empty" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
  return null
}

/**
 * Extract content from a message (works with both legacy and AI SDK 6 formats).
 */
export function extractMessageContent(message: UIMessage): string {
  const msg = message as UIMessage & {
    content?: string
    parts?: Array<{ type: string; text?: string }>
  }

  if (msg?.content && typeof msg.content === 'string') {
    return msg.content
  }

  if (Array.isArray(msg?.parts) && msg.parts.length > 0) {
    const textParts = msg.parts.filter((p) => p.type === 'text')
    return textParts.map((p) => p.text || '').join('')
  }

  return ''
}

/**
 * Check if a message is from a user.
 */
export function isUserMessage(message: UIMessage): boolean {
  return message?.role === 'user'
}

/**
 * Check if a message is from the assistant.
 */
export function isAssistantMessage(message: UIMessage): boolean {
  return message?.role === 'assistant'
}

/**
 * Get the last message from an array of messages.
 */
export function getLastMessage(messages: UIMessage[]): UIMessage | undefined {
  return messages[messages.length - 1]
}

/**
 * Extract tool invocations from a message (AI SDK 6 format).
 */
export function extractToolInvocations(message: UIMessage): Array<{
  toolName: string
  result?: unknown
  state?: string
}> {
  // Use unknown type to avoid UIMessage part type conflicts
  const msg = message as unknown as {
    parts?: Array<{ type: string; toolInvocation?: Record<string, unknown> }>
  }

  if (!Array.isArray(msg?.parts)) return []

  const toolParts = msg.parts.filter((p) => p.type === 'tool-invocation')
  return toolParts.map((t) => {
    const invocation = t.toolInvocation
    return {
      toolName: (invocation?.toolName as string) || '',
      result: invocation?.result,
      state: invocation?.state as string | undefined,
    }
  })
}
