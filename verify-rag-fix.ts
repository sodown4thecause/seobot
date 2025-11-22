/**
 * Verify RAG Fix - Check database state and trigger embedding generation
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyRagFix() {
  console.log('=== RAG System Verification ===\n')
  
  // 1. Check agent_documents table exists and count documents
  console.log('1. Checking agent_documents table...')
  const { count: totalDocs, error: countError } = await supabase
    .from('agent_documents')
    .select('*', { count: 'exact', head: true })
  
  if (countError) {
    console.error('❌ Error querying agent_documents:', countError)
    return
  }
  
  console.log(`✓ Total documents in table: ${totalDocs}`)
  
  // 2. Check content_writer documents
  const { data: writerDocs, error: writerError } = await supabase
    .from('agent_documents')
    .select('id, title, agent_type')
    .eq('agent_type', 'content_writer')
  
  if (writerError) {
    console.error('❌ Error querying content_writer docs:', writerError)
    return
  }
  
  console.log(`✓ Content writer documents: ${writerDocs?.length || 0}`)
  if (writerDocs && writerDocs.length > 0) {
    console.log('\nDocument titles:')
    writerDocs.forEach((doc, i) => {
      console.log(`  ${i + 1}. ${doc.title}`)
    })
  }
  
  // 3. Check embeddings status
  console.log('\n2. Checking embeddings status...')
  const { count: withEmbeddings } = await supabase
    .from('agent_documents')
    .select('*', { count: 'exact', head: true })
    .eq('agent_type', 'content_writer')
    .not('embedding', 'is', null)
  
  const { count: withoutEmbeddings } = await supabase
    .from('agent_documents')
    .select('*', { count: 'exact', head: true })
    .eq('agent_type', 'content_writer')
    .is('embedding', null)
  
  console.log(`✓ Documents with embeddings: ${withEmbeddings}`)
  console.log(`✗ Documents without embeddings: ${withoutEmbeddings}`)
  
  // 4. Test vector search function
  console.log('\n3. Testing vector search function...')
  try {
    // Create a dummy embedding (1536 dimensions of 0.01)
    const dummyEmbedding = new Array(1536).fill(0.01)
    
    const { data: searchResults, error: searchError } = await supabase.rpc(
      'match_agent_documents_v2',
      {
        query_embedding: dummyEmbedding,
        agent_type_param: 'content_writer',
        match_threshold: 0.3,
        max_results: 5,
      }
    )
    
    if (searchError) {
      console.error('❌ Vector search function error:', searchError)
    } else {
      console.log(`✓ Vector search function exists and returned ${searchResults?.length || 0} results`)
      if (searchResults && searchResults.length === 0 && withEmbeddings === 0) {
        console.log('  ℹ️ No results because no embeddings exist yet')
      }
    }
  } catch (error) {
    console.error('❌ Vector search test failed:', error)
  }
  
  // 5. Summary and next steps
  console.log('\n=== Summary ===')
  if ((writerDocs?.length || 0) === 0) {
    console.log('❌ CRITICAL: No documents found for content_writer')
    console.log('   Action needed: Run migration to insert documents')
  } else if ((withoutEmbeddings || 0) > 0) {
    console.log('⚠️  Documents exist but need embeddings')
    console.log('   Action needed: Call POST /api/admin/generate-embeddings')
    console.log(`   Will generate embeddings for ${withoutEmbeddings} documents`)
  } else if ((withEmbeddings || 0) > 0) {
    console.log('✅ RAG system is ready!')
    console.log(`   ${withEmbeddings} documents with embeddings`)
  } else {
    console.log('❓ Unknown state - manual investigation needed')
  }
}

// Run verification
verifyRagFix()
  .then(() => {
    console.log('\nVerification complete.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
