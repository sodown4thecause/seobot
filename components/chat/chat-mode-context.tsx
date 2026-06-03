'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { DEFAULT_CHAT_MODE, type ChatMode } from '@/lib/chat/modes'

export type { ChatMode } from '@/lib/chat/modes'

interface ChatModeContextValue {
  chatMode: ChatMode
  setChatMode: (mode: ChatMode) => void
}

const ChatModeContext = createContext<ChatModeContextValue | undefined>(undefined)

const STORAGE_KEY = 'chat-active-mode'

interface ChatModeProviderProps {
  children: ReactNode
}

export function ChatModeProvider({ children }: ChatModeProviderProps) {
  const [chatMode, setChatModeState] = useState<ChatMode>(DEFAULT_CHAT_MODE)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ChatMode | null
      if (saved && ['seo', 'geo', 'content'].includes(saved)) {
        setChatModeState(saved)
      }
    } catch {}
  }, [])

  const setChatMode = (mode: ChatMode) => {
    setChatModeState(mode)
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {}
  }

  return (
    <ChatModeContext.Provider value={{ chatMode, setChatMode }}>
      {children}
    </ChatModeContext.Provider>
  )
}

export function useChatMode() {
  const context = useContext(ChatModeContext)
  if (!context) throw new Error('useChatMode must be used within a ChatModeProvider')
  return context
}

export function useChatModeOptional() {
  return useContext(ChatModeContext) ?? { chatMode: DEFAULT_CHAT_MODE, setChatMode: () => {} }
}
