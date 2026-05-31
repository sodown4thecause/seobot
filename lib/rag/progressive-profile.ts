/**
 * Progressive User Profiling RAG
 *
 * Every question a user asks across any mode reveals intent, gaps and
 * priorities. This module silently captures those signals into the user's
 * personal RAG namespace so, over time, the assistant understands the user's
 * full SEO/GEO/content situation without them re-explaining it.
 *
 * This is a background process — it never blocks or surfaces in the UI.
 *
 * Storage: signals are written to `agent_documents` with
 * `source_type = 'user_profile'`, the source `mode`, and the owning user in
 * `metadata.userId`. Retrieval is cross-mode so any mode's agent can read the
 * full profile.
 */

import { generateEmbedding } from '@/lib/ai/embeddings'
import {
  insertAgentDocumentWithEmbedding,
  searchUserAgentDocuments,
} from '@/lib/db/vector-search'
import type { ChatMode } from '@/lib/chat/modes'
import { CHAT_MODE_LABELS } from '@/lib/chat/modes'

const USER_PROFILE_SOURCE_TYPE = 'user_profile'
/** Messages shorter than this carry too little signal to be worth storing. */
const MIN_SIGNAL_LENGTH = 12
const MAX_SIGNAL_LENGTH = 400

export interface ProfileSignalInput {
  userId: string
  mode: ChatMode
  /** The raw user message to capture as a profiling signal. */
  userMessage: string
  conversationId?: string
}

/**
 * Turn a raw user message into a compact, self-describing profile fact.
 * Pure function (no I/O) — kept separate so it can be unit tested directly.
 */
export function summarizeSignal(mode: ChatMode, userMessage: string): string {
  const normalized = userMessage.trim().replace(/\s+/g, ' ')
  const label = CHAT_MODE_LABELS[mode] ?? mode.toUpperCase()
  return `In ${label} mode the user asked: "${normalized.slice(0, MAX_SIGNAL_LENGTH)}"`
}

/**
 * Capture a profiling signal from a user message.
 *
 * Safe to call fire-and-forget — short messages are skipped and all failures
 * are swallowed (logged) so profiling never interrupts the chat experience.
 *
 * @returns true when a signal was stored, false when it was skipped/failed
 */
export async function recordProfileSignal(
  input: ProfileSignalInput
): Promise<boolean> {
  const { userId, mode, userMessage, conversationId } = input

  if (!userId || !userMessage || userMessage.trim().length < MIN_SIGNAL_LENGTH) {
    return false
  }

  try {
    const signal = summarizeSignal(mode, userMessage)
    const embedding = await generateEmbedding(signal)

    await insertAgentDocumentWithEmbedding({
      agentType: 'user_profile',
      mode,
      title: `User profile signal (${mode})`,
      content: signal,
      sourceType: USER_PROFILE_SOURCE_TYPE,
      query: userMessage.slice(0, 500),
      metadata: {
        userId,
        mode,
        conversationId: conversationId ?? null,
        capturedAt: new Date().toISOString(),
      },
      embedding,
    })

    return true
  } catch (error) {
    console.error('[ProgressiveProfile] Failed to record signal:', error)
    return false
  }
}

export interface RetrieveProfileOptions {
  /** Max profile signals to include (default 5). */
  limit?: number
  /** Minimum cosine similarity (default 0.2 — profiling is recall-oriented). */
  threshold?: number
}

/**
 * Retrieve the user's profile signals most relevant to the current query.
 *
 * Searches across every mode so, e.g., Content mode can see what the user
 * asked in SEO and GEO mode.
 *
 * @returns A formatted prompt fragment, or an empty string when no profile
 *          data exists (safe to concatenate into a system prompt).
 */
export async function retrieveUserProfileContext(
  userId: string,
  query: string,
  options: RetrieveProfileOptions = {}
): Promise<string> {
  if (!userId || !query?.trim()) return ''

  const { limit = 5, threshold = 0.2 } = options

  try {
    const embedding = await generateEmbedding(query)
    const documents = await searchUserAgentDocuments(embedding, {
      userId,
      sourceType: USER_PROFILE_SOURCE_TYPE,
      limit,
      threshold,
    })

    if (documents.length === 0) return ''

    return [
      '**USER PROFILE CONTEXT**',
      'Based on this user\'s prior questions across all modes, keep these',
      'interests and priorities in mind when answering:',
      ...documents.map(doc => `- ${doc.content}`),
      '',
    ].join('\n')
  } catch (error) {
    console.error('[ProgressiveProfile] Retrieval failed:', error)
    return ''
  }
}
