/**
 * SEO-AEO Agent Context
 *
 * Fetches user business profile and RAG knowledge documents in parallel.
 * Injected into the seo-aeo agent system prompt to ground responses
 * in recent industry data and user-specific context.
 */

import { generateEmbedding } from '@/lib/ai/embeddings'
import { searchAgentDocuments } from '@/lib/db/vector-search'
import { db } from '@/lib/db'
import { businessProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

interface SeoAeoContext {
  systemPromptAddendum: string
  ragDocsFound: number
}

interface BuildSeoAeoContextOptions {
  signal?: AbortSignal
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw signal.reason instanceof Error ? signal.reason : new Error('SEO-AEO context generation aborted')
  }
}

/**
 * Builds enriched context for the seo-aeo agent.
 * Runs user profile lookup and RAG retrieval in parallel.
 */
export async function buildSeoAeoContext(
  query: string,
  userId?: string,
  options: BuildSeoAeoContextOptions = {}
): Promise<SeoAeoContext> {
  const { signal } = options

  try {
    throwIfAborted(signal)

    // Run embedding generation and user profile fetch in parallel.
    const [queryEmbedding, userProfile] = await Promise.all([
      generateEmbedding(query, signal).catch(err => {
        console.warn('[SEO-AEO Context] Embedding generation failed:', err.message)
        return null
      }),
      userId
        ? db.select().from(businessProfiles).where(eq(businessProfiles.userId, userId)).limit(1)
          .then(rows => rows[0] ?? null)
          .catch(() => null)
        : Promise.resolve(null),
    ])

    throwIfAborted(signal)

    // Retrieve relevant RAG docs if embedding succeeded.
    let ragDocs: Awaited<ReturnType<typeof searchAgentDocuments>> = []
    if (queryEmbedding) {
      ragDocs = await searchAgentDocuments(queryEmbedding, 'seo_aeo', {
        threshold: 0.3,
        limit: 3,
      }).catch(err => {
        console.warn('[SEO-AEO Context] RAG retrieval failed:', err.message)
        return []
      })
    }

    throwIfAborted(signal)

    console.log(`[SEO-AEO Context] RAG docs retrieved: ${ragDocs.length}`)

    const sections: string[] = []

    if (userProfile) {
      const parts: string[] = []
      if (userProfile.websiteUrl) parts.push(`USER WEBSITE (already known; do not ask for it): ${userProfile.websiteUrl}`)
      if (userProfile.industry) parts.push(`Industry: ${userProfile.industry}`)
      if (userProfile.goals) parts.push(`Goals: ${Array.isArray(userProfile.goals) ? (userProfile.goals as string[]).join(', ') : String(userProfile.goals)}`)
      if (parts.length > 0) {
        sections.push(`## User Business Context\n${parts.join('\n')}`)
      }
    }

    if (ragDocs.length > 0) {
      const docSections = ragDocs.map((doc, index) =>
        `### Source ${index + 1}: ${doc.title}\n${doc.content}`
      ).join('\n\n')
      sections.push(`## Industry Research\nUse this data to give specific, cited answers:\n\n${docSections}`)
    }

    if (sections.length === 0) {
      return { systemPromptAddendum: '', ragDocsFound: 0 }
    }

    return {
      systemPromptAddendum: `\n\n---\n${sections.join('\n\n')}`,
      ragDocsFound: ragDocs.length,
    }
  } catch (err) {
    if (signal?.aborted) {
      console.warn('[SEO-AEO Context] Context generation aborted')
      return { systemPromptAddendum: '', ragDocsFound: 0 }
    }

    console.error('[SEO-AEO Context] Unexpected error:', err)
    return { systemPromptAddendum: '', ragDocsFound: 0 }
  }
}
