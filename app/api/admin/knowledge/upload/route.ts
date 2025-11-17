import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import pdf from 'pdf-parse/lib/pdf-parse'

export const runtime = 'nodejs' // Need Node.js runtime for file processing

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Helper to extract text from different file types
async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  
  if (file.type === 'application/pdf') {
    const data = await pdf(buffer)
    return data.text
  } else if (file.type === 'text/markdown' || file.type === 'text/plain') {
    return buffer.toString('utf-8')
  } else if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
    return buffer.toString('utf-8')
  } else if (file.name.endsWith('.txt')) {
    return buffer.toString('utf-8')
  }
  
  // Default: try to read as text
  return buffer.toString('utf-8')
}

// Helper to get file type
function getFileType(file: File): string {
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) return 'pdf'
  if (file.type === 'text/markdown' || file.name.endsWith('.md') || file.name.endsWith('.markdown')) return 'markdown'
  if (file.name.endsWith('.docx')) return 'docx'
  return 'txt'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const tableName = formData.get('tableName') as string

    if (!file || !title || !tableName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate table name (security check)
    const validTables = [
      'seo_aeo_knowledge',
      'content_strategist_knowledge',
      'keyword_researcher_knowledge',
      'competitor_analyst_knowledge',
    ]
    if (!validTables.includes(tableName)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 })
    }

    // Extract text from file
    console.log('[Admin] Extracting text from file:', file.name)
    const content = await extractText(file)
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from file' },
        { status: 400 }
      )
    }

    // Generate embedding using OpenAI
    console.log('[Admin] Generating embedding...')
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: content.substring(0, 8000), // Limit to 8000 chars for embedding
    })

    const embedding = embeddingResponse.data[0].embedding

    // Store in Supabase
    console.log('[Admin] Storing in database:', tableName)
    const { data, error } = await supabase
      .from(tableName)
      .insert({
        user_id: user.id,
        title,
        content,
        file_type: getFileType(file),
        embedding,
        metadata: {
          original_filename: file.name,
          file_size: file.size,
          uploaded_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (error) {
      console.error('[Admin] Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[Admin] Document uploaded successfully:', data.id)

    return NextResponse.json({
      success: true,
      document: data,
    })
  } catch (error) {
    console.error('[Admin] Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

