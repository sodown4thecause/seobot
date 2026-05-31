/**
 * Keyword History RAG Unit Tests
 *
 * Covers keyword extraction, prompt formatting, and the record/retrieve flow
 * for Content-mode keyword history. Embeddings and vector search are mocked.
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
  extractKeywords,
  formatKeywordHistoryForPrompt,
  recordChatKeywords,
  retrieveKeywordHistory,
} from '@/lib/rag/keyword-history'
import {
  insertAgentDocumentWithEmbedding,
  searchUserAgentDocuments,
} from '@/lib/db/vector-search'

describe('Keyword History RAG', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('extractKeywords', () => {
    it('extracts content keywords and drops stopwords', () => {
      const result = extractKeywords(
        'How do I improve technical SEO and keyword rankings for my website?'
      )
      expect(result).toContain('technical')
      expect(result).toContain('seo')
      expect(result).toContain('rankings')
      // Stopwords like "how", "do", "and", "for", "my" should be removed.
      expect(result).not.toContain('how')
      expect(result).not.toContain('and')
    })

    it('returns an empty array for empty or whitespace input', () => {
      expect(extractKeywords('')).toEqual([])
      expect(extractKeywords('   ')).toEqual([])
    })

    it('de-duplicates and respects the max limit', () => {
      const result = extractKeywords('seo seo seo content content marketing', 2)
      expect(result.length).toBeLessThanOrEqual(2)
      expect(new Set(result).size).toBe(result.length)
    })

    it('drops tokens shorter than the minimum length', () => {
      const result = extractKeywords('ab cd optimization')
      expect(result).toContain('optimization')
      expect(result).not.toContain('ab')
    })
  })

  describe('formatKeywordHistoryForPrompt', () => {
    it('returns an empty string when there are no keywords', () => {
      expect(formatKeywordHistoryForPrompt([])).toBe('')
    })

    it('renders keywords as a bulleted prompt fragment', () => {
      const output = formatKeywordHistoryForPrompt(['seo', 'content marketing'])
      expect(output).toContain('KEYWORD STRATEGY CONTEXT')
      expect(output).toContain('- seo')
      expect(output).toContain('- content marketing')
    })
  })

  describe('recordChatKeywords', () => {
    it('records keywords for SEO messages', async () => {
      const keywords = await recordChatKeywords({
        userId: 'user-1',
        mode: 'seo',
        text: 'I want to rank for enterprise keyword research tools',
      })
      expect(keywords.length).toBeGreaterThan(0)
      expect(insertAgentDocumentWithEmbedding).toHaveBeenCalledTimes(1)
      const arg = (insertAgentDocumentWithEmbedding as Mock).mock.calls[0][0]
      expect(arg.sourceType).toBe('keyword_history')
      expect(arg.mode).toBe('content')
      expect(arg.metadata.userId).toBe('user-1')
    })

    it('ignores content-mode messages (only seo/geo are tracked)', async () => {
      const keywords = await recordChatKeywords({
        userId: 'user-1',
        mode: 'content',
        text: 'Write me a blog post about keyword research',
      })
      expect(keywords).toEqual([])
      expect(insertAgentDocumentWithEmbedding).not.toHaveBeenCalled()
    })

    it('returns an empty array when userId is missing', async () => {
      const keywords = await recordChatKeywords({
        userId: '',
        mode: 'seo',
        text: 'keyword research tools',
      })
      expect(keywords).toEqual([])
      expect(insertAgentDocumentWithEmbedding).not.toHaveBeenCalled()
    })

    it('does not throw when the insert fails', async () => {
      ;(insertAgentDocumentWithEmbedding as Mock).mockRejectedValueOnce(
        new Error('db down')
      )
      const keywords = await recordChatKeywords({
        userId: 'user-1',
        mode: 'geo',
        text: 'ai visibility tracking keywords',
      })
      // Extraction still succeeds even though persistence failed.
      expect(keywords.length).toBeGreaterThan(0)
    })
  })

  describe('retrieveKeywordHistory', () => {
    it('returns an empty array when userId or query is missing', async () => {
      expect(await retrieveKeywordHistory('', 'topic')).toEqual([])
      expect(await retrieveKeywordHistory('user-1', '')).toEqual([])
      expect(searchUserAgentDocuments).not.toHaveBeenCalled()
    })

    it('flattens and de-duplicates keywords from matched documents', async () => {
      ;(searchUserAgentDocuments as Mock).mockResolvedValueOnce([
        { content: 'seo, rankings', metadata: {} },
        { content: 'rankings, content marketing', metadata: {} },
      ])
      const result = await retrieveKeywordHistory('user-1', 'blog post about seo')
      expect(result).toEqual(
        expect.arrayContaining(['seo', 'rankings', 'content marketing'])
      )
      expect(new Set(result).size).toBe(result.length)
    })

    it('returns an empty array when retrieval fails', async () => {
      ;(searchUserAgentDocuments as Mock).mockRejectedValueOnce(
        new Error('search failed')
      )
      expect(await retrieveKeywordHistory('user-1', 'topic')).toEqual([])
    })
  })
})
