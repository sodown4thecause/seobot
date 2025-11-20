/**
 * Seed Script for Writing Frameworks
 * 
 * This script populates the writing_frameworks table with initial SEO/AEO/GEO/Marketing frameworks.
 * It generates embeddings for each framework description and upserts them into the database.
 * 
 * Usage: npm run seed:frameworks
 * 
 * Requirements:
 * - SUPABASE_SERVICE_ROLE_KEY must be set (bypasses RLS)
 * - OPENAI_API_KEY must be set for embeddings
 * - 003_framework_policies.sql migration must be applied first
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '../lib/ai/embedding'
import { FRAMEWORK_SEEDS, type FrameworkSeed } from '../lib/ai/framework-seeds'
import pLimit from 'p-limit'

// Load environment variables from .env.local
config({ path: '.env.local' })

// ============================================================================
// CONFIGURATION
// ============================================================================

const BATCH_SIZE = 10 // Process 10 frameworks at a time
const CONCURRENCY_LIMIT = 5 // Max 5 concurrent embedding requests

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\n💡 Make sure these are set in your .env.local file')
  process.exit(1)
}

if (!GOOGLE_API_KEY) {
  console.error('❌ Missing GOOGLE_API_KEY environment variable')
  console.error('💡 Required for generating embeddings')
  process.exit(1)
}

// ============================================================================
// SUPABASE CLIENT (SERVICE ROLE)
// ============================================================================

// Use service role key to bypass RLS policies
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// ============================================================================
// TYPES
// ============================================================================

interface FrameworkRow {
  name: string
  description: string
  structure: Record<string, unknown>
  example: string
  category: string
  tags: string[]
  embedding: number[]
  is_custom: boolean
  user_id: null
  usage_count: number
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate embedding with error handling
 */
async function generateEmbeddingWithRetry(
  description: string,
  frameworkName: string
): Promise<number[] | null> {
  try {
    const embedding = await generateEmbedding(description)
    return embedding
  } catch (error) {
    console.error(`   ⚠️  Failed to generate embedding for "${frameworkName}":`, error)
    return null
  }
}

/**
 * Prepare framework for database insertion
 */
async function prepareFramework(
  seed: FrameworkSeed
): Promise<FrameworkRow | null> {
  console.log(`   📝 Processing: ${seed.name}`)

  // Generate embedding from description
  const embedding = await generateEmbeddingWithRetry(seed.description, seed.name)

  if (!embedding) {
    console.error(`   ❌ Skipping "${seed.name}" due to embedding failure`)
    return null
  }

  return {
    name: seed.name,
    description: seed.description,
    structure: seed.structure as unknown as Record<string, unknown>,
    example: seed.example,
    category: seed.category,
    tags: seed.tags,
    embedding,
    is_custom: false,
    user_id: null,
    usage_count: 0,
  }
}

/**
 * Upsert a batch of frameworks to database
 * Uses manual check + update/insert since unique constraint is on lower(name)
 */
async function upsertFrameworkBatch(frameworks: FrameworkRow[]): Promise<void> {
  for (const framework of frameworks) {
    // Check if framework exists (case-insensitive)
    const { data: existing } = await supabase
      .from('writing_frameworks')
      .select('id')
      .ilike('name', framework.name)
      .eq('category', framework.category)
      .is('user_id', null)
      .single()

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('writing_frameworks')
        .update(framework)
        .eq('id', existing.id)

      if (error) {
        console.error(`   ❌ Failed to update "${framework.name}":`, error.message)
        throw error
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('writing_frameworks')
        .insert(framework)

      if (error) {
        console.error(`   ❌ Failed to insert "${framework.name}":`, error.message)
        throw error
      }
    }
  }
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedFrameworks() {
  const startTime = Date.now()

  console.log('\n🌱 Framework Seeding Started')
  console.log('='.repeat(60))
  console.log(`📦 Total frameworks to seed: ${FRAMEWORK_SEEDS.length}`)
  console.log(`⚙️  Batch size: ${BATCH_SIZE}`)
  console.log(`🔄 Concurrency limit: ${CONCURRENCY_LIMIT}`)
  console.log('='.repeat(60) + '\n')

  // Process frameworks in batches
  const batches: FrameworkSeed[][] = []
  for (let i = 0; i < FRAMEWORK_SEEDS.length; i += BATCH_SIZE) {
    batches.push(FRAMEWORK_SEEDS.slice(i, i + BATCH_SIZE))
  }

  let totalProcessed = 0
  let totalSkipped = 0

  // Concurrency limiter for embedding generation
  const limit = pLimit(CONCURRENCY_LIMIT)

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]
    const batchNum = batchIndex + 1

    console.log(`\n📦 Batch ${batchNum}/${batches.length} (${batch.length} frameworks)`)
    console.log('-'.repeat(60))

    // Generate embeddings for all frameworks in batch (with concurrency control)
    const batchStartTime = Date.now()

    const preparedFrameworks = await Promise.all(
      batch.map((seed) => limit(() => prepareFramework(seed)))
    )

    // Filter out null results (failed embeddings)
    const validFrameworks = preparedFrameworks.filter(
      (fw): fw is FrameworkRow => fw !== null
    )

    if (validFrameworks.length === 0) {
      console.warn(`   ⚠️  No valid frameworks in batch ${batchNum}, skipping...`)
      totalSkipped += batch.length
      continue
    }

    // Upsert to database
    try {
      await upsertFrameworkBatch(validFrameworks)

      const batchDuration = Date.now() - batchStartTime
      totalProcessed += validFrameworks.length
      totalSkipped += batch.length - validFrameworks.length

      console.log(`   ✅ Upserted ${validFrameworks.length} frameworks`)
      console.log(`   ⏱️  Batch completed in ${batchDuration}ms`)
    } catch (error) {
      console.error(`   ❌ Failed to upsert batch ${batchNum}:`, error)
      totalSkipped += validFrameworks.length
    }
  }

  // ============================================================================
  // POST-SEED OPTIMIZATION
  // ============================================================================

  console.log('\n🔧 Running post-seed optimization...')

  try {
    // Run ANALYZE to update table statistics for query planner
    const { error } = await (supabase.rpc as any)('exec_sql', {
      query: 'ANALYZE writing_frameworks;',
    })
    if (error) {
      // Fallback: If RPC doesn't exist, log warning
      console.warn('   ⚠️  Could not run ANALYZE (RPC not available)')
      console.warn('   💡 Run manually: ANALYZE writing_frameworks;')
    } else {
      console.log('   ✅ Table statistics updated')
    }
  } catch (error) {
    console.warn('   ⚠️  Post-seed optimization skipped')
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  const totalDuration = Date.now() - startTime
  const avgTimePerFramework = Math.round(totalDuration / FRAMEWORK_SEEDS.length)

  console.log('\n' + '='.repeat(60))
  console.log('🎉 Seeding Complete!')
  console.log('='.repeat(60))
  console.log(`✅ Successfully seeded: ${totalProcessed} frameworks`)
  console.log(`⚠️  Skipped (errors): ${totalSkipped} frameworks`)
  console.log(`⏱️  Total time: ${Math.round(totalDuration / 1000)}s`)
  console.log(`📊 Average: ${avgTimePerFramework}ms per framework`)
  console.log('='.repeat(60) + '\n')

  if (totalSkipped > 0) {
    console.warn('⚠️  Some frameworks were skipped due to errors.')
    console.warn('💡 Check logs above for details.')
    process.exit(1)
  }
}

// ============================================================================
// VERIFICATION FUNCTION
// ============================================================================

async function verifySeeding() {
  console.log('🔍 Verifying seeded data...\n')

  try {
    // Count total frameworks
    const { count: totalCount, error: countError } = await supabase
      .from('writing_frameworks')
      .select('*', { count: 'exact', head: true })
      .is('user_id', null)

    if (countError) throw countError

    console.log(`📊 Total global frameworks in database: ${totalCount}`)

    // Count by category
    const categories = ['seo', 'aeo', 'geo', 'marketing']
    for (const category of categories) {
      const { count, error } = await supabase
        .from('writing_frameworks')
        .select('*', { count: 'exact', head: true })
        .eq('category', category)
        .is('user_id', null)

      if (!error) {
        console.log(`   - ${category.toUpperCase()}: ${count} frameworks`)
      }
    }

    // Sample a few frameworks
    const { data: sampleData, error: sampleError } = await supabase
      .from('writing_frameworks')
      .select('name, category, tags')
      .is('user_id', null)
      .limit(5)

    if (!sampleError && sampleData) {
      console.log('\n📝 Sample frameworks:')
      sampleData.forEach((fw, index) => {
        console.log(`   ${index + 1}. ${fw.name} (${fw.category})`)
        console.log(`      Tags: ${fw.tags.join(', ')}`)
      })
    }

    console.log('\n✅ Verification complete!\n')
  } catch (error) {
    console.error('❌ Verification failed:', error)
  }
}

// ============================================================================
// EXECUTE
// ============================================================================

async function main() {
  try {
    await seedFrameworks()
    await verifySeeding()
  } catch (error) {
    console.error('\n❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { seedFrameworks, verifySeeding }
