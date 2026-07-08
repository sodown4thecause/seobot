import { createHash } from 'node:crypto'
import { and, eq, sql } from 'drizzle-orm'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { db } from '@/lib/db'
import { agentDocuments } from '@/lib/db/schema'
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
  userId?: string
  rawText?: string
  rawMarkdown?: string
  rawJson?: unknown
  metadata?: Record<string, unknown>
  chunking?: IngestChunkingOptions
}

export interface IngestRagDocumentResult {
  documentIds: string[]
  chunkCount: number
  skipped?: boolean
}

export interface IngestChunkingOptions {
  strategy?: 'paragraph' | 'markdown-section'
  maxChars?: number
  overlapChars?: number
  minChars?: number
}

const CHUNK_SIZE = 2600
const CHUNK_OVERLAP = 300
const MIN_CHUNK_SIZE = 50

export function computeContentHash(url: string, title: string, content: string): string {
  const fingerprint = `${url}|${title}|${content.slice(0, 500)}`
  return createHash('sha256').update(fingerprint).digest('hex')
}

export async function isDuplicateContent(
  userId: string | undefined,
  contentHash: string,
  mode: ChatMode
): Promise<boolean> {
  try {
    const conditions = [
      eq(agentDocuments.mode, mode),
      sql`${agentDocuments.metadata}->>'contentHash' = ${contentHash}`,
    ]
    if (userId) {
      conditions.push(sql`${agentDocuments.metadata}->>'userId' = ${userId}`)
    }
    const rows = await db
      .select({ id: agentDocuments.id })
      .from(agentDocuments)
      .where(and(...conditions))
      .limit(1)
    return rows.length > 0
  } catch {
    return false
  }
}

function splitOversizedText(
  text: string,
  maxChars: number,
  overlapChars: number,
  minChars: number
): string[] {
  const chunks: string[] = []
  const paragraphs = text.split(/\n{2,}/).map(part => part.trim()).filter(Boolean)
  let current = ''

  for (const paragraph of paragraphs) {
    if (current.length + paragraph.length + 2 <= maxChars) {
      current = current ? `${current}\n\n${paragraph}` : paragraph
      continue
    }

    if (current) chunks.push(current)

    if (paragraph.length <= maxChars) {
      current = paragraph
      continue
    }

    const step = Math.max(maxChars - overlapChars, Math.floor(maxChars * 0.7))
    for (let start = 0; start < paragraph.length; start += step) {
      chunks.push(paragraph.slice(start, start + maxChars).trim())
    }
    current = ''
  }

  if (current) chunks.push(current)
  return chunks.filter(chunk => chunk.length >= minChars)
}

function chunkMarkdownSections(
  input: string,
  maxChars: number,
  overlapChars: number,
  minChars: number
): string[] {
  const lines = input.replace(/\r\n/g, '\n').trim().split('\n')
  const sections: string[] = []
  let current: string[] = []

  for (const line of lines) {
    const startsSection = /^#{1,4}\s+\S/.test(line)
    if (startsSection && current.length > 0) {
      sections.push(current.join('\n').trim())
      current = [line]
      continue
    }
    current.push(line)
  }

  if (current.length > 0) sections.push(current.join('\n').trim())

  const chunks: string[] = []
  let pending = ''

  for (const section of sections.filter(Boolean)) {
    if (section.length > maxChars) {
      if (pending) {
        chunks.push(pending)
        pending = ''
      }
      chunks.push(...splitOversizedText(section, maxChars, overlapChars, minChars))
      continue
    }

    if (pending.length + section.length + 2 <= maxChars) {
      pending = pending ? `${pending}\n\n${section}` : section
      continue
    }

    if (pending) chunks.push(pending)
    pending = section
  }

  if (pending) chunks.push(pending)
  return chunks.filter(chunk => chunk.length >= minChars)
}

function chunkText(input: string, options: IngestChunkingOptions = {}): string[] {
  const text = input.replace(/\r\n/g, '\n').trim()
  if (!text) return []

  const maxChars = options.maxChars ?? CHUNK_SIZE
  const overlapChars = Math.min(options.overlapChars ?? CHUNK_OVERLAP, Math.floor(maxChars / 2))
  const minChars = options.minChars ?? MIN_CHUNK_SIZE

  if (options.strategy === 'markdown-section') {
    return chunkMarkdownSections(text, maxChars, overlapChars, minChars)
  }

  return splitOversizedText(text, maxChars, overlapChars, minChars)
}

export async function ingestRagDocument(input: IngestRagDocumentInput): Promise<IngestRagDocumentResult> {
  const sourceText = input.rawMarkdown || input.rawText
  if (!sourceText?.trim()) {
    return { documentIds: [], chunkCount: 0 }
  }

  const contentHash = computeContentHash(input.url ?? '', input.title, sourceText)
  if (await isDuplicateContent(input.userId, contentHash, input.mode)) {
    return { documentIds: [], chunkCount: 0, skipped: true }
  }

  const chunks = chunkText(sourceText, input.chunking)
  const documentIds: string[] = []

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index]
    if (!chunk) continue

    const embedding = await generateEmbedding(chunk)
    const metadata = {
      ...(input.metadata || {}),
      ...(input.userId ? { userId: input.userId } : {}),
      contentHash,
      chunkIndex: index,
      totalChunks: chunks.length,
      rawJson: input.rawJson,
    }
    const row = await insertAgentDocumentWithEmbedding({
      agentType: input.mode === 'content'
        ? 'content'
        : input.mode === 'social'
          ? 'social'
          : 'seo_aeo',
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
      metadata,
      embedding,
    }) as { id?: string }

    if (row.id) documentIds.push(row.id)
  }

  return { documentIds, chunkCount: documentIds.length }
}
