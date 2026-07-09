import { describe, expect, it } from 'vitest'

import {
  CHAT_MODE_LABELS,
  CHAT_MODE_LIST,
  CHAT_MODE_UI,
  CHAT_MODES,
  getChatModeAccentClasses,
  getChatModeUi,
  normalizeChatMode,
} from '@/lib/chat/modes'

describe('chat modes config', () => {
  it('defines all modes with consistent accents', () => {
    expect(CHAT_MODES).toEqual(['seo', 'geo', 'content', 'social'])
    expect(CHAT_MODE_LIST).toHaveLength(4)
    expect(CHAT_MODE_UI.seo.accent).toBe('emerald')
    expect(CHAT_MODE_UI.geo.accent).toBe('violet')
    expect(CHAT_MODE_UI.content.accent).toBe('amber')
    expect(CHAT_MODE_UI.social.accent).toBe('rose')
  })

  it('uses Content Mode as the public content label', () => {
    expect(CHAT_MODE_UI.content.heroTitle).toBe('Content Mode')
    expect(CHAT_MODE_UI.content.label).toBe('Content Mode')
  })

  it('normalizes unknown mode to seo', () => {
    expect(normalizeChatMode('geo')).toBe('geo')
    expect(normalizeChatMode('social')).toBe('social')
    expect(normalizeChatMode('invalid')).toBe('seo')
    expect(normalizeChatMode(undefined)).toBe('seo')
  })

  it('exposes accent class groups for each mode', () => {
    const contentAccent = getChatModeAccentClasses('content')
    expect(contentAccent.borderPanel).toContain('amber')
    expect(getChatModeUi('geo').selectorLabel).toBe('GEO / AEO')
  })

  it('names supported GEO engines in public copy', () => {
    const geo = getChatModeUi('geo')
    expect(geo.tagline).toMatch(/ChatGPT/)
    expect(geo.tagline).toMatch(/Perplexity/)
    expect(geo.tagline).toMatch(/Google AI Overviews/)
    expect(geo.tagline).not.toMatch(/Claude|Gemini/)
  })

  it('keeps short LLM labels separate from marketing mode names', () => {
    expect(CHAT_MODE_LABELS.seo).toBe('SEO')
    expect(CHAT_MODE_LABELS.geo).toBe('GEO / AEO')
    expect(CHAT_MODE_LABELS.content).toBe('Content')
    expect(CHAT_MODE_LABELS.social).toBe('Social')
    expect(CHAT_MODE_UI.seo.label).toBe('SEO Mode')
  })

  it('describes artifacts and workspace for content mode', () => {
    const content = getChatModeUi('content').tagline
    expect(content).toMatch(/workspace/i)
    expect(content).toMatch(/artifacts/i)
  })
})
