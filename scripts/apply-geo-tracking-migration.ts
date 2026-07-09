import { Pool } from '@neondatabase/serverless'
import { readFileSync } from 'node:fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL missing')
}

async function main() {
  const pool = new Pool({ connectionString: databaseUrl })
  const migration = readFileSync('drizzle/0007_geo_tracking.sql', 'utf8')

  await pool.query('CREATE EXTENSION IF NOT EXISTS vector')
  await pool.query(migration)

  const migration2 = readFileSync('drizzle/0008_elmo_brand_id.sql', 'utf8')
  await pool.query(migration2)

  const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'geo_tracking'
    ORDER BY table_name
  `)
  console.log('geo_tracking tables:', result.rows)
  await pool.end()
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
