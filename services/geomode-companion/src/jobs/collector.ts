import type pg from 'pg'
import type { CompanionConfig } from '../config.js'
import { parseTrackedKeywords } from '../config.js'
import { recordJobRun } from '../db/local.js'

const DATAFORSEO_BASE = 'https://api.dataforseo.com/v3'

function basicAuth(login: string, password: string) {
  return `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`
}

function normalizeHostname(host: string): string {
  return host.toLowerCase().replace(/^www\./, '').replace(/\/$/, '')
}

function isDomainMatch(itemDomain: string, trackedDomain: string): boolean {
  const a = normalizeHostname(itemDomain)
  const b = normalizeHostname(trackedDomain)
  return a === b || a.endsWith(`.${b}`)
}

function extractRank(items: Array<{ type?: string, rank_group?: number, domain?: string }>, domain: string): number | null {
  const organic = items.find(item => item.type === 'organic' && item.domain != null && isDomainMatch(item.domain, domain))
  return organic?.rank_group ?? null
}

function extractSerpFeatures(items: Array<{ type?: string }>): string[] {
  const features = new Set<string>()
  for (const item of items) {
    if (item.type && item.type !== 'organic') features.add(item.type)
  }
  return [...features]
}

export interface CollectorResult {
  keyword: string
  domain: string
  rank: number | null
  previousRank: number | null
  searchVolume: number | null
  serpFeatures: string[]
}

export async function collectSerpSnapshot(
  config: CompanionConfig,
  keyword: string,
  domain: string,
): Promise<CollectorResult> {
  const response = await fetch(`${DATAFORSEO_BASE}/serp/google/organic/live/advanced`, {
    method: 'POST',
    headers: {
      Authorization: basicAuth(config.DATAFORSEO_LOGIN, config.DATAFORSEO_PASSWORD),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{
      keyword,
      location_code: 2840,
      language_code: 'en',
      device: 'desktop',
      depth: 20,
    }]),
  })

  if (!response.ok) {
    throw new Error(`DataForSEO HTTP ${response.status}`)
  }

  const payload = await response.json() as {
    tasks?: Array<{ result?: Array<{ items?: Array<{ type?: string, rank_group?: number, domain?: string }> }> }>
  }

  const items = payload.tasks?.[0]?.result?.[0]?.items ?? []
  const rank = extractRank(items, domain)

  return {
    keyword,
    domain,
    rank,
    previousRank: null,
    searchVolume: null,
    serpFeatures: extractSerpFeatures(items),
  }
}

export async function runDataForSeoCollector(
  pool: pg.Pool,
  config: CompanionConfig,
  options: { dryRun?: boolean, date?: string } = {},
) {
  const snapshotDate = options.date ?? new Date().toISOString().slice(0, 10)
  const keywords = parseTrackedKeywords(config.TRACKED_KEYWORDS, config.TRACKED_DOMAIN)

  if (keywords.length === 0) {
    throw new Error('TRACKED_KEYWORDS is empty')
  }

  const results: CollectorResult[] = []
  for (const entry of keywords) {
    const snapshot = await collectSerpSnapshot(config, entry.keyword, entry.domain)

    const previous = await pool.query<{ rank: number | null }>(`
      SELECT rank
      FROM companion.serp_snapshots
      WHERE keyword = $1 AND domain = $2 AND snapshot_date = ($3::date - INTERVAL '1 day')::date
      LIMIT 1
    `, [entry.keyword, entry.domain, snapshotDate])

    snapshot.previousRank = previous.rows[0]?.rank ?? null

    results.push(snapshot)

    if (!options.dryRun) {
      await pool.query(`
        INSERT INTO companion.serp_snapshots (
          keyword, domain, snapshot_date, rank, previous_rank, search_volume, serp_features, raw_json
        ) VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8::jsonb)
        ON CONFLICT (keyword, domain, snapshot_date) DO UPDATE SET
          rank = EXCLUDED.rank,
          previous_rank = EXCLUDED.previous_rank,
          search_volume = EXCLUDED.search_volume,
          serp_features = EXCLUDED.serp_features,
          raw_json = EXCLUDED.raw_json,
          collected_at = NOW()
      `, [
        snapshot.keyword,
        snapshot.domain,
        snapshotDate,
        snapshot.rank,
        snapshot.previousRank,
        snapshot.searchVolume,
        snapshot.serpFeatures,
        JSON.stringify(snapshot),
      ])
    }
  }

  if (!options.dryRun) {
    await recordJobRun(pool, 'dataforseo-collector', 'completed', {
      snapshotDate,
      keywordCount: results.length,
    })
  }

  return { snapshotDate, results }
}
