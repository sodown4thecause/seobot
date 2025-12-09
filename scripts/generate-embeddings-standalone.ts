/**
 * Standalone script to generate embeddings for all agent_documents
 * This version uses direct Supabase admin client and AI SDK
 * Run: npx tsx scripts/generate-embeddings-standalone.ts
 */

import { createClient } from '@supabase/supabase-js'
import { embed } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

if (!openaiApiKey) {
  console.error('Missing OpenAI API key (OPENAI_API_KEY or AI_GATEWAY_API_KEY)')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Create OpenAI provider for embeddings
const openai = createOpenAI({
  apiKey: openaiApiKey,
})

async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.textEmbeddingModel('text-embedding-3-small'),
    value: text,
  })
  return embedding
}

async function main() {
  console.log('[Embedding Generator] Starting...')
  console.log('[Embedding Generator] Using Supabase URL:', supabaseUrl)
  
  // Get all documents without embeddings
  const { data: documents, error } = await supabase
    .from('agent_documents')
    .select('id, title, content')
    .is('embedding', null)
  
  if (error) {
    console.error('[Embedding Generator] Error fetching documents:', error)
    throw error
  }
  
  if (!documents || documents.length === 0) {
    console.log('[Embedding Generator] No documents need embeddings')
    
    // Check total count
    const { count, error: countError } = await supabase
      .from('agent_documents')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('[Embedding Generator] Error fetching document count:', countError)
      throw countError
    }
    
    console.log(`[Embedding Generator] Total documents in database: ${count}`)
    return
  }
  
  console.log(`[Embedding Generator] Found ${documents.length} documents without embeddings`)
  
  let successCount = 0
  let failCount = 0
  
  for (const doc of documents) {
    try {
      console.log(`[Embedding Generator] Processing: ${doc.title.substring(0, 60)}...`)
      
      // Generate embedding for the content
      const embedding = await generateEmbedding(doc.content)
      
      console.log(`[Embedding Generator] Generated ${embedding.length}-dimensional embedding`)
      
      // Update the document with the embedding
      const { error: updateError } = await supabase
        .from('agent_documents')
        .update({ embedding })
        .eq('id', doc.id)
      
      if (updateError) {
        console.error(`[Embedding Generator] Failed to update ${doc.title}:`, updateError)
        failCount++
      } else {
        console.log(`[Embedding Generator] ✓ Saved embedding for: ${doc.title}`)
        successCount++
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
      
    } catch (error) {
      console.error(`[Embedding Generator] Error processing ${doc.title}:`, error)
      failCount++
    }
  }
  
  console.log(`\n[Embedding Generator] Complete!`)
  console.log(`✓ Success: ${successCount}`)
  console.log(`✗ Failed: ${failCount}`)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
