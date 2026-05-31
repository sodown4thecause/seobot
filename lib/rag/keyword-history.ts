/**
 * Keyword History RAG
 *
 * Tracks keywords the user researched in SEO and GEO conversations and makes
 * them retrievable for Content mode. When Content mode generates an artifact it
 * pulls the user's prior keyword strategy so the post is semantically aligned
 * with the keywords they already care about.
 *
 * Storage: keyword history is written to `agent_documents` with
 * `source_type = 'keyword_history'`, `mode = 'content'`, and the owning user in
 * `metadata.userId` (the table has no dedicated user column).
 */

import keywordExtractor from 'keyword-extractor'
import { generateEmbedding } from '@/lib/ai/embeddings'
import {
  insertAgentDocumentWithEmbedding,
  searchUserAgentDocuments,
} from '@/lib/db/vector-search'
import type { ChatMode } from '@/lib/chat/modes'

/** Modes whose conversations feed the keyword history. */
export type KeywordSourceMode = Extract<ChatMode, 'seo' | 'geo'>

const MAX_KEYWORDS_PER_MESSAGE = 12
const MIN_KEYWORD_LENGTH = 3
const MAX_KEYWORD_LENGTH = 40
const KEYWORD_HISTORY_SOURCE_TYPE = 'keyword_history'

export interface RecordKeywordsInput {
  userId: string
  /** The mode the conversation happened in — only `seo`/`geo` are tracked. */
  mode: ChatMode
  /** Raw user message text to extract keywords from. */
  text: string
  conversationId?: string
}

/**
 * Extract candidate keywords from a block of text.
 *
 * Pure function (no I/O) — stopwords are removed, tokens are lower-cased,
 * de-duplicated, and bounded by length so the result is a compact keyword set.
 */
export function extractKeywords(
  text: string,
  max: number = MAX_KEYWORDS_PER_MESSAGE
): string[] {
  if (!text || !text.trim()) return []

  const extracted = keywordExtractor.extract(text, {
    language: 'english',
    remove_digits: false,
    return_changed_case: true,
    remove_duplicates: true,
  })

  const cleaned: string[] = []
  for (const raw of extracted) {
    const keyword = raw.trim().toLowerCase()
    if (keyword.length < MIN_KEYWORD_LENGTH || keyword.length > MAX_KEYWORD_LENGTH) {
      continue
    }
    if (!cleaned.includes(keyword)) cleaned.push(keyword)
    if (cleaned.length >= max) break
  }

  return cleaned
}

function isKeywordSourceMode(mode: ChatMode): mode is KeywordSourceMode {
  return mode === 'seo' || mode === 'geo'
}

/**
 * Record keywords from a user message into the Content-mode keyword namespace.
 *
 * Only `seo` and `geo` messages are tracked. Failures are swallowed (logged)
 * so keyword tracking never blocks the chat response.
 *
 * @returns the keywords that were extracted (empty when nothing was tracked)
 */
export async function recordChatKeywords(
  input: RecordKeywordsInput
): Promise<string[]> {
  const { userId, mode, text, conversationId } = input

  if (!userId || !isKeywordSourceMode(mode)) return []

  const keywords = extractKeywords(text)
  if (keywords.length === 0) return []

  try {
    const content = keywords.join(', ')
    const embedding = await generateEmbedding(content)

    await insertAgentDocumentWithEmbedding({
      agentType: 'content',
      mode: 'content',
      title: `Keyword history (${mode})`,
      content,
      sourceType: KEYWORD_HISTORY_SOURCE_TYPE,
      query: text.slice(0, 500),
      metadata: {
        userId,
        sourceMode: mode,
        conversationId: conversationId ?? null,
        keywords,
        capturedAt: new Date().toISOString(),
      },
      embedding,
    })
  } catch (error) {
    console.error('[KeywordHistory] Failed to record keywords:', error)
  }

  return keywords
}

/**
 * Retrieve keywords relevant to a Content-mode request from the user's history.
 *
 * @param userId - The user whose keyword history to search
 * @param query - The content brief / topic to align keywords with
 * @param limit - Max keyword-history documents to pull (default 8)
 * @returns A de-duplicated list of keywords (capped at 30)
 */
export async function retrieveKeywordHistory(
  userId: string,
  query: string,
  limit: number = 8
): Promise<string[]> {
  if (!userId || !query?.trim()) return []

  try {
    const embedding = await generateEmbedding(query)
    const documents = await searchUserAgentDocuments(embedding, {
      userId,
      sourceType: KEYWORD_HISTORY_SOURCE_TYPE,
      mode: 'content',
      limit,
      threshold: 0.2,
    })

    const seen = new Set<string>()
    for (const doc of documents) {
      for (const part of doc.content.split(',')) {
        const keyword = part.trim().toLowerCase()
        if (keyword) seen.add(keyword)
      }
    }

    return Array.from(seen).slice(0, 30)
  } catch (error) {
    console.error('[KeywordHistory] Retrieval failed:', error)
    return []
  }
}

/**
 * Format retrieved keyword history as a prompt fragment for Content-mode agents.
 * Returns an empty string when there is no history (safe to concatenate).
 */
export function formatKeywordHistoryForPrompt(keywords: string[]): string {
  if (keywords.length === 0) return ''

  return [
    '**KEYWORD STRATEGY CONTEXT**',
    "The user has previously researched these keywords in SEO/GEO mode. Where",
    'relevant, align the content with this existing keyword strategy:',
    ...keywords.map(keyword => `- ${keyword}`),
    '',
  ].join('\n')
}
