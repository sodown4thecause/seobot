'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { ImageModePreferences } from '@/types/chat'

interface ChatModeContextValue {
  isImageMode: boolean
  setIsImageMode: (value: boolean) => void
  toggleImageMode: () => void
  preferences: ImageModePreferences
  setSize: (size: ImageModePreferences['size']) => void
  setQuality: (quality: ImageModePreferences['quality']) => void
  setStyle: (style: ImageModePreferences['style']) => void
  setSeed: (seed: number | undefined) => void
  resetPreferences: () => void
}

const ChatModeContext = createContext<ChatModeContextValue | undefined>(undefined)

const DEFAULT_PREFERENCES: ImageModePreferences = {
  size: '1024x1024',
  quality: 'standard',
  style: 'vivid',
  seed: undefined,
}

const STORAGE_KEYS = {
  IMAGE_MODE: 'chat-image-mode',
  PREFERENCES: 'chat-image-preferences',
}

interface ChatModeProviderProps {
  children: ReactNode
}

export function ChatModeProvider({ children }: ChatModeProviderProps) {
  const [isImageMode, setIsImageModeState] = useState(false)
  const [preferences, setPreferences] = useState<ImageModePreferences>(DEFAULT_PREFERENCES)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load saved state from localStorage on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(STORAGE_KEYS.IMAGE_MODE)
      const savedPrefs = localStorage.getItem(STORAGE_KEYS.PREFERENCES)

      if (savedMode !== null) {
        setIsImageModeState(savedMode === 'true')
      }

      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs)
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed })
      }
    } catch (error) {
      console.error('Failed to load chat mode preferences:', error)
    }
    
    setIsHydrated(true)
  }, [])

  // Persist image mode to localStorage
  useEffect(() => {
    if (!isHydrated) return
    
    try {
      localStorage.setItem(STORAGE_KEYS.IMAGE_MODE, String(isImageMode))
    } catch (error) {
      console.error('Failed to save image mode:', error)
    }
  }, [isImageMode, isHydrated])

  // Persist preferences to localStorage
  useEffect(() => {
    if (!isHydrated) return
    
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences))
    } catch (error) {
      console.error('Failed to save image preferences:', error)
    }
  }, [preferences, isHydrated])

  const setIsImageMode = (value: boolean) => {
    setIsImageModeState(value)
  }

  const toggleImageMode = () => {
    setIsImageModeState((prev) => !prev)
  }

  const setSize = (size: ImageModePreferences['size']) => {
    setPreferences((prev) => ({ ...prev, size }))
  }

  const setQuality = (quality: ImageModePreferences['quality']) => {
    setPreferences((prev) => ({ ...prev, quality }))
  }

  const setStyle = (style: ImageModePreferences['style']) => {
    setPreferences((prev) => ({ ...prev, style }))
  }

  const setSeed = (seed: number | undefined) => {
    setPreferences((prev) => ({ ...prev, seed }))
  }

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES)
  }

  const value: ChatModeContextValue = {
    isImageMode,
    setIsImageMode,
    toggleImageMode,
    preferences,
    setSize,
    setQuality,
    setStyle,
    setSeed,
    resetPreferences,
  }

  return <ChatModeContext.Provider value={value}>{children}</ChatModeContext.Provider>
}

/**
 * Hook to access chat mode context
 * @throws Error if used outside ChatModeProvider
 */
export function useChatMode() {
  const context = useContext(ChatModeContext)
  
  if (context === undefined) {
    throw new Error('useChatMode must be used within a ChatModeProvider')
  }
  
  return context
}

/**
 * Optional hook with safe defaults (doesn't throw if used outside provider)
 */
export function useChatModeOptional() {
  const context = useContext(ChatModeContext)
  
  return context || {
    isImageMode: false,
    setIsImageMode: () => {},
    toggleImageMode: () => {},
    preferences: DEFAULT_PREFERENCES,
    setSize: () => {},
    setQuality: () => {},
    setStyle: () => {},
    setSeed: () => {},
    resetPreferences: () => {},
  }
}
