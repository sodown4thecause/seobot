import type { SupabaseClient } from '@supabase/supabase-js'
import type { UIMessage } from 'ai'
import { generateId } from 'ai'
import type { Database } from '@/lib/supabase/types'

export type GenericUIMessage = UIMessage<Record<string, any>, any, any>

export type ConversationRecord = Database['public']['Tables']['conversations']['Row']
export type MessageRow = Database['public']['Tables']['messages']['Row']

export type TypedSupabaseClient = SupabaseClient<Database>

const TEXT_PART_TYPE = 'text'

const defaultAgentType = 'general'

const mapTextContent = (message: GenericUIMessage): string => {
  if (Array.isArray(message.parts) && message.parts.length > 0) {
    return message.parts
      .filter((part) => part.type === TEXT_PART_TYPE)
      .map((part: any) => part.text)
      .join('')
  }

  if (typeof message.content === 'string') {
    return message.content
  }

  return ''
}

export const normalizeUIMessage = (message: Partial<GenericUIMessage>): GenericUIMessage => {
  const parts = Array.isArray(message.parts) && message.parts.length > 0
    ? message.parts
    : typeof message.content === 'string'
      ? [{ type: TEXT_PART_TYPE, text: message.content }]
      : []

  return {
    id: message.id ?? generateId(),
    role: (message.role ?? 'user') as GenericUIMessage['role'],
    parts,
    content: message.content ?? mapTextContent({
      id: message.id ?? generateId(),
      role: (message.role ?? 'user') as GenericUIMessage['role'],
      parts,
      content: message.content,
      metadata: message.metadata,
    }),
    metadata: message.metadata,
  }
}

export const mapRowToUIMessage = (row: MessageRow): GenericUIMessage => {
  const metadata = (row.metadata || {}) as Record<string, any>
  const parts = Array.isArray(metadata.parts) ? metadata.parts : undefined
  const uiMessageId = typeof metadata.ui_message_id === 'string' ? metadata.ui_message_id : row.id

  return {
    id: uiMessageId,
    role: row.role as GenericUIMessage['role'],
    parts: parts && parts.length > 0
      ? parts
      : [{ type: TEXT_PART_TYPE, text: row.content }],
    content: row.content,
    metadata: metadata.metadata ?? metadata,
  }
}

export const serializeMessageForInsert = (
  conversationId: string,
  message: GenericUIMessage,
  extra?: { metadata?: Record<string, any> },
) => {
  const textContent = mapTextContent(message)

  return {
    conversation_id: conversationId,
    role: message.role,
    content: textContent,
    metadata: {
      ui_message_id: message.id,
      parts: message.parts,
      metadata: message.metadata ?? {},
      ...extra?.metadata,
    },
  }
}

export const loadConversationMessages = async (
  client: TypedSupabaseClient,
  conversationId: string,
): Promise<GenericUIMessage[]> => {
  const { data, error } = await client
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[Chat Storage] Failed to load messages', error)
    throw error
  }

  return (data ?? []).map(mapRowToUIMessage)
}

export const saveConversationMessage = async (
  client: TypedSupabaseClient,
  conversationId: string,
  message: GenericUIMessage,
  extra?: { metadata?: Record<string, any> },
) => {
  const payload = serializeMessageForInsert(conversationId, message, extra)
  const { error } = await client.from('messages').insert(payload)

  if (error) {
    console.error('[Chat Storage] Failed to insert message', error)
    throw error
  }
}

export const getConversationForUser = async (
  client: TypedSupabaseClient,
  userId: string,
  conversationId?: string,
): Promise<ConversationRecord | null> => {
  if (!conversationId) {
    return null
  }

  const { data, error } = await client
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if ((error as any)?.code === 'PGRST116') {
      return null
    }

    console.error('[Chat Storage] Failed to load conversation', error)
    throw error
  }

  return data
}

export const ensureConversationForUser = async (
  client: TypedSupabaseClient,
  userId: string,
  conversationId?: string,
  agentType: string = defaultAgentType,
): Promise<ConversationRecord> => {
  if (conversationId) {
    const existing = await getConversationForUser(client, userId, conversationId)
    if (existing) {
      return existing
    }
  }

  const { data, error } = await client
    .from('conversations')
    .insert({
      user_id: userId,
      agent_type: agentType,
      status: 'active',
    })
    .select('*')
    .single()

  if (error) {
    console.error('[Chat Storage] Failed to create conversation', error)
    throw error
  }

  return data
}
