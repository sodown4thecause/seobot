import { describe, expect, it, vi } from 'vitest'

import {
  bootstrapConversationRecord,
  buildWorkflowAutoSendKey,
} from '@/lib/chat/conversation-bootstrap'

describe('conversation bootstrap helpers', () => {
  describe('buildWorkflowAutoSendKey', () => {
    it('returns a conversation-scoped key when both values exist', () => {
      expect(buildWorkflowAutoSendKey('seo-tools', 'conv-123')).toBe('seo-tools:conv-123')
    })

    it('returns undefined when conversation id is missing', () => {
      expect(buildWorkflowAutoSendKey('seo-tools', undefined)).toBeUndefined()
    })
  })

  describe('bootstrapConversationRecord', () => {
    it('uses the override conversation id without network calls', async () => {
      const listConversations = vi.fn()
      const createConversation = vi.fn()

      await expect(
        bootstrapConversationRecord({
          overrideId: 'conv-override',
          listConversations,
          createConversation,
        })
      ).resolves.toEqual({ id: 'conv-override' })

      expect(listConversations).not.toHaveBeenCalled()
      expect(createConversation).not.toHaveBeenCalled()
    })

    it('falls back to the latest existing conversation when creation fails', async () => {
      const existingConversation = { id: 'conv-existing' }

      await expect(
        bootstrapConversationRecord({
          createConversation: vi.fn().mockRejectedValue(new Error('db down')),
          listConversations: vi.fn().mockResolvedValue([existingConversation]),
        })
      ).resolves.toEqual(existingConversation)
    })

    it('creates a new conversation when no fallback exists', async () => {
      const createdConversation = { id: 'conv-created' }

      await expect(
        bootstrapConversationRecord({
          createConversation: vi.fn().mockResolvedValue(createdConversation),
          listConversations: vi.fn().mockResolvedValue([]),
        })
      ).resolves.toEqual(createdConversation)
    })
  })
})
