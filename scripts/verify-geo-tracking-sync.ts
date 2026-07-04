import { Pool } from '@neondatabase/serverless'
import { config } from 'dotenv'

config({ path: '.env.local' })

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const digests = await pool.query(`
    SELECT digest_date, brand, synced_at,
      (SELECT COUNT(*)::int FROM geo_tracking.digest_embeddings e WHERE e.digest_id = d.id) AS embedding_count
    FROM geo_tracking.daily_digests d
    ORDER BY digest_date DESC
    LIMIT 5
  `)
  console.log('Neon geo_tracking digests:', digests.rows)
  await pool.end()
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
