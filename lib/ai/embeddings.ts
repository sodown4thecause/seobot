/**
 * Embeddings - Generate embeddings for vector search
 * 
 * Uses OpenAI text-embedding-3-small (1536 dimensions) via Vercel AI Gateway
 * Cost: $0.02 per 1M tokens (6.5x cheaper than text-embedding-3-large)
 */

import { embed } from 'ai'
import { vercelGateway } from './gateway-provider'

/**
 * Generate embedding for text using OpenAI (1536 dimensions) via Vercel AI Gateway
 * Using text-embedding-3-small for cost-effectiveness and performance
 * Used for all vector search operations (content_chunks, agent_documents, etc.)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      console.warn('[Embeddings] Empty text provided, returning zero vector')
      // Return a zero vector of dimension 1536
      return new Array(1536).fill(0)
    }

    const { embedding } = await embed({
      model: vercelGateway.textEmbeddingModel('openai/text-embedding-3-small'),
      value: text,
    })

    return embedding
  } catch (error) {
    console.error('[Embeddings] Error generating embedding:', error)
    throw error
  }
}

/**
 * Generate embeddings for multiple texts efficiently
 * Processes all texts in parallel for better performance
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(text => generateEmbedding(text)))
}









