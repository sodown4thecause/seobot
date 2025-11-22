/**
 * Test RAG Retrieval - Verify documents are retrieved for SEO queries
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { OpenAIEmbeddings } from '@langchain/openai'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: openaiKey,
  modelName: 'text-embedding-3-small',
})

async function generateEmbedding(text: string): Promise<number[]> {
  return await embeddings.embedQuery(text)
}

async function testRagRetrieval() {
  console.log('=== Testing RAG Document Retrieval ===\n')
  
  // Test query - typical content generation request
  const testQuery = "write a 200 word blog about SEO best practices and E-E-A-T"
  
  console.log(`Test query: "${testQuery}"\n`)
  
  // 1. Generate embedding for the query
  console.log('1. Generating query embedding...')
  const queryEmbedding = await generateEmbedding(testQuery)
  console.log(`✓ Generated embedding (${queryEmbedding.length} dimensions)\n`)
  
  // 2. Search for relevant documents
  console.log('2. Searching for relevant documents with threshold 0.3...')
  const { data: results, error } = await supabase.rpc('match_agent_documents_v2', {
    query_embedding: queryEmbedding,
    agent_type_param: 'content_writer',
    match_threshold: 0.3,
    max_results: 5,
  })
  
  if (error) {
    console.error('❌ Search error:', error)
    return
  }
  
  if (!results || results.length === 0) {
    console.error('❌ No documents retrieved!')
    console.log('\nTrying with lower threshold (0.1)...')
    
    const { data: retryResults, error: retryError } = await supabase.rpc('match_agent_documents_v2', {
      query_embedding: queryEmbedding,
      agent_type_param: 'content_writer',
      match_threshold: 0.1,
      max_results: 5,
    })
    
    if (retryError || !retryResults || retryResults.length === 0) {
      console.error('❌ Still no results with threshold 0.1')
      return
    }
    
    console.log(`✓ Retrieved ${retryResults.length} documents with threshold 0.1:\n`)
    retryResults.forEach((doc: any, i: number) => {
      console.log(`${i + 1}. ${doc.title}`)
      console.log(`   Similarity: ${(doc.similarity * 100).toFixed(1)}%`)
      console.log(`   Content preview: ${doc.content.substring(0, 150)}...\n`)
    })
  } else {
    console.log(`✓ Retrieved ${results.length} documents:\n`)
    results.forEach((doc: any, i: number) => {
      console.log(`${i + 1}. ${doc.title}`)
      console.log(`   Similarity: ${(doc.similarity * 100).toFixed(1)}%`)
      console.log(`   Content preview: ${doc.content.substring(0, 150)}...\n`)
    })
  }
  
  // 3. Test with specific SEO terms
  console.log('\n3. Testing with specific SEO term: "Entity Salience"...')
  const esrEmbedding = await generateEmbedding("entity salience ratio ESR optimization")
  const { data: esrResults } = await supabase.rpc('match_agent_documents_v2', {
    query_embedding: esrEmbedding,
    agent_type_param: 'content_writer',
    match_threshold: 0.3,
    max_results: 3,
  })
  
  if (esrResults && esrResults.length > 0) {
    console.log(`✓ Found ${esrResults.length} documents about Entity Salience`)
    esrResults.forEach((doc: any) => {
      console.log(`   - ${doc.title} (${(doc.similarity * 100).toFixed(1)}% match)`)
    })
  } else {
    console.log('❌ No Entity Salience documents found')
  }
  
  // 4. Test with AI detection terms
  console.log('\n4. Testing with AI detection term: "avoid delve tapestry"...')
  const aiDetectEmbedding = await generateEmbedding("AI detection banned words delve robust tapestry")
  const { data: aiResults } = await supabase.rpc('match_agent_documents_v2', {
    query_embedding: aiDetectEmbedding,
    agent_type_param: 'content_writer',
    match_threshold: 0.3,
    max_results: 3,
  })
  
  if (aiResults && aiResults.length > 0) {
    console.log(`✓ Found ${aiResults.length} documents about AI detection`)
    aiResults.forEach((doc: any) => {
      console.log(`   - ${doc.title} (${(doc.similarity * 100).toFixed(1)}% match)`)
    })
  } else {
    console.log('❌ No AI detection documents found')
  }
  
  console.log('\n=== Test Summary ===')
  if (results && results.length > 0) {
    console.log('✅ RAG retrieval is working!')
    console.log(`   Documents are being retrieved with similarity threshold 0.3`)
  } else {
    console.log('⚠️  RAG retrieval needs attention')
    console.log('   Threshold may need adjustment or embeddings need regeneration')
  }
}

// Run test
testRagRetrieval()
  .then(() => {
    console.log('\nTest complete.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
