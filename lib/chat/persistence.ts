import { type UIMessage, safeValidateUIMessages } from 'ai'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { v5 as uuidv5 } from 'uuid'

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

export interface ChatMessageRecord {
  id: string
  conversationId: string
  role: ChatRole
  content: string
  createdAt: Date
  metadata?: Record<string, unknown>
  parts?: UIMessage['parts']
  toolInvocations?: unknown[]
}

export interface ConversationRecord {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
}

const DEFAULT_CONVERSATION_TITLE = 'New Conversation'
const MESSAGE_ID_NAMESPACE = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

/**
 * Map client/stream message IDs (e.g. msg-*) to stable UUIDs for the messages table.
 */
export function resolveMessageId(clientId: string | undefined, conversationId: string): string {
  if (!clientId) {
    return crypto.randomUUID()
  }

  if (isUuid(clientId)) {
    return clientId
  }

  return uuidv5(`${conversationId}:${clientId}`, MESSAGE_ID_NAMESPACE)
}

function getClientMessageId(metadata: MessageMetadata | null | undefined, dbId: string): string {
  const stored = metadata?.clientMessageId
  return typeof stored === 'string' && stored.length > 0 ? stored : dbId
}

function buildMessageMetadata(
  message: {
    id?: string
    parts?: UIMessage['parts']
    toolInvocations?: unknown[]
    metadata?: MessageMetadata
  },
  resolvedId: string
): Json | null {
  const metadata: MessageMetadata = {
    ...(message.metadata ?? {}),
  }

  if (message.parts && message.parts.length > 0) {
    metadata.parts = message.parts
  }

  if (message.toolInvocations && message.toolInvocations.length > 0) {
    metadata.toolInvocations = message.toolInvocations
  }

  if (message.id && message.id !== resolvedId) {
    metadata.clientMessageId = message.id
  }

  return Object.keys(metadata).length > 0 ? (metadata as Json) : null
}

function normalizePersistedMessage(message: PersistedMessage, conversationId: string) {
  const parts = Array.isArray(message.parts) ? message.parts : []
  const resolvedId = resolveMessageId(message.id, conversationId)

  return {
    messageId: resolvedId,
    clientMessageId: message.id,
    role: message.role as ChatRole,
    parts,
    content: extractTextFromParts(parts),
    metadata: buildMessageMetadata(message, resolvedId),
    createdAt: coerceCreatedAt(message),
  }
}

function deriveConversationTitle(text: string): string | null {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return null

  return cleaned.length > 80 ? `${cleaned.slice(0, 80)}...` : cleaned
}

function hydrateMessageParts(metadataObj: MessageMetadata, content: string): UIMessage['parts'] {
  if (Array.isArray(metadataObj.parts) && metadataObj.parts.length > 0) {
    return metadataObj.parts as UIMessage['parts']
  }

  const parts: UIMessage['parts'] = []
  if (content) {
    parts.push({ type: 'text', text: content })
  }

  const toolInvocations = metadataObj.toolInvocations
  if (Array.isArray(toolInvocations)) {
    for (const invocation of toolInvocations) {
      if (invocation && typeof invocation === 'object') {
        parts.push({
          type: 'tool-invocation',
          toolInvocation: invocation as Record<string, unknown>,
        } as unknown as UIMessage['parts'][number])
      }
    }
  }

  return parts.length > 0 ? parts : [{ type: 'text', text: content || '' }]
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

  const normalized = normalizePersistedMessage(message, chatId)
  const suggestedTitle = deriveConversationTitle(normalized.content)

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
    .onConflictDoUpdate({
      target: [messages.id],
      set: {
        role: normalized.role,
        content: normalized.content,
        metadata: normalized.metadata,
        createdAt: normalized.createdAt,
      },
    })

  const effectiveTitle = conversation.title === DEFAULT_CONVERSATION_TITLE && suggestedTitle
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

  const normalizedAssistants = assistants.map((message) => normalizePersistedMessage(message, chatId))
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

/**
 * Unified save for AI SDK UIMessages (user or assistant) with upsert-by-id.
 */
export async function saveChatUIMessage(
  chatId: string,
  userId: string,
  message: {
    id?: string
    role: ChatRole
    content?: string
    parts?: UIMessage['parts']
    toolInvocations?: unknown[]
    createdAt?: Date
    metadata?: MessageMetadata
  }
): Promise<ChatMessageRecord> {
  const [conversation] = await db
    .select({ id: conversations.id, title: conversations.title })
    .from(conversations)
    .where(and(eq(conversations.id, chatId), eq(conversations.userId, userId)))
    .limit(1)

  if (!conversation) {
    throw new Error('Conversation not found for authenticated user')
  }

  let content = message.content || ''
  if (!content && Array.isArray(message.parts)) {
    content = extractTextFromParts(message.parts)
  }

  const resolvedId = resolveMessageId(message.id, chatId)
  const metadata = buildMessageMetadata(message, resolvedId)
  const createdAt = message.createdAt ?? new Date()

  const [saved] = await db
    .insert(messages)
    .values({
      id: resolvedId,
      conversationId: chatId,
      role: message.role,
      content,
      metadata,
      createdAt,
    })
    .onConflictDoUpdate({
      target: [messages.id],
      set: {
        role: message.role,
        content,
        metadata,
        createdAt,
      },
    })
    .returning()

  if (!saved) {
    throw new Error('Failed to save chat UI message')
  }

  const nextTitle =
    message.role === 'user' && conversation.title === DEFAULT_CONVERSATION_TITLE
      ? deriveConversationTitle(content) || DEFAULT_CONVERSATION_TITLE
      : undefined

  await db
    .update(conversations)
    .set({
      lastMessageAt: createdAt,
      updatedAt: createdAt,
      ...(nextTitle ? { title: nextTitle } : {}),
    })
    .where(eq(conversations.id, chatId))

  const metadataObj = (metadata ?? {}) as MessageMetadata

  return {
    id: getClientMessageId(metadataObj, saved.id),
    conversationId: saved.conversationId,
    role: saved.role as ChatRole,
    content: saved.content,
    createdAt: saved.createdAt,
    metadata: metadataObj,
    parts: hydrateMessageParts(metadataObj, saved.content),
    toolInvocations: Array.isArray(metadataObj.toolInvocations)
      ? metadataObj.toolInvocations
      : undefined,
  }
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
    const parts = hydrateMessageParts(metadataObj, message.content || '')

    const metadata: MessageMetadata = {
      ...metadataObj,
      createdAt: message.createdAt.toISOString(),
    }

    return {
      id: getClientMessageId(metadataObj, message.id),
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

export async function loadConversationMessages(
  conversationId: string,
  limit: number = 50
): Promise<ChatMessageRecord[]> {
  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit)

  return result.reverse().map((msg) => {
    const metadataObj = (msg.metadata || {}) as MessageMetadata
    const parts = hydrateMessageParts(metadataObj, msg.content)
    return {
      id: getClientMessageId(metadataObj, msg.id),
      conversationId: msg.conversationId,
      role: msg.role as ChatRole,
      content: msg.content,
      createdAt: msg.createdAt,
      metadata: metadataObj,
      parts,
      toolInvocations: Array.isArray(metadataObj.toolInvocations)
        ? metadataObj.toolInvocations
        : undefined,
    }
  })
}

// _review
