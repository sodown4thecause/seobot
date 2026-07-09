import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { MessageBubble } from '@/components/chat/message-bubble'

describe('MessageBubble', () => {
  it('renders a role-aware message with content and actions', () => {
    const html = renderToStaticMarkup(
      <MessageBubble
        role="assistant"
        actions={<button type="button">Copy</button>}
      >
        <p>Answer text</p>
      </MessageBubble>
    )

    expect(html).toContain('is-assistant')
    expect(html).toContain('AI')
    expect(html).toContain('Answer text')
    expect(html).toContain('Copy')
  })

  it('marks artifact and streaming layouts without hiding overflow', () => {
    const html = renderToStaticMarkup(
      <MessageBubble role="assistant" layout="artifact" isStreaming>
        <article>Long form content</article>
      </MessageBubble>
    )

    expect(html).toContain('data-layout="artifact"')
    expect(html).toContain('data-streaming="true"')
    expect(html).not.toContain('overflow-hidden')
  })
})
