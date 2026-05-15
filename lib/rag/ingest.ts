import { generateEmbedding } from '@/lib/ai/embeddings'
import { insertAgentDocumentWithEmbedding } from '@/lib/db/vector-search'
import type { ChatMode } from '@/lib/chat/modes'

export interface IngestRagDocumentInput {
  mode: ChatMode
  sourceType: string
  title: string
  url?: string
  engine?: string
  query?: string
  topic?: string
  brand?: string
  competitor?: string
  rawText?: string
  rawMarkdown?: string
  rawJson?: unknown
  metadata?: Record<string, unknown>
}

export interface IngestRagDocumentResult {
  documentIds: string[]
  chunkCount: number
}

const CHUNK_SIZE = 2600
const CHUNK_OVERLAP = 300

function chunkText(input: string): string[] {
  const text = input.replace(/\r\n/g, '\n').trim()
  if (!text) return []

  const paragraphs = text.split(/\n{2,}/).map(part => part.trim()).filter(Boolean)
  const chunks: string[] = []
  let current = ''

  for (const paragraph of paragraphs) {
    if (current.length + paragraph.length + 2 <= CHUNK_SIZE) {
      current = current ? `${current}\n\n${paragraph}` : paragraph
      continue
    }

    if (current) chunks.push(current)

    if (paragraph.length <= CHUNK_SIZE) {
      current = paragraph
      continue
    }

    for (let start = 0; start < paragraph.length; start += CHUNK_SIZE - CHUNK_OVERLAP) {
      chunks.push(paragraph.slice(start, start + CHUNK_SIZE).trim())
    }
    current = ''
  }

  if (current) chunks.push(current)
  return chunks.filter(chunk => chunk.length > 50)
}

export async function ingestRagDocument(input: IngestRagDocumentInput): Promise<IngestRagDocumentResult> {
  const sourceText = input.rawMarkdown || input.rawText
  if (!sourceText?.trim()) {
    return { documentIds: [], chunkCount: 0 }
  }

  const chunks = chunkText(sourceText)
  const documentIds: string[] = []

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index]
    if (!chunk) continue

    const embedding = await generateEmbedding(chunk)
    const row = await insertAgentDocumentWithEmbedding({
      agentType: input.mode === 'content' ? 'content' : 'seo_aeo',
      mode: input.mode,
      title: chunks.length > 1 ? `${input.title} (${index + 1}/${chunks.length})` : input.title,
      content: chunk,
      sourceType: input.sourceType,
      url: input.url,
      engine: input.engine,
      query: input.query,
      topic: input.topic,
      brand: input.brand,
      competitor: input.competitor,
      capturedAt: new Date(),
      metadata: {
        ...(input.metadata || {}),
        chunkIndex: index,
        totalChunks: chunks.length,
        rawJson: input.rawJson,
      },
      embedding,
    }) as { id?: string }

    if (row.id) documentIds.push(row.id)
  }

  return { documentIds, chunkCount: documentIds.length }
}
