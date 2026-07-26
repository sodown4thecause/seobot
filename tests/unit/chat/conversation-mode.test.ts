import { describe, expect, it } from 'vitest'

import {
  buildDashboardChatHref,
  buildDashboardModeHref,
  getChatModeFromMetadata,
  mergeMetadataWithChatMode,
  parseChatModeFromSearchParam,
  resolveDashboardChatMode,
} from '@/lib/chat/conversation-mode'

describe('conversation-mode helpers', () => {
  it('reads chatMode from metadata', () => {
    expect(getChatModeFromMetadata({ chatMode: 'geo' })).toBe('geo')
    expect(getChatModeFromMetadata({ other: true })).toBeNull()
  })

  it('merges chatMode into metadata', () => {
    expect(mergeMetadataWithChatMode({ foo: 1 }, 'content')).toEqual({
      foo: 1,
      chatMode: 'content',
    })
  })

  it('parses valid search param only', () => {
    expect(parseChatModeFromSearchParam('seo')).toBe('seo')
    expect(parseChatModeFromSearchParam('nope')).toBeNull()
  })

  it('resolves mode with URL, conversation, then stored-mode precedence', () => {
    expect(resolveDashboardChatMode({
      urlMode: 'geo',
      conversationMode: 'seo',
      fallbackMode: 'content',
    })).toBe('geo')
    expect(resolveDashboardChatMode({
      urlMode: null,
      conversationMode: 'geo',
      fallbackMode: 'content',
    })).toBe('geo')
    expect(resolveDashboardChatMode({
      urlMode: null,
      conversationMode: null,
      fallbackMode: 'content',
    })).toBe('content')
  })

  it('changes mode without dropping conversation or workflow parameters', () => {
    expect(buildDashboardModeHref('conversationId=abc&workflow=audit&mode=content', 'seo'))
      .toBe('/dashboard?conversationId=abc&workflow=audit&mode=seo')
  })

  it('builds dashboard href with mode and conversation', () => {
    expect(
      buildDashboardChatHref({ conversationId: 'abc', mode: 'geo' })
    ).toBe('/dashboard?conversationId=abc&mode=geo')
    expect(buildDashboardChatHref({ mode: 'geo' })).toBe('/dashboard?mode=geo')
  })
})
