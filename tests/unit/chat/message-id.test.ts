import { describe, expect, it } from 'vitest'
import { selectMessageId } from '@/lib/chat/message-id'

const conversationId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const validMessageId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

describe('selectMessageId', () => {
  it('keeps an unused valid UUID', () => {
    expect(selectMessageId(validMessageId, conversationId, null)).toBe(validMessageId)
  })

  it('keeps a valid UUID already owned by the same conversation', () => {
    expect(selectMessageId(validMessageId, conversationId, conversationId)).toBe(validMessageId)
  })

  it('generates a UUID for malformed IDs', () => {
    const result = selectMessageId('msg-client-id', conversationId, null)

    expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    expect(result).not.toBe('msg-client-id')
  })

  it('generates a UUID instead of reusing an ID from another conversation', () => {
    const result = selectMessageId(
      validMessageId,
      conversationId,
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    )

    expect(result).not.toBe(validMessageId)
    expect(result).toMatch(/^[0-9a-f-]{36}$/i)
  })
})
