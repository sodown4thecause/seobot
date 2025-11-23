/**
 * Generate embeddings for all agent_documents that don't have them yet
 * Run this script to populate embeddings for the SEO research documents
 */

import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/embeddings'

async function generateAllEmbeddings() {
  console.log('[Embedding Generator] Starting...')
  
  const supabase = await createClient()
  
  // Get all documents without embeddings
  const { data: documents, error } = await supabase
    .from('agent_documents')
    .select('id, title, content')
    .is('embedding', null)
  
  if (error) {
    console.error('[Embedding Generator] Error fetching documents:', error)
    return
  }
  
  if (!documents || documents.length === 0) {
    console.log('[Embedding Generator] No documents need embeddings')
    return
  }
  
  console.log(`[Embedding Generator] Found ${documents.length} documents without embeddings`)
  
  let successCount = 0
  let failCount = 0
  
  for (const doc of documents) {
    try {
      console.log(`[Embedding Generator] Processing: ${doc.title.substring(0, 50)}...`)
      
      // Generate embedding for the content
      const embedding = await generateEmbedding(doc.content)
      
      // Update the document with the embedding
      const { error: updateError } = await supabase
        .from('agent_documents')
        .update({ embedding })
        .eq('id', doc.id)
      
      if (updateError) {
        console.error(`[Embedding Generator] Failed to update ${doc.title}:`, updateError)
        failCount++
      } else {
        console.log(`[Embedding Generator] ✓ Generated embedding for: ${doc.title}`)
        successCount++
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`[Embedding Generator] Error processing ${doc.title}:`, error)
      failCount++
    }
  }
  
  console.log(`\n[Embedding Generator] Complete!`)
  console.log(`✓ Success: ${successCount}`)
  console.log(`✗ Failed: ${failCount}`)
}

// Run if executed directly
if (require.main === module) {
  generateAllEmbeddings()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

export { generateAllEmbeddings }
