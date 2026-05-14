export const CHAT_MODES = ['seo', 'geo', 'content'] as const

export type ChatMode = (typeof CHAT_MODES)[number]

export const DEFAULT_CHAT_MODE: ChatMode = 'seo'

export const CHAT_MODE_LABELS: Record<ChatMode, string> = {
  seo: 'SEO',
  geo: 'GEO / AEO',
  content: 'Content Intelligence',
}

export function isChatMode(value: unknown): value is ChatMode {
  return typeof value === 'string' && CHAT_MODES.includes(value as ChatMode)
}

export function normalizeChatMode(value: unknown): ChatMode {
  return isChatMode(value) ? value : DEFAULT_CHAT_MODE
}
