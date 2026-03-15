/**
 * SEO-AEO Agent Context
 *
 * Fetches user business profile + RAG knowledge documents in parallel.
 * Injected into the seo-aeo agent system prompt to ground responses
 * in real Feb 2026 industry data and user-specific context.
 */

import { eq } from 'drizzle-orm'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { db } from '@/lib/db'
import { businessProfiles } from '@/lib/db/schema'
import { searchAgentDocuments } from '@/lib/db/vector-search'

interface SeoAeoContext {
  systemPromptAddendum: string
  ragDocsFound: number
}

/**
 * Builds enriched context for the seo-aeo agent.
 * Runs user profile + RAG retrieval in parallel.
 */
export async function buildSeoAeoContext(
  query: string,
  userId?: string,
): Promise<SeoAeoContext> {
  try {
    const [queryEmbedding, userProfile] = await Promise.all([
      generateEmbedding(query).catch((error: Error) => {
        console.warn('[SEO-AEO Context] Embedding generation failed:', error.message)
        return null
      }),
      userId
        ? db
            .select()
            .from(businessProfiles)
            .where(eq(businessProfiles.userId, userId))
            .limit(1)
            .then((rows) => rows[0] ?? null)
            .catch(() => null)
        : Promise.resolve(null),
    ])

    let ragDocs: Awaited<ReturnType<typeof searchAgentDocuments>> = []
    if (queryEmbedding) {
      ragDocs = await searchAgentDocuments(queryEmbedding, 'seo_aeo', {
        threshold: 0.3,
        limit: 3,
      }).catch((error: Error) => {
        console.warn('[SEO-AEO Context] RAG retrieval failed:', error.message)
        return []
      })
    }

    console.log(`[SEO-AEO Context] RAG docs retrieved: ${ragDocs.length}`)

    const sections: string[] = []

    if (userProfile) {
      const parts: string[] = []

      if (userProfile.websiteUrl) {
        parts.push(`USER WEBSITE (already known — do NOT ask for it): ${userProfile.websiteUrl}`)
      }

      if (userProfile.industry) {
        parts.push(`Industry: ${userProfile.industry}`)
      }

      if (userProfile.goals) {
        parts.push(
          `Goals: ${Array.isArray(userProfile.goals) ? (userProfile.goals as string[]).join(', ') : String(userProfile.goals)}`,
        )
      }

      if (parts.length > 0) {
        sections.push(`## User Business Context\n${parts.join('\n')}`)
      }
    }

    if (ragDocs.length > 0) {
      const docSections = ragDocs
        .map((doc, index) => `### Source ${index + 1}: ${doc.title}\n${doc.content}`)
        .join('\n\n')

      sections.push(
        `## Industry Research (Feb 2026)\nUse this data to give specific, cited answers:\n\n${docSections}`,
      )
    }

    if (sections.length === 0) {
      return { systemPromptAddendum: '', ragDocsFound: 0 }
    }

    return {
      systemPromptAddendum: `\n\n---\n${sections.join('\n\n')}`,
      ragDocsFound: ragDocs.length,
    }
  } catch (error) {
    console.error('[SEO-AEO Context] Unexpected error:', error)
    return { systemPromptAddendum: '', ragDocsFound: 0 }
  }
}
