'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useChatModeOptional } from '@/components/chat/chat-mode-context'
import { useAgent } from '@/components/providers/agent-provider'
import {
  getChatModeFromMetadata,
  parseChatModeFromSearchParam,
} from '@/lib/chat/conversation-mode'
import { isChatMode, type ChatMode } from '@/lib/chat/modes'

/**
 * Keeps URL ?mode=, per-conversation metadata, and ChatModeProvider in sync on dashboard routes.
 */
export function DashboardChatModeSync() {
  const searchParams = useSearchParams()
  const { chatMode, setChatMode } = useChatModeOptional()
  const { state, actions } = useAgent()
  const lastPersistedRef = useRef<{ conversationId: string; mode: ChatMode } | null>(null)
  const lastRestoredConversationId = useRef<string | null>(null)

  const urlMode = parseChatModeFromSearchParam(searchParams?.get('mode'))

  useEffect(() => {
    if (!urlMode) return
    setChatMode(urlMode)
    lastRestoredConversationId.current = null
  }, [urlMode, setChatMode])

  useEffect(() => {
    if (urlMode) return

    const conv = state.activeConversation
    if (!conv) {
      lastRestoredConversationId.current = null
      return
    }
    if (lastRestoredConversationId.current === conv.id) return
    lastRestoredConversationId.current = conv.id

    const fromConversation =
      (conv.chatMode && isChatMode(conv.chatMode) ? conv.chatMode : null) ??
      getChatModeFromMetadata(conv.metadata)

    if (fromConversation) {
      setChatMode(fromConversation)
    }
  }, [state.activeConversation, setChatMode, urlMode])

  useEffect(() => {
    const conv = state.activeConversation
    if (!conv?.id) return

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
  }, [actions, chatMode, state.activeConversation])

  return null
}
