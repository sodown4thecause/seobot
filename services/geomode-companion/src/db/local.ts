import pg from 'pg'
import type { CompanionConfig } from '../config.js'
import type { GeomodeDailySummary } from '../jobs/digest-builder.js'
import type { GeomodeCitation, GeomodeEngineSummary } from '../contracts/digest.js'

const { Pool } = pg

export function createLocalPool(databaseUrl: string) {
  return new Pool({ connectionString: databaseUrl })
}

export async function ensureCompanionSchema(pool: pg.Pool, sql: string) {
  await pool.query(sql)
}

export async function readGeomodeDailySummary(
  pool: pg.Pool,
  config: Pick<CompanionConfig, 'ELMO_DATABASE_SCHEMA' | 'TRACKED_BRAND'>,
  windowHours: number,
): Promise<GeomodeDailySummary> {
  const schema = config.ELMO_DATABASE_SCHEMA.replace(/[^a-zA-Z0-9_]/g, '')
  const brand = config.TRACKED_BRAND

  try {
    const result = await pool.query<{
      engine: string
      mention_count: string
      citation_count: string
      share_of_voice: string | null
    }>(`
      SELECT
        engine,
        COUNT(*) FILTER (WHERE brand_mentioned = true)::text AS mention_count,
        COUNT(*) FILTER (WHERE citation_url IS NOT NULL)::text AS citation_count,
        AVG(share_of_voice)::text AS share_of_voice
      FROM ${schema}.elmo_run_summary
      WHERE captured_at >= NOW() - ($1 || ' hours')::interval
        AND brand = $2
      GROUP BY engine
      ORDER BY engine
    `, [String(windowHours), brand])

    const engines: GeomodeEngineSummary[] = result.rows.map(row => ({
      engine: row.engine,
      mentionCount: Number(row.mention_count ?? 0),
      citationCount: Number(row.citation_count ?? 0),
      shareOfVoice: row.share_of_voice ? Number(row.share_of_voice) : undefined,
      sentiment: 'unknown',
    }))

    const citationResult = await pool.query<{
      url: string
      domain: string
      engines: string[] | null
      mentions_brand: boolean
    }>(`
      SELECT url, domain, engines, mentions_brand
      FROM ${schema}.elmo_citation_summary
      WHERE captured_at >= NOW() - ($1 || ' hours')::interval
        AND brand = $2
      ORDER BY citation_count DESC
      LIMIT 25
    `, [String(windowHours), brand])

    const citations: GeomodeCitation[] = citationResult.rows.map(row => ({
      url: row.url,
      domain: row.domain,
      engines: row.engines ?? [],
      mentionsBrand: row.mentions_brand,
    }))

    return {
      status: engines.length > 0 || citations.length > 0 ? 'ok' : 'degraded',
      engines,
      citations,
    }
  } catch (error) {
    return {
      status: 'missing',
      engines: [],
      citations: [],
      error: error instanceof Error ? error.message : 'geomode summary query failed',
    }
  }
}

export interface SerpRow {
  keyword: string
  domain: string
  rank: number | null
  previousRank: number | null
  searchVolume: number | null
  serpFeatures: string[]
}

export async function listSerpSnapshotsForDate(pool: pg.Pool, date: string): Promise<SerpRow[]> {
  const result = await pool.query<{
    keyword: string
    domain: string
    rank: number | null
    previous_rank: number | null
    search_volume: number | null
    serp_features: string[] | null
  }>(`
    SELECT keyword, domain, rank, previous_rank, search_volume, serp_features
    FROM companion.serp_snapshots
    WHERE snapshot_date = $1::date
    ORDER BY keyword ASC
  `, [date])

  return result.rows.map(row => ({
    keyword: row.keyword,
    domain: row.domain,
    rank: row.rank,
    previousRank: row.previous_rank,
    searchVolume: row.search_volume,
    serpFeatures: row.serp_features ?? [],
  }))
}

export async function recordJobRun(
  pool: pg.Pool,
  jobName: string,
  status: string,
  metadata: Record<string, unknown> = {},
  error?: string,
) {
  await pool.query(`
    INSERT INTO companion.job_runs (job_name, status, finished_at, error, metadata)
    VALUES ($1, $2, NOW(), $3, $4::jsonb)
  `, [jobName, status, error ?? null, JSON.stringify(metadata)])
}

export async function getRecentJobRuns(pool: pg.Pool, limit = 20) {
  const result = await pool.query<{
    job_name: string
    status: string
    started_at: Date
    finished_at: Date | null
    error: string | null
    metadata: Record<string, unknown> | null
  }>(`
    SELECT job_name, status, started_at, finished_at, error, metadata
    FROM companion.job_runs
    ORDER BY started_at DESC
    LIMIT $1
  `, [limit])

  return result.rows.map(row => ({
    jobName: row.job_name,
    status: row.status,
    startedAt: row.started_at.toISOString(),
    finishedAt: row.finished_at?.toISOString(),
    error: row.error ?? undefined,
    metadata: row.metadata ?? undefined,
  }))
}

export async function upsertLocalDigest(
  pool: pg.Pool,
  digestDate: string,
  brand: string,
  digest: unknown,
  degradedSections: string[],
  suggestions: unknown | null,
) {
  await pool.query(`
    INSERT INTO companion.daily_digest (digest_date, brand, digest, degraded_sections, suggestions, built_at)
    VALUES ($1::date, $2, $3::jsonb, $4, $5::jsonb, NOW())
    ON CONFLICT (digest_date) DO UPDATE SET
      brand = EXCLUDED.brand,
      digest = EXCLUDED.digest,
      degraded_sections = EXCLUDED.degraded_sections,
      suggestions = EXCLUDED.suggestions,
      built_at = NOW()
  `, [digestDate, brand, JSON.stringify(digest), degradedSections, suggestions ? JSON.stringify(suggestions) : null])
}

export async function getLocalDigest(pool: pg.Pool, digestDate: string) {
  const result = await pool.query(`
    SELECT digest_date, brand, digest, degraded_sections, suggestions
    FROM companion.daily_digest
    WHERE digest_date = $1::date
    LIMIT 1
  `, [digestDate])

  return result.rows[0] ?? null
}

export async function getLatestLocalDigest(pool: pg.Pool) {
  const result = await pool.query(`
    SELECT digest_date, brand, digest, degraded_sections, suggestions
    FROM companion.daily_digest
    ORDER BY digest_date DESC
    LIMIT 1
  `)

  return result.rows[0] ?? null
}

export async function listLocalDigests(pool: pg.Pool, days: number) {
  const result = await pool.query(`
    SELECT digest_date, brand, digest, degraded_sections, suggestions
    FROM companion.daily_digest
    WHERE digest_date >= CURRENT_DATE - ($1::int - 1)
    ORDER BY digest_date DESC
  `, [days])

  return result.rows
}
