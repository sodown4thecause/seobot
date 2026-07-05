import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { loadConfig } from '../config.js'
import { createLocalPool, listSerpSnapshotsForDate, readGeomodeDailySummary, recordJobRun, upsertLocalDigest } from '../db/local.js'
import { runDataForSeoCollector } from '../jobs/collector.js'
import { buildDailyDigest } from '../jobs/digest-builder.js'
import { syncDigestToNeon } from '../jobs/neon-sync.js'
import { generateGeoSuggestions } from '../jobs/suggestions.js'

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../migrations')

async function migrate(pool: ReturnType<typeof createLocalPool>) {
  for (const file of ['001_companion_schema.sql', '002_elmo_summary_views.sql']) {
    const sql = await readFile(path.join(migrationsDir, file), 'utf8')
    await pool.query(sql)
  }
}

function utcDateString(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

async function main() {
  const config = loadConfig()
  const pool = createLocalPool(config.DATABASE_URL)
  await migrate(pool)

  console.log('Running DataForSEO collector...')
  await runDataForSeoCollector(pool, config)

  const digestDate = utcDateString()
  const windowHours = 24
  const geomode = await readGeomodeDailySummary(pool, config, windowHours)
  const serpRows = await listSerpSnapshotsForDate(pool, digestDate)
  const previousDate = new Date(`${digestDate}T00:00:00Z`)
  previousDate.setUTCDate(previousDate.getUTCDate() - 1)
  const previousSerpRows = await listSerpSnapshotsForDate(pool, utcDateString(previousDate))

  const digest = buildDailyDigest({
    date: digestDate,
    brand: config.TRACKED_BRAND,
    windowHours,
    geomode,
    serpSnapshots: serpRows.map(row => ({
      keyword: row.keyword,
      domain: row.domain,
      rank: row.rank,
      previousRank: row.previousRank,
      rankDelta: row.rank != null && row.previousRank != null ? row.previousRank - row.rank : undefined,
      searchVolume: row.searchVolume,
      serpFeatures: row.serpFeatures,
    })),
    previousSerpSnapshots: previousSerpRows.map(row => ({
      keyword: row.keyword,
      domain: row.domain,
      rank: row.rank,
      previousRank: row.previousRank,
      searchVolume: row.searchVolume,
      serpFeatures: row.serpFeatures,
    })),
  })

  let suggestions = null
  try {
    suggestions = await generateGeoSuggestions(config, digest)
  } catch (error) {
    digest.degraded = true
    if (!digest.degradedSections.includes('suggestions')) {
      digest.degradedSections.push('suggestions')
    }
    await recordJobRun(pool, 'suggestions', 'degraded', {}, error instanceof Error ? error.message : 'suggestion generation failed')
  }

  await upsertLocalDigest(pool, digestDate, config.TRACKED_BRAND, digest, digest.degradedSections, suggestions)
  const syncResult = await syncDigestToNeon(config, digestDate, config.TRACKED_BRAND, digest, digest.degradedSections, suggestions)
  await recordJobRun(pool, 'digest-pipeline', digest.degraded ? 'degraded' : 'completed', { digestDate })

  console.log('Pipeline complete', { digestDate, syncResult, degraded: digest.degraded })
  await pool.end()
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
