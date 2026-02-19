import { type UIMessage, safeValidateUIMessages } from 'ai'
import { and, asc, desc, eq, sql } from 'drizzle-orm'

import { db } from '@/lib/db'
import { conversations, messages, type Json } from '@/lib/db/schema'

type ChatRole = 'user' | 'assistant' | 'system'

type MessageMetadata = Record<string, unknown>

export type PersistedMessage = UIMessage<MessageMetadata>

export interface SidebarChatItem {
  chatId: string
  title: string
  lastMessageSnippet: string
  updatedAt: string
  messageCount: number
}

function extractTextFromParts(parts: UIMessage['parts'] | undefined): string {
  if (!Array.isArray(parts)) return ''

  return parts
    .filter((part): part is Extract<UIMessage['parts'][number], { type: 'text' }> => part.type === 'text')
    .map((part) => part.text)
    .join('')
    .trim()
}

function coerceCreatedAt(message: PersistedMessage): Date {
  const metadataCreatedAt =
    message.metadata && typeof message.metadata === 'object' && 'createdAt' in message.metadata
      ? String(message.metadata.createdAt)
      : undefined

  const candidate = metadataCreatedAt
  if (!candidate) return new Date()

  const parsed = new Date(candidate)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function normalizePersistedMessage(message: PersistedMessage) {
  const parts = Array.isArray(message.parts) ? message.parts : []

  return {
    messageId: message.id,
    role: message.role as ChatRole,
    parts,
    content: extractTextFromParts(parts),
    metadata: (message.metadata ?? null) as Json | null,
    createdAt: coerceCreatedAt(message),
  }
}

function deriveConversationTitle(text: string): string | null {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return null

  return cleaned.length > 80 ? `${cleaned.slice(0, 80)}...` : cleaned
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function ensureChatForUser(params: {
  userId: string
  requestedChatId?: string | null
  agentType?: string
}): Promise<{ id: string; created: boolean }> {
  const { userId, requestedChatId, agentType = 'general' } = params

  if (requestedChatId) {
    if (!isUuid(requestedChatId)) {
      throw new Error('Invalid requestedChatId: not a valid UUID')
    }

    const [existing] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(eq(conversations.id, requestedChatId), eq(conversations.userId, userId)))
      .limit(1)

    if (existing) {
      return { id: existing.id, created: false }
    }

    throw new Error('requestedChatId not found or not owned by user')
  }

  const [created] = await db
    .insert(conversations)
    .values({
      userId,
      agentType,
      status: 'active',
      updatedAt: new Date(),
      lastMessageAt: new Date(),
    })
    .returning({ id: conversations.id })

  return { id: created.id, created: true }
}

export async function autosaveUserMessage(params: {
  userId: string
  chatId: string
  message: PersistedMessage
}): Promise<void> {
  const { userId, chatId, message } = params
  if (message.role !== 'user') return

  const [conversation] = await db
    .select({ title: conversations.title })
    .from(conversations)
    .where(and(eq(conversations.id, chatId), eq(conversations.userId, userId)))
    .limit(1)

  if (!conversation) {
    throw new Error('Conversation not found for authenticated user')
  }

  const normalized = normalizePersistedMessage(message)
  const suggestedTitle = deriveConversationTitle(normalized.content)

  const DEFAULT_TITLE = 'New Conversation'

await db
    .insert(messages)
    .values({
      id: normalized.messageId,
      conversationId: chatId,
      role: normalized.role,
      content: normalized.content,
      metadata: normalized.metadata,
      createdAt: normalized.createdAt,
    })
    .onConflictDoNothing({ target: [messages.id] })

  const effectiveTitle = conversation.title === DEFAULT_TITLE && suggestedTitle
    ? suggestedTitle
    : conversation.title

  await db
    .update(conversations)
    .set({
      title: effectiveTitle,
      updatedAt: normalized.createdAt,
      lastMessageAt: normalized.createdAt,
    })
    .where(and(eq(conversations.id, chatId), eq(conversations.userId, userId)))
}

export async function persistAssistantMessages(params: {
  userId: string
  chatId: string
  messagesToPersist: PersistedMessage[]
}): Promise<void> {
  const { userId, chatId, messagesToPersist } = params

  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.id, chatId), eq(conversations.userId, userId)))
    .limit(1)

  if (!conversation) {
    throw new Error('Conversation not found for authenticated user')
  }

  const assistants = messagesToPersist.filter((message) => message.role === 'assistant')
  if (assistants.length === 0) return

  const normalizedAssistants = assistants.map(normalizePersistedMessage)
  const lastMessageAt = new Date(
    Math.max(...normalizedAssistants.map((msg) => msg.createdAt.getTime()))
  )

const payloads = normalizedAssistants.map((normalized) => ({
    id: normalized.messageId,
    conversationId: chatId,
    role: normalized.role,
    content: normalized.content,
    metadata: normalized.metadata,
    createdAt: normalized.createdAt,
  }))

  for (const payload of payloads) {
    await db
      .insert(messages)
      .values(payload)
      .onConflictDoUpdate({
        target: [messages.id],
        set: {
          role: payload.role,
          content: payload.content,
          metadata: payload.metadata,
          createdAt: payload.createdAt,
        },
      })
  }

  const effectiveLastMessageAt = lastMessageAt.getTime() > 0 ? lastMessageAt : new Date()

  await db
    .update(conversations)
    .set({
      updatedAt: effectiveLastMessageAt,
      lastMessageAt: effectiveLastMessageAt,
    })
    .where(and(eq(conversations.id, chatId), eq(conversations.userId, userId)))
}

export async function listChatsForSidebar(userId: string, limit = 50): Promise<SidebarChatItem[]> {
  const rows = await db
    .select({
      chatId: conversations.id,
      title: conversations.title,
      updatedAt: conversations.updatedAt,
      messageCount: sql<number>`count(${messages.id})::int`,
      lastMessageSnippet: sql<string>`coalesce(
        (
          select left(coalesce(m.content, ''), 160)
          from messages m
          where m.conversation_id = ${conversations.id}
          order by m.created_at desc
          limit 1
        ),
        ''
      )`,
    })
    .from(conversations)
    .leftJoin(messages, eq(messages.conversationId, conversations.id))
    .where(eq(conversations.userId, userId))
    .groupBy(conversations.id)
    .orderBy(desc(conversations.updatedAt))
    .limit(limit)

  return rows.map((row) => ({
    chatId: row.chatId,
    title: row.title ?? (row.lastMessageSnippet ? row.lastMessageSnippet.slice(0, 80) : 'New chat'),
    lastMessageSnippet: row.lastMessageSnippet,
    updatedAt: row.updatedAt.toISOString(),
    messageCount: Number(row.messageCount),
  }))
}

export async function loadChatMessagesForUser(params: {
  userId: string
  chatId: string
}): Promise<{ chatId: string; title: string | null; messages: UIMessage[] } | null> {
  const { userId, chatId } = params

  const [conversation] = await db
    .select({ id: conversations.id, title: conversations.title })
    .from(conversations)
    .where(and(eq(conversations.id, chatId), eq(conversations.userId, userId)))
    .limit(1)

  if (!conversation) return null

  const messageRows = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      metadata: messages.metadata,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.conversationId, chatId))
    .orderBy(asc(messages.createdAt))

const uiMessages = messageRows.map((message) => {
    const metadataObj = message.metadata ? (message.metadata as MessageMetadata) : {}
    const existingParts = Array.isArray(metadataObj.parts) ? metadataObj.parts : null
    const parts = existingParts ?? ([{ type: 'text', text: message.content || '' }] as UIMessage['parts'])

    const metadata: MessageMetadata = {
      ...metadataObj,
      createdAt: message.createdAt.toISOString(),
    }

    return {
      id: message.id,
      role: message.role as UIMessage['role'],
      parts,
      metadata,
    } satisfies PersistedMessage
  })

  const validation = await safeValidateUIMessages({ messages: uiMessages })

  return {
    chatId,
    title: conversation.title,
    messages: validation.success ? validation.data : uiMessages,
  }
}
