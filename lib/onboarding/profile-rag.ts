import { sql } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { db } from '@/lib/db'
import { brandVoices, businessProfiles, type Json } from '@/lib/db/schema'
import type { ChatMode } from '@/lib/chat/modes'

const ONBOARDING_SOURCE_TYPE = 'onboarding_context'
const ONBOARDING_AGENT_TYPE = 'user_context'
const RAG_MODES: ChatMode[] = ['seo', 'geo', 'content']

function formatJsonValue(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => Boolean(entryValue))
      .map(([key, entryValue]) => `${key}: ${String(entryValue)}`)
  }
  return [String(value)]
}

function brandFromWebsiteUrl(websiteUrl: string | null): string | null {
  if (!websiteUrl) return null

  try {
    const hostname = new URL(websiteUrl).hostname.replace(/^www\./, '')
    return hostname.split('.')[0] || hostname
  } catch {
    return websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || null
  }
}

export function buildBusinessProfileRagDocument(params: {
  profile: typeof businessProfiles.$inferSelect
  brandVoice?: typeof brandVoices.$inferSelect | null
}): string {
  const { profile, brandVoice } = params
  const lines: string[] = ['User business onboarding context']

  if (profile.websiteUrl) lines.push(`Website: ${profile.websiteUrl}`)
  if (profile.industry) lines.push(`Industry: ${profile.industry}`)

  const locations = formatJsonValue(profile.locations)
  if (locations.length > 0) lines.push(`Target locations: ${locations.join(', ')}`)

  const goals = formatJsonValue(profile.goals)
  if (goals.length > 0) lines.push(`Business goals: ${goals.join(', ')}`)

  if (profile.contentFrequency) lines.push(`Content frequency: ${profile.contentFrequency}`)

  if (brandVoice?.tone) lines.push(`Brand voice tone: ${brandVoice.tone}`)
  if (brandVoice?.style) lines.push(`Brand voice style: ${brandVoice.style}`)

  const personality = formatJsonValue(brandVoice?.personality)
  if (personality.length > 0) lines.push(`Brand personality: ${personality.join(', ')}`)

  if (brandVoice?.samplePhrases?.length) {
    lines.push(`Sample phrases: ${brandVoice.samplePhrases.slice(0, 5).join(' | ')}`)
  }

  return lines.join('\n')
}

export async function syncBusinessContextRag(userId: string, abortSignal?: AbortSignal): Promise<void> {
  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.userId, userId))
    .limit(1)

  if (!profile?.websiteUrl) {
    for (const mode of RAG_MODES) {
      await db.execute(sql`
        DELETE FROM agent_documents
        WHERE source_type = ${ONBOARDING_SOURCE_TYPE}
          AND mode = ${mode}
          AND metadata->>'userId' = ${userId}
      `)
    }
    return
  }

  const [brandVoice] = await db
    .select()
    .from(brandVoices)
    .where(eq(brandVoices.userId, userId))
    .limit(1)

  const content = buildBusinessProfileRagDocument({
    profile,
    brandVoice: brandVoice ?? null,
  })

  const embedding = await generateEmbedding(content, abortSignal)
  const embeddingStr = `[${embedding.join(',')}]`
  const brand = brandFromWebsiteUrl(profile.websiteUrl)
  const metadata = {
    userId,
    kind: 'business_profile',
    source: ONBOARDING_SOURCE_TYPE,
    modes: RAG_MODES,
    updatedFrom: 'onboarding',
  } satisfies Json

  for (const mode of RAG_MODES) {
    const existing = await db.execute(sql`
      SELECT id
      FROM agent_documents
      WHERE source_type = ${ONBOARDING_SOURCE_TYPE}
        AND mode = ${mode}
        AND metadata->>'userId' = ${userId}
      ORDER BY updated_at DESC NULLS LAST, created_at DESC
    `)

    const primaryId = existing.rows[0]?.id ? String(existing.rows[0].id) : null

    if (primaryId) {
      await db.execute(sql`
        UPDATE agent_documents
        SET
          agent_type = ${ONBOARDING_AGENT_TYPE},
          title = ${`Business context for ${profile.websiteUrl} (${mode})`},
          content = ${content},
          embedding = ${embeddingStr}::vector,
          source_type = ${ONBOARDING_SOURCE_TYPE},
          topic = ${'business_profile'},
          brand = ${brand},
          metadata = ${JSON.stringify(metadata)}::jsonb,
          updated_at = NOW()
        WHERE id = ${primaryId}::uuid
      `)

      await db.execute(sql`
        DELETE FROM agent_documents
        WHERE source_type = ${ONBOARDING_SOURCE_TYPE}
          AND mode = ${mode}
          AND metadata->>'userId' = ${userId}
          AND id <> ${primaryId}::uuid
      `)
    } else {
      await db.execute(sql`
        INSERT INTO agent_documents (
          agent_type,
          mode,
          title,
          content,
          embedding,
          source_type,
          topic,
          brand,
          metadata
        )
        VALUES (
          ${ONBOARDING_AGENT_TYPE},
          ${mode},
          ${`Business context for ${profile.websiteUrl} (${mode})`},
          ${content},
          ${embeddingStr}::vector,
          ${ONBOARDING_SOURCE_TYPE},
          ${'business_profile'},
          ${brand},
          ${JSON.stringify(metadata)}::jsonb
        )
      `)
    }
  }
}
