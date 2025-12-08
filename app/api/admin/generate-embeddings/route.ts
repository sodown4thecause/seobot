import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { requireAdminMiddleware } from '@/lib/auth/admin-middleware'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  // Check admin access
  const adminCheck = await requireAdminMiddleware(req)
  if (adminCheck) {
    return adminCheck
  }

  try {
    console.log('[Embedding Generator] Starting...')
    
    const supabase = await createClient()
    
    // Get all documents without embeddings
    const { data: documents, error } = await supabase
      .from('agent_documents')
      .select('id, title, content, agent_type')
      .is('embedding', null)
    
    if (error) {
      console.error('[Embedding Generator] Error fetching documents:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!documents || documents.length === 0) {
      return NextResponse.json({ 
        message: 'No documents need embeddings',
        count: 0 
      })
    }
    
    console.log(`[Embedding Generator] Found ${documents.length} documents without embeddings`)
    
    const results = []
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
          .update({ embedding, updated_at: new Date().toISOString() })
          .eq('id', doc.id)
        
        if (updateError) {
          console.error(`[Embedding Generator] Failed to update ${doc.title}:`, updateError)
          failCount++
          results.push({
            title: doc.title,
            status: 'failed',
            error: updateError.message
          })
        } else {
          console.log(`[Embedding Generator] ✓ Generated embedding for: ${doc.title}`)
          successCount++
          results.push({
            title: doc.title,
            status: 'success'
          })
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
        
      } catch (error: any) {
        console.error(`[Embedding Generator] Error processing ${doc.title}:`, error)
        failCount++
        results.push({
          title: doc.title,
          status: 'failed',
          error: error.message
        })
      }
    }
    
    console.log(`[Embedding Generator] Complete!`)
    console.log(`✓ Success: ${successCount}`)
    console.log(`✗ Failed: ${failCount}`)
    
    return NextResponse.json({
      message: 'Embedding generation complete',
      total: documents.length,
      success: successCount,
      failed: failCount,
      results
    })
    
  } catch (error: any) {
    console.error('[Embedding Generator] Fatal error:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Check admin access
  const adminCheck = await requireAdminMiddleware(req)
  if (adminCheck) {
    return adminCheck
  }
  try {
    const supabase = await createClient()
    
    // Get count of documents without embeddings
    const { count: withoutEmbeddings } = await supabase
      .from('agent_documents')
      .select('*', { count: 'exact', head: true })
      .is('embedding', null)
    
    // Get total count
    const { count: total } = await supabase
      .from('agent_documents')
      .select('*', { count: 'exact', head: true })
    
    return NextResponse.json({
      total: total || 0,
      withoutEmbeddings: withoutEmbeddings || 0,
      withEmbeddings: (total || 0) - (withoutEmbeddings || 0),
      needsGeneration: (withoutEmbeddings || 0) > 0
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
