/**
 * Embeddings - Generate embeddings for vector search
 */

import { embed } from 'ai'
import { vercelGateway } from './gateway-provider'
import type { GatewayModelId } from '@ai-sdk/gateway'

/**
 * Generate embedding for text using OpenAI (3072 dimensions) via Vercel AI Gateway
 * Used for content_chunks table
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      console.warn('[Embeddings] Empty text provided, returning zero vector')
      // Return a zero vector of dimension 3072
      return new Array(3072).fill(0)
    }

    const { embedding } = await embed({
      model: vercelGateway.textEmbeddingModel('openai/text-embedding-3-large' as GatewayModelId),
      value: text,
    })

    return embedding
  } catch (error) {
    console.error('[Embeddings] Error generating embedding:', error)
    throw error
  }
}

/**
 * Generate embedding for text using Gemini (768 dimensions) via Vercel AI Gateway
 * Used for agent_documents table
 */
export async function generateGeminiEmbedding(text: string): Promise<number[]> {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      console.warn('[Embeddings] Empty text provided, returning zero vector')
      // Return a zero vector of dimension 768
      return new Array(768).fill(0)
    }

    const { embedding } = await embed({
      model: vercelGateway.textEmbeddingModel('google/gemini-embedding-001' as GatewayModelId),
      value: text,
    })

    return embedding
  } catch (error) {
    console.error('[Embeddings] Error generating Gemini embedding:', error)
    throw error
  }
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(text => generateEmbedding(text)))
}

/**
 * Generate Gemini embeddings for multiple texts
 */
export async function generateGeminiEmbeddings(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(text => generateGeminiEmbedding(text)))
}









