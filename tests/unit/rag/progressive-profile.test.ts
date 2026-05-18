/**
 * Progressive Profiling RAG Unit Tests
 *
 * Covers signal summarization and the record/retrieve flow for the per-user
 * profile namespace. Embeddings and vector search are mocked.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'

vi.mock('@/lib/ai/embeddings', () => ({
  generateEmbedding: vi.fn(async () => new Array(1536).fill(0.1)),
}))

vi.mock('@/lib/db/vector-search', () => ({
  insertAgentDocumentWithEmbedding: vi.fn(async () => ({ id: 'doc-1' })),
  searchUserAgentDocuments: vi.fn(async () => []),
}))

import {
  summarizeSignal,
  recordProfileSignal,
  retrieveUserProfileContext,
} from '@/lib/rag/progressive-profile'
import {
  insertAgentDocumentWithEmbedding,
  searchUserAgentDocuments,
} from '@/lib/db/vector-search'

describe('Progressive Profiling RAG', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('summarizeSignal', () => {
    it('produces a self-describing profile fact with the mode label', () => {
      const signal = summarizeSignal('seo', 'How do I rank for local keywords?')
      expect(signal).toContain('SEO')
      expect(signal).toContain('How do I rank for local keywords?')
    })

    it('collapses whitespace and truncates very long messages', () => {
      const signal = summarizeSignal('content', `a${'  '}long   message`)
      expect(signal).toContain('a long message')
      expect(signal.length).toBeLessThan(500)
    })
  })

  describe('recordProfileSignal', () => {
    it('records a signal for a substantive message', async () => {
      const stored = await recordProfileSignal({
        userId: 'user-1',
        mode: 'geo',
        userMessage: 'How is my brand visibility across AI engines?',
      })
      expect(stored).toBe(true)
      expect(insertAgentDocumentWithEmbedding).toHaveBeenCalledTimes(1)
      const arg = (insertAgentDocumentWithEmbedding as Mock).mock.calls[0][0]
      expect(arg.sourceType).toBe('user_profile')
      expect(arg.metadata.userId).toBe('user-1')
    })

    it('skips messages shorter than the minimum signal length', async () => {
      const stored = await recordProfileSignal({
        userId: 'user-1',
        mode: 'seo',
        userMessage: 'hi',
      })
      expect(stored).toBe(false)
      expect(insertAgentDocumentWithEmbedding).not.toHaveBeenCalled()
    })

    it('skips when userId is missing', async () => {
      const stored = await recordProfileSignal({
        userId: '',
        mode: 'seo',
        userMessage: 'How do I improve my keyword rankings?',
      })
      expect(stored).toBe(false)
      expect(insertAgentDocumentWithEmbedding).not.toHaveBeenCalled()
    })

    it('returns false without throwing when persistence fails', async () => {
      ;(insertAgentDocumentWithEmbedding as Mock).mockRejectedValueOnce(
        new Error('db down')
      )
      const stored = await recordProfileSignal({
        userId: 'user-1',
        mode: 'seo',
        userMessage: 'How do I improve my keyword rankings?',
      })
      expect(stored).toBe(false)
    })
  })

  describe('retrieveUserProfileContext', () => {
    it('returns an empty string when there is no profile data', async () => {
      const context = await retrieveUserProfileContext('user-1', 'write a blog post')
      expect(context).toBe('')
    })

    it('returns an empty string when userId or query is missing', async () => {
      expect(await retrieveUserProfileContext('', 'query')).toBe('')
      expect(await retrieveUserProfileContext('user-1', '')).toBe('')
      expect(searchUserAgentDocuments).not.toHaveBeenCalled()
    })

    it('formats matched signals into a prompt fragment', async () => {
      ;(searchUserAgentDocuments as Mock).mockResolvedValueOnce([
        { content: 'In SEO mode the user asked: "rank for X"', metadata: {} },
        { content: 'In GEO mode the user asked: "visibility for Y"', metadata: {} },
      ])
      const context = await retrieveUserProfileContext('user-1', 'content brief')
      expect(context).toContain('USER PROFILE CONTEXT')
      expect(context).toContain('rank for X')
      expect(context).toContain('visibility for Y')
    })

    it('returns an empty string when retrieval fails', async () => {
      ;(searchUserAgentDocuments as Mock).mockRejectedValueOnce(
        new Error('search failed')
      )
      expect(await retrieveUserProfileContext('user-1', 'query')).toBe('')
    })
  })
})
