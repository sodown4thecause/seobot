/**
 * Embeddings - Generate embeddings for vector search
 *
 * Uses cohere/embed-v4.0 (1536 dimensions) via Vercel AI Gateway REST API.
 * IMPORTANT: Must match the model used when seeding agent_documents.
 * The @ai-sdk/gateway textEmbeddingModel() routes to /v1/ai (broken for embeddings);
 * we call /v1/embeddings directly instead.
 *
 * Includes LRU cache to reduce API calls for repeated embeddings
 */

import { LRUCache } from 'lru-cache'
import { createLinkedAbortController } from '@/lib/agents/utils/abort-handler'

// Use Vercel AI Gateway OpenAI-compat REST endpoint
// cohere/embed-v4.0 -> 1536 dims, matches vector(1536) columns
const GATEWAY_BASE = (process.env.AI_GATEWAY_BASE_URL ?? 'https://ai-gateway.vercel.sh').replace(/\/v1\/ai$/, '')
const EMBED_URL = `${GATEWAY_BASE}/v1/embeddings`
const EMBED_MODEL = 'cohere/embed-v4.0'

// LRU Cache for embeddings - stores up to 1000 embeddings for 24 hours
const embeddingCache = new LRUCache<string, number[]>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 24, // 24 hours
})

// Cache statistics for monitoring
let cacheHits = 0
let cacheMisses = 0

/**
 * Generate embedding for text using Cohere (1536 dimensions) via Vercel AI Gateway.
 * Uses cohere/embed-v4.0 via the REST /v1/embeddings endpoint.
 * Used for all vector search operations (content_chunks, agent_documents, etc.).
 *
 * Includes caching to reduce API costs and latency.
 */
export async function generateEmbedding(text: string, abortSignal?: AbortSignal): Promise<number[]> {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      console.warn('[Embeddings] Empty text provided, returning zero vector')
      return new Array(1536).fill(0)
    }

    // Normalize text for cache key (trim and lowercase for better hit rate)
    const cacheKey = text.trim().toLowerCase().slice(0, 8000) // Limit key size

    // Check cache first
    const cached = embeddingCache.get(cacheKey)
    if (cached) {
      cacheHits++
      if ((cacheHits + cacheMisses) % 100 === 0) {
        console.log(`[Embeddings] Cache stats: ${cacheHits} hits, ${cacheMisses} misses, ${((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(1)}% hit rate`)
      }
      return cached
    }

    cacheMisses++

    const apiKey = process.env.AI_GATEWAY_API_KEY
    if (!apiKey) throw new Error('AI_GATEWAY_API_KEY not set')

    // 5s timeout - if gateway/Cohere is slow, fail fast so RAG is skipped
    // rather than blocking the entire chat response for 60+ seconds
    const embedTimeout = AbortSignal.timeout(5000)
    const embedAbort = createLinkedAbortController([abortSignal, embedTimeout]).signal
    const resp = await fetch(EMBED_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: EMBED_MODEL, input: text.trim().slice(0, 8000) }),
      signal: embedAbort,
    })
    if (!resp.ok) throw new Error(`Embedding API error ${resp.status}: ${await resp.text()}`)
    const data = await resp.json() as { data: { embedding: number[] }[] }
    if (!data.data?.[0]?.embedding) {
      throw new Error('Embedding API returned no data')
    }
    const embedding = data.data[0].embedding

    // Store in cache
    embeddingCache.set(cacheKey, embedding)

    return embedding
  } catch (error) {
    console.error('[Embeddings] Error generating embedding:', error)
    throw error
  }
}

/**
 * Generate embeddings for multiple texts efficiently
 * Processes all texts in parallel for better performance
 * Uses cache when available
 */
export async function generateEmbeddings(texts: string[], abortSignal?: AbortSignal): Promise<number[][]> {
  return Promise.all(texts.map(text => generateEmbedding(text, abortSignal)))
}

/**
 * Get cache statistics for monitoring
 */
export function getEmbeddingCacheStats(): { hits: number; misses: number; hitRate: number; size: number } {
  const total = cacheHits + cacheMisses
  return {
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: total > 0 ? (cacheHits / total) * 100 : 0,
    size: embeddingCache.size,
  }
}

/**
 * Clear embedding cache (for testing or memory management)
 */
export function clearEmbeddingCache(): void {
  embeddingCache.clear()
  cacheHits = 0
  cacheMisses = 0
  console.log('[Embeddings] Cache cleared')
}

// _review