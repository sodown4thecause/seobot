'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useChatModeOptional } from '@/components/chat/chat-mode-context'
import { useAgent } from '@/components/providers/agent-provider'
import {
  getChatModeFromMetadata,
  parseChatModeFromSearchParam,
  resolveDashboardChatMode,
} from '@/lib/chat/conversation-mode'
import { isChatMode, type ChatMode } from '@/lib/chat/modes'

/**
 * Keeps URL ?mode=, per-conversation metadata, and ChatModeProvider in sync on dashboard routes.
 */
export function DashboardChatModeSync() {
  const searchParams = useSearchParams()
  const { chatMode, isHydrated, setChatMode } = useChatModeOptional()
  const { state, actions } = useAgent()
  const lastPersistedRef = useRef<{ conversationId: string; mode: ChatMode } | null>(null)
  const lastRestoredConversationId = useRef<string | null>(null)

  const urlMode = parseChatModeFromSearchParam(searchParams?.get('mode'))

  const activeConversation = state.activeConversation
  const conversationMode = activeConversation
    ? (activeConversation.chatMode && isChatMode(activeConversation.chatMode)
        ? activeConversation.chatMode
        : null) ?? getChatModeFromMetadata(activeConversation.metadata)
    : null
  const authoritativeMode = resolveDashboardChatMode({
    urlMode,
    conversationMode,
    fallbackMode: chatMode,
  })
  const restoreKey = `${urlMode ?? 'no-url'}:${activeConversation?.id ?? 'no-conversation'}`

  useEffect(() => {
    if (!isHydrated) return
    if (lastRestoredConversationId.current === restoreKey) return

    lastRestoredConversationId.current = restoreKey
    if (authoritativeMode !== chatMode) {
      setChatMode(authoritativeMode)
    }
  }, [authoritativeMode, chatMode, isHydrated, restoreKey, setChatMode])

  useEffect(() => {
    const conv = state.activeConversation
    if (!isHydrated || !conv?.id) return
    if (authoritativeMode !== chatMode) return

    const stored =
      (conv.chatMode && isChatMode(conv.chatMode) ? conv.chatMode : null) ??
      getChatModeFromMetadata(conv.metadata)

    if (stored === chatMode) {
      lastPersistedRef.current = { conversationId: conv.id, mode: chatMode }
      return
    }

    if (
      lastPersistedRef.current?.conversationId === conv.id &&
      lastPersistedRef.current.mode === chatMode
    ) {
      return
    }

    const timeout = window.setTimeout(() => {
      lastPersistedRef.current = { conversationId: conv.id, mode: chatMode }
      void actions.updateConversation(conv.id, { chatMode })
    }, 400)

    return () => window.clearTimeout(timeout)
  }, [actions, authoritativeMode, chatMode, isHydrated, state.activeConversation])

  return null
}
