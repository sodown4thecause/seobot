import { describe, expect, it } from 'vitest'

import {
  CHAT_MODE_LIST,
  CHAT_MODE_UI,
  CHAT_MODES,
  getChatModeAccentClasses,
  getChatModeUi,
  normalizeChatMode,
} from '@/lib/chat/modes'

describe('chat modes config', () => {
  it('defines all three modes with consistent accents', () => {
    expect(CHAT_MODES).toEqual(['seo', 'geo', 'content'])
    expect(CHAT_MODE_LIST).toHaveLength(3)
    expect(CHAT_MODE_UI.seo.accent).toBe('emerald')
    expect(CHAT_MODE_UI.geo.accent).toBe('violet')
    expect(CHAT_MODE_UI.content.accent).toBe('amber')
  })

  it('uses Content Mode as the public content label', () => {
    expect(CHAT_MODE_UI.content.heroTitle).toBe('Content Mode')
    expect(CHAT_MODE_UI.content.label).toBe('Content Mode')
  })

  it('normalizes unknown mode to seo', () => {
    expect(normalizeChatMode('geo')).toBe('geo')
    expect(normalizeChatMode('invalid')).toBe('seo')
    expect(normalizeChatMode(undefined)).toBe('seo')
  })

  it('exposes accent class groups for each mode', () => {
    const contentAccent = getChatModeAccentClasses('content')
    expect(contentAccent.borderPanel).toContain('amber')
    expect(getChatModeUi('geo').selectorLabel).toBe('GEO / AEO')
  })
})
