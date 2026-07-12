import { describe, expect, it } from 'vitest'
import { getChatRetryAction } from '@/lib/chat/retry-behavior'

describe('getChatRetryAction', () => {
  it('regenerates a failed user submission instead of appending a duplicate', () => {
    expect(getChatRetryAction([{ role: 'user' }])).toBe('regenerate')
  })

  it('does nothing when there is no user submission to retry', () => {
    expect(getChatRetryAction([])).toBe('none')
  })
})
