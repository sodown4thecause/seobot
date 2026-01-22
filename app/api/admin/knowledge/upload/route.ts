import { NextRequest, NextResponse } from 'next/server'
// import { OpenAI } from 'openai'
import { PDFParse } from 'pdf-parse'
// import { serverEnv } from '@/lib/config/env'
import { requireUserId } from '@/lib/auth/clerk'
// import { db } from '@/lib/db'
// import knowledge tables when implemented

export const runtime = 'nodejs' // Need Node.js runtime for file processing

// const openai = new OpenAI({
//   apiKey: serverEnv.OPENAI_API_KEY,
// })

// Helper to extract text from different file types
async function _extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())

  if (file.type === 'application/pdf') {
    // Using pdf-parse v2.4.5 new PDFParse class API
    const pdfParser = new PDFParse({ data: new Uint8Array(buffer) })
    const result = await pdfParser.getText()
    await pdfParser.destroy()
    return result.text
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
function _getFileType(file: File): string {
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) return 'pdf'
  if (file.type === 'text/markdown' || file.name.endsWith('.md') || file.name.endsWith('.markdown')) return 'markdown'
  if (file.name.endsWith('.docx')) return 'docx'
  return 'txt'
}

export async function POST(request: NextRequest) {
  try {
    const _userId = await requireUserId()

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

    // TODO: Implement knowledge tables in schema
    return NextResponse.json({
      success: false,
      message: 'Knowledge upload not yet implemented - tables missing from schema'
    })
    
    // Extract text from file
    // console.log('[Admin] Extracting text from file:', file.name)
    // const content = await extractText(file)
    
    // if (!content || content.trim().length === 0) {
    //   return NextResponse.json(
    //     { error: 'Could not extract text from file' },
    //     { status: 400 }
    //   )
    // }
    
    // // Generate embedding using OpenAI
    // console.log('[Admin] Generating embedding...')
    // const embeddingResponse = await openai.embeddings.create({
    //   model: 'text-embedding-ada-002',
    //   input: content.substring(0, 8000), // Limit to 8000 chars for embedding
    // })
    
    // const embedding = embeddingResponse.data[0].embedding
    
    // // Store in database
    // console.log('[Admin] Storing in database:', tableName)
    // const [data] = await db
    //   .insert(knowledgeTable)
    //   .values({
    //     userId,
    //     title,
    //     content,
    //     fileType: getFileType(file),
    //     embedding,
    //     metadata: {
    //       originalFilename: file.name,
    //       fileSize: file.size,
    //       uploadedAt: new Date().toISOString(),
    //     },
    //   })
    //   .returning()
    
    // console.log('[Admin] Document uploaded successfully:', data.id)
    
    // return NextResponse.json({
    //   success: true,
    //   document: data,
    // })
  } catch (error) {
    console.error('[Admin] Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

