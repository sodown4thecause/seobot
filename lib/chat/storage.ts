/**
 * Chat Storage - Drizzle ORM Implementation
 * 
 * Replaces Supabase client with Drizzle for conversation and message storage
 */

import type { UIMessage, UIMessagePart } from 'ai'
import { generateId } from 'ai'
import { db, conversations, messages, type Conversation, type Message, type Json } from '@/lib/db'
import { eq, and, asc } from 'drizzle-orm'

export type GenericUIMessage = UIMessage<Record<string, any>, any, any>

export type ConversationRecord = Conversation
export type MessageRow = Message

const TEXT_PART_TYPE = 'text' as const
const defaultAgentType = 'general'

// Helper to extract text content from parts
const extractTextFromParts = (parts: UIMessagePart<any, any>[]): string => {
  return parts
    .filter((part): part is { type: 'text'; text: string } => part.type === TEXT_PART_TYPE)
    .map((part) => part.text)
    .join('')
}

const mapTextContent = (message: GenericUIMessage): string => {
  if (Array.isArray(message.parts) && message.parts.length > 0) {
    // First try to extract text from text parts
    const textContent = extractTextFromParts(message.parts)
    if (textContent) return textContent
    
    // Fallback: if no text parts, try to extract meaningful content from tool results
    const toolResults = message.parts
      .filter((p: any) => p.type === 'tool-invocation' && p.toolInvocation?.state === 'result')
      .map((p: any) => {
        const result = p.toolInvocation?.result
        if (typeof result === 'string') return result
        if (result?.text) return result.text
        if (result?.content) return result.content
        return null
      })
      .filter(Boolean)
      .join('\n')
    
    if (toolResults) return toolResults
  }
  return ''
}

// Extended type that includes optional content for backwards compatibility
type MessageInput = {
  id?: string
  role?: string
  parts?: UIMessagePart<any, any>[]
  content?: string
  metadata?: unknown
}

export const normalizeUIMessage = (message: MessageInput): GenericUIMessage => {
  const textPart = { type: TEXT_PART_TYPE, text: message.content ?? '' } as UIMessagePart<any, any>
  const parts: UIMessagePart<any, any>[] = Array.isArray(message.parts) && message.parts.length > 0
    ? message.parts
    : message.content
      ? [textPart]
      : []

  return {
    id: message.id ?? generateId(),
    role: (message.role ?? 'user') as GenericUIMessage['role'],
    parts,
    metadata: (message.metadata ?? {}) as Record<string, any>,
  }
}

export const mapRowToUIMessage = (row: MessageRow): GenericUIMessage & { content: string; createdAt: string } => {
  const metadata = (row.metadata || {}) as Record<string, any>
  const parts = Array.isArray(metadata.parts) ? metadata.parts : undefined
  const uiMessageId = typeof metadata.ui_message_id === 'string' ? metadata.ui_message_id : row.id

  const defaultParts: UIMessagePart<any, any>[] = [{ type: TEXT_PART_TYPE, text: row.content }]

  return {
    id: uiMessageId,
    role: row.role as GenericUIMessage['role'],
    parts: parts && parts.length > 0 ? parts : defaultParts,
    metadata: metadata.metadata ?? metadata,
    content: row.content,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  }
}

export const loadConversationMessages = async (
  conversationId: string,
): Promise<GenericUIMessage[]> => {
  try {
    const data = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))

    return data.map(mapRowToUIMessage)
  } catch (error) {
    console.error('[Chat Storage] Failed to load messages', error)
    throw error
  }
}

export const saveConversationMessage = async (
  conversationId: string,
  message: GenericUIMessage,
  extra?: { metadata?: Record<string, any> },
) => {
  const textContent = mapTextContent(message)
  
  try {
    await db.insert(messages).values({
      conversationId,
      role: message.role,
      content: textContent,
      metadata: {
        ui_message_id: message.id,
        parts: message.parts as unknown,
        metadata: message.metadata ?? {},
        ...extra?.metadata,
      } as Json,
    })
  } catch (error) {
    console.error('[Chat Storage] Failed to insert message', error)
    throw error
  }
}

export const getConversationForUser = async (
  userId: string,
  conversationId?: string,
): Promise<ConversationRecord | null> => {
  if (!conversationId) {
    return null
  }

  try {
    const data = await db
      .select()
      .from(conversations)
      .where(and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ))
      .limit(1)

    return data[0] ?? null
  } catch (error) {
    console.error('[Chat Storage] Failed to load conversation', error)
    throw error
  }
}

export const ensureConversationForUser = async (
  userId: string,
  conversationId?: string,
  agentType: string = defaultAgentType,
): Promise<ConversationRecord> => {
  if (conversationId) {
    const existing = await getConversationForUser(userId, conversationId)
    if (existing) {
      return existing
    }
  }

  try {
    const [data] = await db
      .insert(conversations)
      .values({
        userId,
        agentType,
        status: 'active',
      })
      .returning()

    return data
  } catch (error) {
    console.error('[Chat Storage] Failed to create conversation', error)
    throw error
  }
}

// Legacy compatibility - export with client parameter (now ignored)
export const loadConversationMessagesCompat = async (
  _client: any,
  conversationId: string,
): Promise<GenericUIMessage[]> => {
  return loadConversationMessages(conversationId)
}

export const saveConversationMessageCompat = async (
  _client: any,
  conversationId: string,
  message: GenericUIMessage,
  extra?: { metadata?: Record<string, any> },
) => {
  return saveConversationMessage(conversationId, message, extra)
}

export const getConversationForUserCompat = async (
  _client: any,
  userId: string,
  conversationId?: string,
): Promise<ConversationRecord | null> => {
  return getConversationForUser(userId, conversationId)
}

export const ensureConversationForUserCompat = async (
  _client: any,
  userId: string,
  conversationId?: string,
  agentType: string = defaultAgentType,
): Promise<ConversationRecord> => {
  return ensureConversationForUser(userId, conversationId, agentType)
}
