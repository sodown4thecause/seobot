/**
 * RAG Retrieval Service for Writing Frameworks
 * 
 * Provides semantic search over the writing_frameworks knowledge base using:
 * - Vector similarity search with pgvector
 * - Hybrid re-ranking (semantic + keyword matching)
 * - LRU caching for performance
 * - Edge-compatible implementation (no Node.js APIs)
 */

import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from './embedding'
import { type FrameworkCategory } from './framework-seeds'
import { LRUCache } from 'lru-cache'
import {
  cacheGet,
  cacheSet,
  cacheGetBatch,
  cacheSetBatch,
  CACHE_PREFIXES,
  CACHE_TTL,
} from '../redis/client'

// ============================================================================
// TYPES
// ============================================================================

export interface RetrievalOptions {
  maxResults?: number // Default: 3
  threshold?: number // Default: 0.7 (cosine similarity)
  userId?: string // For filtering custom frameworks
  category?: FrameworkCategory // Filter by category
}

export interface Framework {
  id: string
  name: string
  description: string
  structure: {
    sections: Array<{
      name: string
      description: string
      tips: string[]
      examples?: string[]
    }>
    best_practices: string[]
    use_cases: string[]
    common_mistakes?: string[]
  }
  example: string
  category: FrameworkCategory
  tags: string[]
  similarity?: number // Cosine similarity score
  usage_count?: number
  created_at?: string
}

interface MatchFrameworkResult {
  id: string
  name: string
  structure: unknown
  similarity: number
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  defaultMaxResults: 3,
  defaultThreshold: 0.7,
  fallbackThreshold: 0.6, // If no results, try lower threshold
  cacheSize: 200,
  cacheTTL: 10 * 60 * 1000, // 10 minutes in milliseconds
  retrievalMultiplier: 2.5, // Fetch 2.5x more for re-ranking
} as const

// ============================================================================
// LRU CACHE
// ============================================================================

interface CacheEntry {
  frameworks: Framework[]
  timestamp: number
}

// Edge-compatible cache using lru-cache
const retrievalCache = new LRUCache<string, CacheEntry>({
  max: CONFIG.cacheSize,
  ttl: CONFIG.cacheTTL,
  updateAgeOnGet: true,
  updateAgeOnHas: false,
})

/**
 * Generate cache key from query and options
 */
function getCacheKey(query: string, options: RetrievalOptions = {}): string {
  const normalizedQuery = query.toLowerCase().trim()
  const category = options.category || 'all'
  const maxResults = options.maxResults || CONFIG.defaultMaxResults
  return `${normalizedQuery}:${category}:${maxResults}`
}

// ============================================================================
// SUPABASE CLIENT (CLIENT-SIDE)
// ============================================================================

let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) {
      throw new Error('Supabase environment variables not configured')
    }

    supabaseClient = createClient(url, anonKey)
  }

  return supabaseClient
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if query contains keyword matches for re-ranking
 */
function calculateKeywordBoost(
  framework: Framework,
  query: string
): number {
  const queryLower = query.toLowerCase()
  let boost = 0

  // Exact name match: +0.15
  if (framework.name.toLowerCase() === queryLower) {
    boost += 0.15
  }
  // Partial name match: +0.08
  else if (framework.name.toLowerCase().includes(queryLower)) {
    boost += 0.08
  }

  // Tag matches: +0.05 per matching tag (max +0.15)
  const matchingTags = framework.tags.filter((tag) =>
    queryLower.includes(tag.toLowerCase())
  )
  boost += Math.min(matchingTags.length * 0.05, 0.15)

  // Category match in query: +0.03
  if (queryLower.includes(framework.category.toLowerCase())) {
    boost += 0.03
  }

  return boost
}

/**
 * Calculate usage popularity boost (optional)
 */
function calculatePopularityBoost(framework: Framework): number {
  if (!framework.usage_count || framework.usage_count === 0) {
    return 0
  }

  // Logarithmic boost: diminishing returns for very popular frameworks
  // Max boost: +0.05 at 100+ uses
  return Math.min(Math.log10(framework.usage_count + 1) * 0.02, 0.05)
}

/**
 * Re-rank frameworks using hybrid scoring
 */
function reRankFrameworks(
  frameworks: Framework[],
  query: string,
  category?: FrameworkCategory
): Framework[] {
  const scored = frameworks.map((framework) => {
    let score = framework.similarity || 0

    // Apply keyword boost
    score += calculateKeywordBoost(framework, query)

    // Apply popularity boost
    score += calculatePopularityBoost(framework)

    // Apply category preference boost if specified
    if (category && framework.category === category) {
      score += 0.05
    }

    return { framework, score }
  })

  // Sort by final score descending
  scored.sort((a, b) => b.score - a.score)

  // Update similarity scores with final scores
  return scored.map(({ framework, score }) => ({
    ...framework,
    similarity: score,
  }))
}

// ============================================================================
// MAIN RETRIEVAL FUNCTION
// ============================================================================

/**
 * Find relevant frameworks using semantic search and hybrid re-ranking
 * 
 * @param query - User's natural language query
 * @param options - Retrieval options (maxResults, threshold, category, etc.)
 * @returns Array of relevant frameworks sorted by relevance
 */
export async function findRelevantFrameworks(
  query: string,
  options: RetrievalOptions = {}
): Promise<Framework[]> {
  const startTime = Date.now()

  try {
    // Normalize options
    const {
      maxResults = CONFIG.defaultMaxResults,
      threshold = CONFIG.defaultThreshold,
      category,
      userId,
    } = options

    // Check cache first - try LRU cache (fastest)
    const cacheKey = getCacheKey(query, options)
    const lruCached = retrievalCache.get(cacheKey)

    if (lruCached) {
      const duration = Date.now() - startTime
      console.log(
        `[RAG] LRU cache hit for "${query.slice(0, 50)}..." (${duration}ms)`
      )
      return lruCached.frameworks
    }

    // Try Redis cache (shared across instances)
    const redisKey = `${CACHE_PREFIXES.FRAMEWORK_SEARCH}${cacheKey}`
    const redisCached = await cacheGet<{ frameworks: Framework[]; timestamp: number }>(redisKey)

    if (redisCached) {
      const duration = Date.now() - startTime
      console.log(
        `[RAG] Redis cache hit for "${query.slice(0, 50)}..." (${duration}ms)`
      )
      // Populate LRU cache for next time
      retrievalCache.set(cacheKey, {
        frameworks: redisCached.frameworks,
        timestamp: redisCached.timestamp,
      })
      return redisCached.frameworks
    }

    console.log(`[RAG] Cache miss, performing retrieval for "${query.slice(0, 50)}..."`)

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query)

    // Calculate retrieval count (fetch more for re-ranking)
    const retrievalCount = Math.ceil(maxResults * CONFIG.retrievalMultiplier)

    // Call Supabase RPC function for vector similarity search
    const supabase = getSupabaseClient()
    const rpcResult = await (supabase.rpc as any)('match_frameworks', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: retrievalCount,
    })
    const { data, error } = rpcResult as { data: MatchFrameworkResult[] | null; error: any }

    if (error) {
      console.error('[RAG] Supabase RPC error:', error)
      
      // Try with lower threshold as fallback
      if (threshold > CONFIG.fallbackThreshold) {
        console.log('[RAG] Retrying with lower threshold...')
        return findRelevantFrameworks(query, {
          ...options,
          threshold: CONFIG.fallbackThreshold,
        })
      }
      
      return []
    }

    if (!data || data.length === 0) {
      const duration = Date.now() - startTime
      console.log(`[RAG] No results found (${duration}ms)`)
      
      // Try with lower threshold
      if (threshold > CONFIG.fallbackThreshold) {
        console.log('[RAG] Retrying with lower threshold...')
        return findRelevantFrameworks(query, {
          ...options,
          threshold: CONFIG.fallbackThreshold,
        })
      }
      
      return []
    }

    // Fetch full framework details
    const frameworkIds = data.map((r) => r.id)
    const { data: fullFrameworks, error: fetchError } = await supabase
      .from('writing_frameworks')
      .select('*')
      .in('id', frameworkIds)

    if (fetchError || !fullFrameworks) {
      console.error('[RAG] Error fetching full frameworks:', fetchError)
      return []
    }

    // Merge similarity scores with full data
    const frameworksWithScores: Framework[] = fullFrameworks.map((fw: any) => {
      const match = data.find((m) => m.id === fw.id)
      return {
        ...fw,
        similarity: match?.similarity || 0,
      } as Framework
    })

    // Apply category filter if specified
    let filteredFrameworks = frameworksWithScores
    if (category) {
      filteredFrameworks = frameworksWithScores.filter(
        (fw) => fw.category === category
      )
    }

    // Apply hybrid re-ranking
    const reRanked = reRankFrameworks(filteredFrameworks, query, category)

    // Take top N results
    const results = reRanked.slice(0, maxResults)
    const cacheEntry = {
      frameworks: results,
      timestamp: Date.now(),
    }

    // Cache results in both LRU (fast) and Redis (shared)
    retrievalCache.set(cacheKey, cacheEntry)

    // Store in Redis with longer TTL (10 minutes)
    await cacheSet(redisKey, cacheEntry, CACHE_TTL.FRAMEWORK_SEARCH)

    const duration = Date.now() - startTime
    console.log(
      `[RAG] Retrieved ${results.length} frameworks in ${duration}ms (avg similarity: ${(results.reduce((sum, f) => sum + (f.similarity || 0), 0) / results.length).toFixed(3)})`
    )

    return results
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[RAG] Retrieval failed after ${duration}ms:`, error)
    return [] // Graceful degradation
  }
}

// ============================================================================
// FORMATTING FOR LLM CONTEXT
// ============================================================================

/**
 * Format frameworks as compact, structured text for LLM context
 * Aims for 250-400 tokens per framework
 * 
 * @param frameworks - Array of frameworks to format
 * @returns Formatted string ready for LLM system prompt
 */
export function formatFrameworksForPrompt(frameworks: Framework[]): string {
  if (frameworks.length === 0) {
    return ''
  }

  const sections: string[] = [
    '**RELEVANT WRITING FRAMEWORKS**',
    'Use these proven frameworks to structure your response:\n',
  ]

  frameworks.forEach((framework, index) => {
    const num = index + 1

    sections.push(`${num}. **${framework.name}** (${framework.category.toUpperCase()})`)
    
    // When to use
    if (framework.structure.use_cases?.length > 0) {
      sections.push(`   When to use: ${framework.structure.use_cases.slice(0, 2).join('; ')}`)
    }

    // Core structure (main sections)
    if (framework.structure.sections?.length > 0) {
      sections.push('   Structure:')
      framework.structure.sections.slice(0, 4).forEach((section) => {
        sections.push(`   - ${section.name}: ${section.description}`)
        if (section.tips?.length > 0) {
          const mainTip = section.tips[0]
          sections.push(`     Tip: ${mainTip}`)
        }
      })
    }

    // Best practices (top 3)
    if (framework.structure.best_practices?.length > 0) {
      sections.push('   Best Practices:')
      framework.structure.best_practices.slice(0, 3).forEach((practice) => {
        sections.push(`   • ${practice}`)
      })
    }

    // Example (truncated)
    if (framework.example) {
      const truncatedExample = framework.example.slice(0, 200)
      sections.push(`   Example: ${truncatedExample}${framework.example.length > 200 ? '...' : ''}`)
    }

    sections.push('') // Empty line between frameworks
  })

  sections.push(
    '\n**Instructions**: Apply the most relevant framework(s) above. Mention which framework you\'re using and why it fits the user\'s needs.\n'
  )

  return sections.join('\n')
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

/**
 * Increment usage count for a framework (fire-and-forget)
 * 
 * @param frameworkId - ID of the framework to track
 */
export async function incrementFrameworkUsage(
  frameworkId: string
): Promise<void> {
  try {
    const supabase = getSupabaseClient()
    
    // Fire-and-forget: don't await
    // Note: Supabase doesn't support raw SQL in update, so we fetch and update
    // @ts-ignore - writing_frameworks table type not fully defined in Supabase types
    supabase
      .from('writing_frameworks')
      .select('usage_count')
      .eq('id', frameworkId)
      .single()
      .then(({ data: current }) => {
        if (current && typeof (current as any).usage_count === 'number') {
          const usageCount = (current as any).usage_count + 1
          // @ts-ignore - writing_frameworks table type not fully defined in Supabase types
          return supabase
            .from('writing_frameworks')
            // @ts-ignore
            .update({ usage_count: usageCount })
            .eq('id', frameworkId)
        }
        return null
      })
      .then((result) => {
        if (result?.error) {
          console.warn(`[RAG] Failed to increment usage for ${frameworkId}:`, result.error)
        }
      })
  } catch (error) {
    // Silently fail - usage tracking is non-critical
    console.warn('[RAG] Usage tracking error:', error)
  }
}

/**
 * Batch increment usage for multiple frameworks
 * 
 * @param frameworkIds - Array of framework IDs
 */
export async function batchIncrementUsage(
  frameworkIds: string[]
): Promise<void> {
  if (frameworkIds.length === 0) return

  try {
    const supabase = getSupabaseClient()
    
    // Update all frameworks in one query
    // Note: Supabase doesn't support raw SQL, so we need to fetch and update individually
    for (const frameworkId of frameworkIds) {
      // @ts-ignore - writing_frameworks table type not fully defined in Supabase types
      supabase
        .from('writing_frameworks')
        .select('usage_count')
        .eq('id', frameworkId)
        .single()
        .then(({ data: current }) => {
          if (current && typeof (current as any).usage_count === 'number') {
            const usageCount = (current as any).usage_count + 1
            // @ts-ignore - writing_frameworks table type not fully defined in Supabase types
            return supabase
              .from('writing_frameworks')
              // @ts-ignore
              .update({ usage_count: usageCount })
              .eq('id', frameworkId)
          }
          return null
        })
        .then((result) => {
          if (result?.error) {
            console.warn(`[RAG] Failed to increment usage for ${frameworkId}:`, result.error)
          }
        })
    }
  } catch (error) {
    console.warn('[RAG] Batch usage tracking error:', error)
  }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Clear the retrieval cache (useful for testing or forced refresh)
 */
export function clearRetrievalCache(): void {
  retrievalCache.clear()
  console.log('[RAG] Cache cleared')
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: retrievalCache.size,
    maxSize: CONFIG.cacheSize,
    ttl: CONFIG.cacheTTL,
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { CONFIG as RAG_CONFIG }
