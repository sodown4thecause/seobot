/**
 * Embeddings - Generate embeddings for vector search
 * 
 * Uses OpenAI text-embedding-3-small (1536 dimensions) via Vercel AI Gateway
 * Cost: $0.02 per 1M tokens (6.5x cheaper than text-embedding-3-large)
 * 
 * Includes LRU cache to reduce API calls for repeated embeddings
 */

import { embed } from 'ai'
import { vercelGateway } from './gateway-provider'
import { LRUCache } from 'lru-cache'

// LRU Cache for embeddings - stores up to 1000 embeddings for 24 hours
const embeddingCache = new LRUCache<string, number[]>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 24, // 24 hours
})

// Cache statistics for monitoring
let cacheHits = 0
let cacheMisses = 0

/**
 * Generate embedding for text using OpenAI (1536 dimensions) via Vercel AI Gateway
 * Using text-embedding-3-small for cost-effectiveness and performance
 * Used for all vector search operations (content_chunks, agent_documents, etc.)
 * 
 * Includes caching to reduce API costs and latency
 */
export async function generateEmbedding(text: string): Promise<number[]> {
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

    const { embedding } = await embed({
      model: vercelGateway.textEmbeddingModel('openai/text-embedding-3-small'),
      value: text,
    })

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
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(text => generateEmbedding(text)))
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









