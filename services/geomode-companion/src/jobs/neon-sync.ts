import { neon } from '@neondatabase/serverless'
import type { CompanionConfig } from '../config.js'
import type { DailyDigestDocument, GeoSuggestions } from '../contracts/digest.js'
import { digestEmbeddingSections } from './digest-builder.js'

async function embedText(apiKey: string, content: string): Promise<number[] | null> {
  const response = await fetch('https://ai-gateway.vercel.sh/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: content,
    }),
  })

  if (!response.ok) return null
  const payload = await response.json() as { data?: Array<{ embedding?: number[] }> }
  return payload.data?.[0]?.embedding ?? null
}

export async function syncDigestToNeon(
  config: CompanionConfig,
  digestDate: string,
  brand: string,
  digest: DailyDigestDocument,
  degradedSections: string[],
  suggestions: GeoSuggestions | null,
) {
  const sql = neon(config.NEON_DATABASE_URL)

  const rows = await sql`
    INSERT INTO geo_tracking.daily_digests (
      digest_date, brand, digest, degraded_sections, suggestions, synced_at
    ) VALUES (
      ${digestDate}::date,
      ${brand},
      ${JSON.stringify(digest)}::jsonb,
      ${degradedSections},
      ${suggestions ? JSON.stringify(suggestions) : null}::jsonb,
      NOW()
    )
    ON CONFLICT (digest_date) DO UPDATE SET
      brand = EXCLUDED.brand,
      digest = EXCLUDED.digest,
      degraded_sections = EXCLUDED.degraded_sections,
      suggestions = EXCLUDED.suggestions,
      synced_at = NOW()
    RETURNING id
  `

  const digestId = rows[0]?.id as string | undefined
  if (!digestId || !config.AI_GATEWAY_API_KEY) return { digestId }

  for (const section of digestEmbeddingSections(digest)) {
    const embedding = await embedText(config.AI_GATEWAY_API_KEY, section.content)
    if (!embedding) continue

    const embeddingVector = `[${embedding.join(',')}]`
    await sql`
      INSERT INTO geo_tracking.digest_embeddings (digest_id, section_key, content, embedding)
      VALUES (
        ${digestId}::uuid,
        ${section.sectionKey},
        ${section.content},
        ${embeddingVector}::vector
      )
      ON CONFLICT (digest_id, section_key) DO UPDATE SET
        content = EXCLUDED.content,
        embedding = EXCLUDED.embedding
    `
  }

  return { digestId }
}
