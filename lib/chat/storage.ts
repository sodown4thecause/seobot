/**
 * Chat Storage  
 * TODO: Re-implement with Drizzle ORM
 */

export interface ChatMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
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
  role: 'user' | 'assistant'
  content: string
  createdAt?: Date
}

/**
 * Save a conversation message
 * @deprecated Chat storage is being migrated to Drizzle ORM
 */
export async function saveConversationMessage(
  conversationId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<ChatMessage> {
  throw new Error('Chat message storage is not yet implemented')
}

/**
 * Ensure a conversation exists
 * @deprecated Chat storage is being migrated to Drizzle ORM
 */
export async function ensureConversationForUser(
  userId: string,
  conversationTitle?: string
): Promise<ConversationRecord> {
  throw new Error('Conversation creation is not yet implemented')
}

/**
 * Load conversation messages
 * @deprecated Chat storage is being migrated to Drizzle ORM
 */
export async function loadConversationMessages(
  conversationId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  console.warn('[Chat Storage] Message loading disabled during NextPhase migration')
  return []
}

/**
 * Get a conversation for a user
 * @deprecated Chat storage is being migrated to Drizzle ORM
 */
export async function getConversationForUser(
  userId: string,
  conversationId: string
): Promise<ConversationRecord | null> {
  console.warn('[Chat Storage] Conversation retrieval disabled during NextPhase migration')
  return null
}

/**
 * Normalize UI message format
 * @deprecated Chat storage is being migrated to Drizzle ORM
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
