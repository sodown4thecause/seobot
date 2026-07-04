import { describe, expect, it } from 'vitest'

import {
  buildDashboardChatHref,
  getChatModeFromMetadata,
  mergeMetadataWithChatMode,
  parseChatModeFromSearchParam,
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

  it('builds dashboard href with mode and conversation', () => {
    expect(
      buildDashboardChatHref({ conversationId: 'abc', mode: 'geo' })
    ).toBe('/dashboard?conversationId=abc&mode=geo')
    expect(buildDashboardChatHref({ mode: 'geo' })).toBe('/dashboard?mode=geo')
  })
})
