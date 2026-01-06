/**
 * Chat Storage
 * Implemented with Drizzle ORM
 */

import { db } from '@/lib/db'
import { conversations, messages } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export interface ChatMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date
  metadata?: Record<string, any>
  // AI SDK 6 required fields for proper rendering
  parts?: any[]
  toolInvocations?: any[]
}

export interface ConversationRecord {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
}

export interface GenericUIMessage {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  parts?: any[] // AI SDK 6: parts array
  toolInvocations?: any[] // AI SDK 6: tool invocations
  createdAt?: Date
}

/**
 * Save a conversation message
 */
export async function saveConversationMessage(
  conversationId: string,
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: Record<string, any>
): Promise<ChatMessage> {
  const result = await db.insert(messages).values({
    conversationId,
    role,
    content,
    metadata: metadata || {},
  }).returning()

  if (!result[0]) {
    throw new Error('Failed to save conversation message')
  }

  // Update conversation's lastMessageAt timestamp
  try {
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId))
  } catch (error) {
    console.warn('[Storage] Failed to update conversation lastMessageAt:', error)
    // Don't throw - message was saved successfully
  }

  return {
    id: result[0].id,
    conversationId: result[0].conversationId,
    role: result[0].role as 'user' | 'assistant',
    content: result[0].content,
    createdAt: result[0].createdAt,
  }
}

/**
 * Ensure a conversation exists for a user
 * Returns existing active conversation or creates a new one
 */
export async function ensureConversationForUser(
  userId: string,
  conversationTitle?: string
): Promise<ConversationRecord> {
  // Try to find an existing conversation for this user
  const existing = await db
    .select()
    .from(conversations)
    .where(and(
      eq(conversations.userId, userId),
      eq(conversations.status, 'active')
    ))
    .orderBy(desc(conversations.lastMessageAt))
    .limit(1)

  // If an active conversation exists, return it
  if (existing && existing.length > 0) {
    return {
      id: existing[0].id,
      userId: existing[0].userId,
      title: existing[0].title,
      createdAt: existing[0].createdAt,
      updatedAt: existing[0].updatedAt,
    }
  }

  // Create a new conversation
  const result = await db.insert(conversations).values({
    userId,
    agentType: 'general',
    title: conversationTitle || 'New Conversation',
    status: 'active',
    metadata: {},
  }).returning()

  if (!result[0]) {
    throw new Error('Failed to create conversation')
  }

  return {
    id: result[0].id,
    userId: result[0].userId,
    title: result[0].title,
    createdAt: result[0].createdAt,
    updatedAt: result[0].updatedAt,
  }
}

/**
 * Load conversation messages
 */
export async function loadConversationMessages(
  conversationId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  // Fetch most recent messages first, then reverse to get chronological order
  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit)

  // Return in ascending order (oldest first) for proper chat display
  return result.reverse().map((msg) => {
    const metadata = (msg.metadata || {}) as Record<string, any>
    return {
      id: msg.id,
      conversationId: msg.conversationId,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      createdAt: msg.createdAt,
      // AI SDK 6 required fields for proper rendering
      parts: metadata.parts || [{ type: 'text', text: msg.content }],
      toolInvocations: metadata.toolInvocations,
    }
  })
}

/**
 * Get a conversation for a user
 */
export async function getConversationForUser(
  userId: string,
  conversationId: string
): Promise<ConversationRecord | null> {
  const result = await db
    .select()
    .from(conversations)
    .where(and(
      eq(conversations.userId, userId),
      eq(conversations.id, conversationId)
    ))
    .limit(1)

  if (!result || result.length === 0) {
    return null
  }

  return {
    id: result[0].id,
    userId: result[0].userId,
    title: result[0].title,
    createdAt: result[0].createdAt,
    updatedAt: result[0].updatedAt,
  }
}

/**
 * Normalize UI message format
 */
export function normalizeUIMessage(message: GenericUIMessage): ChatMessage {
  return {
    id: message.id || '',
    conversationId: '',
    role: message.role,
    content: message.content,
    createdAt: message.createdAt || new Date(),
  }
}
