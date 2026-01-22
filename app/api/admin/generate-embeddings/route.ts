import { NextResponse, NextRequest } from 'next/server'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { requireAdminMiddleware } from '@/lib/auth/admin-middleware'
import { db } from '@/lib/db'
import { agentDocuments } from '@/lib/db/schema'
import { isNull, eq, sql } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  // Check admin access
  const adminCheck = await requireAdminMiddleware(req)
  if (adminCheck) {
    return adminCheck
  }

  try {
    console.log('[Embedding Generator] Starting...')
    
    // Get all documents without embeddings
    const documents = await db
      .select({
        id: agentDocuments.id,
        title: agentDocuments.title,
        content: agentDocuments.content,
        agentType: agentDocuments.agentType,
      })
      .from(agentDocuments)
      .where(isNull(agentDocuments.embedding))
    
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
        await db
          .update(agentDocuments)
          .set({ 
            embedding, 
            updatedAt: new Date() 
          })
          .where(eq(agentDocuments.id, doc.id))
        
        console.log(`[Embedding Generator] ✓ Generated embedding for: ${doc.title}`)
        successCount++
        results.push({
          title: doc.title,
          status: 'success'
        })
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
        
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // Get count of documents without embeddings
    const withoutEmbeddings = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(agentDocuments)
      .where(isNull(agentDocuments.embedding))
    
    // Get total count
    const total = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(agentDocuments)
    
    const withoutCount = withoutEmbeddings[0]?.count || 0
    const totalCount = total[0]?.count || 0
    
    return NextResponse.json({
      total: totalCount,
      withoutEmbeddings: withoutCount,
      withEmbeddings: totalCount - withoutCount,
      needsGeneration: withoutCount > 0
    })
    
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
