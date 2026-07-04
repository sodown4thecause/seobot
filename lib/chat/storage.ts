/**
 * Chat Storage
 * Backward-compatible re-exports — canonical implementation lives in persistence.ts
 */

export {
  saveChatUIMessage as saveUIMessage,
  saveChatUIMessage,
  ensureChatForUser,
  autosaveUserMessage,
  persistAssistantMessages,
  loadChatMessagesForUser,
  loadConversationMessages,
  getConversationForUser,
  listChatsForSidebar,
  resolveMessageId,
  type ChatMessageRecord as ChatMessage,
  type ConversationRecord,
  type PersistedMessage,
  type SidebarChatItem,
} from './persistence'

export interface GenericUIMessage {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  parts?: unknown[]
  toolInvocations?: unknown[]
  createdAt?: Date
}

export function normalizeUIMessage(message: GenericUIMessage) {
  return {
    id: message.id || '',
    conversationId: '',
    role: message.role,
    content: message.content,
    createdAt: message.createdAt || new Date(),
  }
}

// _review
