/**
 * Seed RAG Documents Script
 * Processes markdown documents and stores them in Supabase with embeddings
 * 
 * Usage: npx tsx scripts/seed-rag-documents.ts
 */

import { createClient } from '@supabase/supabase-js'
import { embed } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in .env.local')
}
if (!openaiApiKey) {
  throw new Error('Missing OPENAI_API_KEY in .env.local')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = createOpenAI({ apiKey: openaiApiKey })

interface DocumentChunk {
  title: string
  content: string
  agent_type: string
  metadata: {
    source_file: string
    chunk_index: number
    section_heading?: string
    total_chunks?: number
  }
}

/**
 * Semantic chunking based on document structure
 * Handles both markdown headings and "Part X:" style section markers
 */
function semanticChunkMarkdown(content: string, sourceFile: string): DocumentChunk[] {
  const chunks: DocumentChunk[] = []
  let chunkIndex = 0

  // First, split by Part markers (Part I:, Part II:, etc.)
  const partPattern = /(?=Part [IVX]+:)/g
  const parts = content.split(partPattern).filter(s => s.trim().length > 100)

  for (const part of parts) {
    // Extract the Part title if it exists
    const partMatch = part.match(/^Part [IVX]+:\s*([^\n]+)/m)
    const partTitle = partMatch ? partMatch[1].trim() : ''

    // Split each part into paragraphs (double newline separated)
    const paragraphs = part.split(/\n\n+/).filter(p => p.trim().length > 50)

    // Group paragraphs into chunks of ~2500 chars each
    let currentChunk = ''
    let currentTitle = partTitle || 'SEO/AEO/GEO Best Practices'

    for (const paragraph of paragraphs) {
      // Detect section headings (lines that don't end with punctuation and are <100 chars)
      const lines = paragraph.split('\n')
      const firstLine = lines[0]?.trim() || ''
      const isHeading = firstLine.length < 100 &&
                        !firstLine.endsWith('.') &&
                        !firstLine.endsWith(',') &&
                        !firstLine.startsWith('•') &&
                        !firstLine.startsWith('-')

      if (isHeading && firstLine.length > 10) {
        // If we have accumulated content, save it
        if (currentChunk.length > 200) {
          chunks.push({
            title: currentTitle.slice(0, 200),
            content: currentChunk.trim(),
            agent_type: 'content_writer',
            metadata: {
              source_file: sourceFile,
              chunk_index: chunkIndex++,
              section_heading: partTitle,
            }
          })
        }
        currentTitle = firstLine.replace(/^#+\s*/, '').slice(0, 200)
        currentChunk = paragraph
      } else {
        // Check if adding this paragraph exceeds our chunk size
        if (currentChunk.length + paragraph.length > 2500 && currentChunk.length > 200) {
          chunks.push({
            title: currentTitle.slice(0, 200),
            content: currentChunk.trim(),
            agent_type: 'content_writer',
            metadata: {
              source_file: sourceFile,
              chunk_index: chunkIndex++,
              section_heading: partTitle,
            }
          })
          currentChunk = paragraph
        } else {
          currentChunk += '\n\n' + paragraph
        }
      }
    }

    // Don't forget the last chunk
    if (currentChunk.length > 200) {
      chunks.push({
        title: currentTitle.slice(0, 200),
        content: currentChunk.trim(),
        agent_type: 'content_writer',
        metadata: {
          source_file: sourceFile,
          chunk_index: chunkIndex++,
          section_heading: partTitle,
        }
      })
    }
  }

  // Add total_chunks to all chunks
  chunks.forEach(chunk => {
    chunk.metadata.total_chunks = chunks.length
  })

  console.log(`Chunks created with titles:`)
  chunks.forEach((c, i) => console.log(`  ${i + 1}. ${c.title} (${c.content.length} chars)`))

  return chunks
}

/**
 * Generate embedding for text using OpenAI text-embedding-3-small (1536 dimensions)
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.textEmbeddingModel('text-embedding-3-small'),
    value: text,
  })
  return embedding
}

/**
 * Store a chunk with its embedding in Supabase
 */
async function storeChunk(chunk: DocumentChunk): Promise<boolean> {
  try {
    // Generate embedding for the chunk content
    const embedding = await generateEmbedding(chunk.content)
    
    // Insert into agent_documents
    // Ensure metadata is JSON-serializable, fallback to empty object if missing
    const metadata = chunk.metadata && typeof chunk.metadata === 'object' 
      ? chunk.metadata 
      : {}
    
    const { error } = await supabase
      .from('agent_documents')
      .insert({
        title: chunk.title,
        content: chunk.content,
        agent_type: chunk.agent_type,
        embedding: embedding,
        metadata: metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    
    if (error) {
      console.error(`Failed to store chunk "${chunk.title}":`, error.message)
      return false
    }
    
    console.log(`✓ Stored: ${chunk.title} (${chunk.content.length} chars)`)
    return true
  } catch (error) {
    console.error(`Error processing chunk "${chunk.title}":`, error)
    return false
  }
}

async function main() {
  console.log('=== SEO RAG Document Seeder ===\n')

  const documentPath = path.join(process.cwd(), 'documents/frameworks/seo-comprehensive-guide.md')

  // Check if file exists
  if (!fs.existsSync(documentPath)) {
    console.error(`Document not found: ${documentPath}`)
    process.exit(1)
  }

  console.log(`Reading: ${documentPath}\n`)
  const content = fs.readFileSync(documentPath, 'utf-8')

  // Check for existing documents from this source and remove them
  const sourceFile = 'seo-comprehensive-guide.md'
  console.log(`Removing existing chunks from: ${sourceFile}`)

  // Use metadata->>'source_file' for exact source matching instead of fragile title matching
  const { error: deleteError } = await supabase
    .from('agent_documents')
    .delete()
    .eq('metadata->>source_file', sourceFile)
    .eq('agent_type', 'content_writer')

  if (deleteError) {
    console.warn('Warning: Could not clean up existing documents:', deleteError.message)
  }

  // Chunk the document semantically
  console.log('\nChunking document by sections...')
  const chunks = semanticChunkMarkdown(content, sourceFile)
  console.log(`Created ${chunks.length} chunks\n`)

  // Store each chunk with embeddings
  let successCount = 0
  let failCount = 0

  for (const chunk of chunks) {
    const success = await storeChunk(chunk)
    if (success) {
      successCount++
    } else {
      failCount++
    }
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log('\n=== Summary ===')
  console.log(`Total chunks: ${chunks.length}`)
  console.log(`Successfully stored: ${successCount}`)
  console.log(`Failed: ${failCount}`)

  // Verify storage
  const { data: verifyData, error: verifyError } = await supabase
    .from('agent_documents')
    .select('id, title, agent_type')
    .eq('agent_type', 'content_writer')
    .order('created_at', { ascending: false })
    .limit(10)

  if (verifyError) {
    console.error('\nVerification failed:', verifyError.message)
  } else {
    console.log(`\nLatest documents in database:`)
    verifyData?.forEach(doc => {
      console.log(`  - ${doc.title}`)
    })
  }
}

main().catch(console.error)

