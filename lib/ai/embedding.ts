import { embed, embedMany } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import pLimit from 'p-limit'
import pRetry from 'p-retry'
import {
  cacheGet,
  cacheSet,
  CACHE_PREFIXES,
  CACHE_TTL,
} from '../redis/client'

/**
 * OpenAI embedding model for consistent 1536-dimensional vectors
 * text-embedding-3-small offers best cost/performance ratio
 */
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const embeddingModel = openai.embedding('text-embedding-3-small')

/**
 * Configuration for embedding generation
 */
const EMBEDDING_CONFIG = {
  maxRetries: 3,
  concurrencyLimit: 8,
  requestTimeout: 30000, // 30 seconds
  chunkMaxTokens: 800, // Conservative estimate for chunking
} as const

/**
 * Generate a hash for text to use as cache key
 */
async function getTextHash(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text.trim().toLowerCase())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Retry wrapper with exponential backoff for rate limits and transient errors
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  operation: string
): Promise<T> {
  return pRetry(fn, {
    retries: EMBEDDING_CONFIG.maxRetries,
    onFailedAttempt: (error: any) => {
      console.warn(
        `[Embedding] ${operation} attempt ${error.attemptNumber} failed:`,
        error.message || String(error)
      )
    },
    minTimeout: 1000,
    maxTimeout: 10000,
    factor: 2,
  })
}

/**
 * Generate a single embedding from text
 * @param text - Input text to embed (will be truncated if too long)
 * @returns 1536-dimensional embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const startTime = Date.now()

  try {
    const sanitizedText = text.trim().slice(0, 8000) // OpenAI max ~8k tokens

    // Check Redis cache first (embeddings rarely change, cache for 30 days)
    const textHash = await getTextHash(sanitizedText)
    const cacheKey = `${CACHE_PREFIXES.EMBEDDING}${textHash}`
    const cached = await cacheGet<number[]>(cacheKey)

    if (cached) {
      const duration = Date.now() - startTime
      console.log(
        `[Embedding] Cache hit for text (${sanitizedText.length} chars) in ${duration}ms`
      )
      return cached
    }

    // Generate embedding if not cached
    const result = await withRetry(
      async () =>
        embed({
          model: embeddingModel,
          value: sanitizedText,
        }),
      'generateEmbedding'
    )

    // Cache the result for 30 days (embeddings don't change)
    await cacheSet(cacheKey, result.embedding, CACHE_TTL.EMBEDDING)

    const duration = Date.now() - startTime
    console.log(
      `[Embedding] Generated embedding for text (${sanitizedText.length} chars) in ${duration}ms`
    )

    return result.embedding
  } catch (error) {
    console.error('[Embedding] Failed to generate embedding:', error)
    throw new Error('Failed to generate embedding')
  }
}

/**
 * Generate multiple embeddings efficiently with concurrency control
 * @param texts - Array of texts to embed
 * @returns Array of 1536-dimensional embedding vectors
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const startTime = Date.now()

  try {
    const sanitizedTexts = texts.map((text) => text.trim().slice(0, 8000))

    // Use p-limit to control concurrency and avoid rate limits
    const limit = pLimit(EMBEDDING_CONFIG.concurrencyLimit)

    const embeddingPromises = sanitizedTexts.map((text, index) =>
      limit(async () => {
        try {
          const result = await withRetry(
            async () =>
              embed({
                model: embeddingModel,
                value: text,
              }),
            `generateEmbeddings[${index}]`
          )
          return result.embedding
        } catch (error) {
          console.error(`[Embedding] Failed to embed text at index ${index}`)
          throw error
        }
      })
    )

    const embeddings = await Promise.all(embeddingPromises)

    const duration = Date.now() - startTime
    console.log(
      `[Embedding] Generated ${embeddings.length} embeddings in ${duration}ms (avg: ${Math.round(duration / embeddings.length)}ms per embedding)`
    )

    return embeddings
  } catch (error) {
    console.error('[Embedding] Failed to generate embeddings:', error)
    throw new Error('Failed to generate embeddings')
  }
}

/**
 * Chunk text into smaller pieces for embedding
 * Uses sentence boundaries for natural splits
 * 
 * @param text - Text to chunk
 * @param maxTokens - Maximum tokens per chunk (default: 800)
 * @returns Array of text chunks
 */
export function chunkText(
  text: string,
  maxTokens: number = EMBEDDING_CONFIG.chunkMaxTokens
): string[] {
  // Approximate tokens: ~3.5 characters per token for English
  const maxChars = maxTokens * 3.5

  // If text is small enough, return as-is
  if (text.length <= maxChars) {
    return [text]
  }

  const chunks: string[] = []
  
  // Split by sentences (periods, question marks, exclamation marks)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  
  let currentChunk = ''

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim()
    
    // If adding this sentence would exceed limit, start new chunk
    if (currentChunk.length + trimmedSentence.length > maxChars) {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
      }
      currentChunk = trimmedSentence
    } else {
      currentChunk += ' ' + trimmedSentence
    }
  }

  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  console.log(
    `[Embedding] Chunked text (${text.length} chars) into ${chunks.length} chunks`
  )

  return chunks
}

/**
 * Utility: Generate embedding for long text by chunking and averaging
 * Useful for very long descriptions that need single embedding
 * 
 * @param text - Long text to embed
 * @returns Single 1536-dimensional embedding (averaged from chunks)
 */
export async function generateChunkedEmbedding(
  text: string
): Promise<number[]> {
  const chunks = chunkText(text)

  // If only one chunk, use regular embedding
  if (chunks.length === 1) {
    return generateEmbedding(chunks[0])
  }

  // Generate embeddings for all chunks
  const chunkEmbeddings = await generateEmbeddings(chunks)

  // Average the embeddings
  const avgEmbedding = new Array(1536).fill(0)
  
  for (const embedding of chunkEmbeddings) {
    for (let i = 0; i < 1536; i++) {
      avgEmbedding[i] += embedding[i] / chunkEmbeddings.length
    }
  }

  console.log(
    `[Embedding] Generated averaged embedding from ${chunks.length} chunks`
  )

  return avgEmbedding
}

/**
 * Export configuration for testing/monitoring
 */
export { EMBEDDING_CONFIG }
