import type { SupabaseClient } from '@supabase/supabase-js'
import type { UIMessage, UIMessagePart } from 'ai'
import { generateId } from 'ai'
import type { Database } from '@/lib/supabase/types'

export type GenericUIMessage = UIMessage<Record<string, any>, any, any>

export type ConversationRecord = Database['public']['Tables']['conversations']['Row']
export type MessageRow = Database['public']['Tables']['messages']['Row']

export type TypedSupabaseClient = SupabaseClient<Database>

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

export const mapRowToUIMessage = (row: MessageRow): GenericUIMessage => {
  const metadata = (row.metadata || {}) as Record<string, any>
  const parts = Array.isArray(metadata.parts) ? metadata.parts : undefined
  const uiMessageId = typeof metadata.ui_message_id === 'string' ? metadata.ui_message_id : row.id

  const defaultParts: UIMessagePart<any, any>[] = [{ type: TEXT_PART_TYPE, text: row.content }]

  return {
    id: uiMessageId,
    role: row.role as GenericUIMessage['role'],
    parts: parts && parts.length > 0 ? parts : defaultParts,
    metadata: metadata.metadata ?? metadata,
  }
}

export const serializeMessageForInsert = (
  conversationId: string,
  message: GenericUIMessage,
  extra?: { metadata?: Record<string, any> },
): Database['public']['Tables']['messages']['Insert'] => {
  const textContent = mapTextContent(message)

  return {
    conversation_id: conversationId,
    role: message.role,
    content: textContent,
    metadata: {
      ui_message_id: message.id,
      parts: message.parts as unknown,
      metadata: message.metadata ?? {},
      ...extra?.metadata,
    } as Database['public']['Tables']['messages']['Insert']['metadata'],
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
  // Use type assertion to work around Supabase type generation issues
  const { error } = await (client.from('messages') as any).insert(payload)

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

  // Use type assertion to work around Supabase type generation issues
  const { data, error } = await (client
    .from('conversations') as any)
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

  return data as ConversationRecord
}
