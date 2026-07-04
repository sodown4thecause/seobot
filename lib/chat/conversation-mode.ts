import type { ChatMode } from '@/lib/chat/modes'
import { isChatMode, normalizeChatMode } from '@/lib/chat/modes'

export const CHAT_MODE_QUERY_PARAM = 'mode'

type MetadataRecord = Record<string, unknown> | null | undefined

export function getChatModeFromMetadata(metadata: MetadataRecord): ChatMode | null {
  if (!metadata || typeof metadata !== 'object') return null
  const raw = (metadata as { chatMode?: unknown }).chatMode
  return isChatMode(raw) ? raw : null
}

export function mergeMetadataWithChatMode(
  metadata: MetadataRecord,
  chatMode: ChatMode
): Record<string, unknown> {
  const base =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? { ...metadata }
      : {}
  return { ...base, chatMode }
}

export function parseChatModeFromSearchParam(value: string | null | undefined): ChatMode | null {
  if (!value) return null
  return isChatMode(value) ? value : null
}

export function buildDashboardChatHref(options?: {
  conversationId?: string
  mode?: ChatMode
}): string {
  const params = new URLSearchParams()
  if (options?.conversationId) {
    params.set('conversationId', options.conversationId)
  }
  if (options?.mode) {
    params.set(CHAT_MODE_QUERY_PARAM, options.mode)
  }
  const query = params.toString()
  return query ? `/dashboard?${query}` : '/dashboard'
}

/** Prefer explicit field, then metadata.chatMode */
export function resolveConversationChatMode(
  chatMode: ChatMode | null | undefined,
  metadata: MetadataRecord
): ChatMode {
  if (chatMode && isChatMode(chatMode)) return chatMode
  return getChatModeFromMetadata(metadata) ?? normalizeChatMode(undefined)
}
