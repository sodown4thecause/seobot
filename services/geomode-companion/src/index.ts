import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import PgBoss from 'pg-boss'
import { loadConfig } from './config.js'
import { startReadApi } from './api/server.js'
import { createLocalPool, listSerpSnapshotsForDate, readGeomodeDailySummary, recordJobRun, upsertLocalDigest } from './db/local.js'
import { runDataForSeoCollector } from './jobs/collector.js'
import { buildDailyDigest } from './jobs/digest-builder.js'
import { generateGeoSuggestions } from './jobs/suggestions.js'
import { syncDigestToNeon } from './jobs/neon-sync.js'

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../migrations')

async function migrate(pool: ReturnType<typeof createLocalPool>) {
  const files = ['001_companion_schema.sql', '002_elmo_summary_views.sql']
  for (const file of files) {
    const migrationPath = path.join(migrationsDir, file)
    const sql = await readFile(migrationPath, 'utf8')
    await pool.query(sql)
  }
}

function utcDateString(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

async function runDigestPipeline(pool: ReturnType<typeof createLocalPool>, config: ReturnType<typeof loadConfig>) {
  const digestDate = utcDateString()
  const windowHours = 24

  const geomode = await readGeomodeDailySummary(pool, config, windowHours)
  const serpRows = await listSerpSnapshotsForDate(pool, digestDate)
  const previousDate = new Date(`${digestDate}T00:00:00Z`)
  previousDate.setUTCDate(previousDate.getUTCDate() - 1)
  const previousSerpRows = await listSerpSnapshotsForDate(pool, utcDateString(previousDate))

  const serpSnapshots = serpRows.map(row => ({
    keyword: row.keyword,
    domain: row.domain,
    rank: row.rank,
    previousRank: row.previousRank,
    rankDelta: row.rank != null && row.previousRank != null ? row.previousRank - row.rank : undefined,
    searchVolume: row.searchVolume,
    serpFeatures: row.serpFeatures,
  }))

  const previousSerpSnapshots = previousSerpRows.map(row => ({
    keyword: row.keyword,
    domain: row.domain,
    rank: row.rank,
    previousRank: row.previousRank,
    searchVolume: row.searchVolume,
    serpFeatures: row.serpFeatures,
  }))

  const digest = buildDailyDigest({
    date: digestDate,
    brand: config.TRACKED_BRAND,
    windowHours,
    geomode,
    serpSnapshots,
    previousSerpSnapshots,
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
  await syncDigestToNeon(config, digestDate, config.TRACKED_BRAND, digest, digest.degradedSections, suggestions)
  await recordJobRun(pool, 'digest-pipeline', digest.degraded ? 'degraded' : 'completed', { digestDate })
}

async function main() {
  const config = loadConfig()
  const pool = createLocalPool(config.DATABASE_URL)
  await migrate(pool)

  const boss = new PgBoss({
    connectionString: config.DATABASE_URL,
    schema: 'companion_pgboss',
  })
  await boss.start()

  await boss.createQueue('dataforseo-collector')
  await boss.createQueue('digest-pipeline')

  await boss.schedule('dataforseo-collector', '0 3 * * *', {}, { tz: config.JOB_TIMEZONE })
  await boss.schedule('digest-pipeline', '30 3 * * *', {}, { tz: config.JOB_TIMEZONE })

  await boss.work('dataforseo-collector', async () => {
    await runDataForSeoCollector(pool, config)
  })

  await boss.work('digest-pipeline', async () => {
    await runDigestPipeline(pool, config)
  })

  startReadApi(pool, config)

  const shutdown = async () => {
    await boss.stop()
    await pool.end()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
