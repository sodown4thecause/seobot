/**
 * ⚠️ DEPRECATED - This script uses Supabase which is being migrated to Drizzle ORM
 * 
 * Script to apply Supabase migration and check advisors
 * Run with: npx tsx scripts/apply-migration.ts
 * 
 * TODO: Migrate to Drizzle ORM or remove if no longer needed
 */

// @ts-nocheck - Ignoring errors during Supabase → Drizzle migration
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { serverEnv, clientEnv } from '../lib/config/env'

async function applyMigration() {
  console.log('🚀 Applying Supabase migration...\n')

  // Create Supabase admin client
  const supabase = createClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL as string,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY as string
  )

  // Read migration file
  const migrationPath = join(
    process.cwd(),
    'supabase/migrations/20250106000000_supabase_advisor_fixes.sql'
  )
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  console.log(`📄 Reading migration from: ${migrationPath}`)
  console.log(`📏 Migration size: ${migrationSQL.length} characters\n`)

  // Split migration into statements (basic splitting by semicolon)
  // Note: This is a simplified approach. For production, use a proper SQL parser
  const statements = migrationSQL
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'))

  console.log(`📊 Found ${statements.length} SQL statements\n`)

  // Execute migration using RPC (if available) or direct SQL
  try {
    // Try using Supabase's rpc to execute SQL
    // Note: Supabase doesn't have a direct SQL execution endpoint via JS client
    // We'll need to use the REST API or Supabase CLI

    console.log('⚠️  Direct SQL execution via JS client is not supported.')
    console.log('📋 Please apply the migration using one of these methods:\n')
    console.log('1. Supabase Dashboard:')
    console.log('   - Go to SQL Editor')
    console.log('   - Copy and paste the migration SQL')
    console.log('   - Run it\n')
    console.log('2. Supabase CLI:')
    console.log('   - Install: npm install -g supabase')
    console.log('   - Run: supabase db push\n')
    console.log('3. Migration file location:')
    console.log(`   ${migrationPath}\n`)

    // However, we can check if the migration was already applied by checking for some of the changes
    console.log('🔍 Checking if migration was already applied...\n')

    // Check if check_is_admin function has the correct search_path
    const { data: functionCheck, error: funcError } = await supabase.rpc('check_is_admin', {
      user_id: '00000000-0000-0000-0000-000000000000' // dummy UUID for check
    })

    if (!funcError) {
      console.log('✅ check_is_admin function exists')
    } else {
      console.log('⚠️  Could not verify function (this is expected if migration not applied)')
    }

    return {
      success: false,
      message: 'Migration needs to be applied manually via Supabase Dashboard or CLI',
      migrationPath
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// Run the script
if (require.main === module) {
  applyMigration()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Migration applied successfully!')
        process.exit(0)
      } else {
        console.log('\n⚠️  Migration needs manual application')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error)
      process.exit(1)
    })
}

export { applyMigration }

