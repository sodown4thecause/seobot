'use client'

import React, { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react'
import { DEFAULT_CHAT_MODE, isChatMode, type ChatMode } from '@/lib/chat/modes'
import { captureProductEvent } from '@/components/providers/analytics-provider'
import { PRODUCT_EVENTS } from '@/lib/analytics/product-events'

export type { ChatMode } from '@/lib/chat/modes'

interface ChatModeContextValue {
  chatMode: ChatMode
  isHydrated: boolean
  setChatMode: (mode: ChatMode) => void
}

const ChatModeContext = createContext<ChatModeContextValue | undefined>(undefined)

const STORAGE_KEY = 'chat-active-mode'

interface ChatModeProviderProps {
  children: ReactNode
}

export function ChatModeProvider({ children }: ChatModeProviderProps) {
  const [chatMode, setChatModeState] = useState<ChatMode>(DEFAULT_CHAT_MODE)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved && isChatMode(saved)) {
          setChatModeState(saved)
        }
      } catch {}
      setIsHydrated(true)
    }, 0)

    return () => window.clearTimeout(hydration)
  }, [])

  const setChatMode = useCallback((mode: ChatMode) => {
    setChatModeState((previous) => {
      if (previous !== mode) {
        captureProductEvent(PRODUCT_EVENTS.MODE_SELECTED, {
          fromMode: previous,
          toMode: mode,
        })
      }
      return mode
    })
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {}
  }, [])

  return (
    <ChatModeContext.Provider value={{ chatMode, isHydrated, setChatMode }}>
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
  return useContext(ChatModeContext) ?? { chatMode: DEFAULT_CHAT_MODE, isHydrated: true, setChatMode: () => {} }
}
