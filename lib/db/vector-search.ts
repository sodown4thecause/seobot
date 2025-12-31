/**
 * Vector Search Queries for Neon PostgreSQL with pgvector
 * 
 * Provides semantic similarity search using Drizzle ORM
 * Replaces Supabase RPC functions (match_frameworks, match_agent_documents_v2)
 * 
 * Uses cosine distance operator (<=>): lower distance = higher similarity
 * Similarity = 1 - distance
 */

import { db } from './index'
import { 
    writingFrameworks, 
    type WritingFramework,
} from './schema'
import { sql, desc, eq } from 'drizzle-orm'

// ============================================================================
// TYPES
// ============================================================================

export interface VectorSearchOptions {
    threshold?: number      // Minimum similarity score (0-1), default: 0.3
    limit?: number          // Maximum results to return, default: 5
}

export interface FrameworkSearchResult {
    id: string
    name: string
    description: string | null
    structure: unknown
    examples: string | null
    category: string
    metadata: unknown
    similarity: number
    usageCount: number | null
}

export interface AgentDocumentSearchResult {
    id: string
    agentType: string
    title: string
    content: string
    metadata: unknown
    similarity: number
}

export interface ContentLearningSearchResult {
    id: string
    userId: string | null
    contentType: string
    topic: string
    aiDetectionScore: number | null
    techniquesUsed: string[] | null
    similarity: number
}

export interface BrandVoiceSearchResult {
    id: string
    userId: string | null
    tone: string | null
    style: string | null
    personality: string | null
    samplePhrases: string | null
    source: string | null
    similarity: number
}

// Raw row types from database queries
interface FrameworkRawRow {
    id: string
    name: string
    description: string | null
    structure: unknown
    examples: string | null
    category: string
    metadata: unknown
    usage_count: number | null
    similarity: string | number
}

interface BrandVoiceRawRow {
    id: string
    user_id: string | null
    tone: string | null
    style: string | null
    personality: string | null
    sample_phrases: string | null
    source: string | null
    similarity: string | number
}

// ============================================================================
// VECTOR SEARCH FUNCTIONS
// ============================================================================

/**
 * Search writing frameworks by semantic similarity
 * Replaces Supabase RPC: match_frameworks
 * 
 * @param queryEmbedding - 1536-dimensional embedding vector
 * @param options - Search options (threshold, limit)
 * @returns Array of matching frameworks with similarity scores
 */
export async function searchFrameworks(
    queryEmbedding: number[],
    options: VectorSearchOptions = {}
): Promise<FrameworkSearchResult[]> {
    const { threshold = 0.3, limit = 5 } = options

    // Validate embedding input
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
        console.error('[Vector Search] Invalid embedding: must be non-empty array')
        return []
    }
    if (queryEmbedding.some(v => typeof v !== 'number' || !isFinite(v))) {
        console.error('[Vector Search] Invalid embedding: must contain only finite numbers')
        return []
    }

    try {
        // Convert embedding array to pgvector format
        const embeddingStr = `[${queryEmbedding.join(',')}]`

        // Query using cosine distance
        // Similarity = 1 - distance, so we filter where distance < (1 - threshold)
        const results = await db.execute(sql`
            SELECT 
                id,
                name,
                description,
                structure,
                examples,
                category,
                metadata,
                usage_count,
                1 - (embedding <=> ${embeddingStr}::vector) as similarity
            FROM writing_frameworks
            WHERE embedding IS NOT NULL
              AND 1 - (embedding <=> ${embeddingStr}::vector) > ${threshold}
            ORDER BY embedding <=> ${embeddingStr}::vector
            LIMIT ${limit}
        `)

      return (results.rows as unknown[]).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        structure: row.structure as unknown,
        examples: row.examples,
        category: row.category,
        metadata: row.metadata as unknown,
        usageCount: row.usage_count,
        similarity: parseFloat(String(row.similarity)),
      }))
    } catch (error) {
        console.error('[Vector Search] Framework search failed:', error)
        return []
    }
}

/**
 * Search agent documents by semantic similarity
 * Replaces Supabase RPC: match_agent_documents_v2
 * 
 * @param queryEmbedding - 1536-dimensional embedding vector
 * @param agentType - Type of agent to filter by (e.g., 'content_writer')
 * @param options - Search options (threshold, limit)
 * @returns Array of matching documents with similarity scores
 */
export async function searchAgentDocuments(
    queryEmbedding: number[],
    agentType: string = 'general',
    options: VectorSearchOptions = {}
  ): Promise<AgentDocumentSearchResult[]> {
    const { threshold = 0.3, limit = 5 } = options

    try {
      const embeddingStr = `[${queryEmbedding.join(',')}]`

      const results = await db.execute(sql`
        SELECT
                id,
                agent_type,
                title,
                content,
                metadata,
                1 - (embedding <=> ${embeddingStr}::vector) as similarity
            FROM agent_documents
            WHERE agent_type = ${agentType}
            ORDER BY similarity DESC
            LIMIT ${limit}
        `)

      return (results.rows as Record<string, unknown>[]).map(row => ({
        id: row.id as string,
        agentType: row.agent_type as string,
        title: row.title as string,
        content: row.content as string,
        metadata: row.metadata as unknown,
        similarity: parseFloat(String(row.similarity)),
      }))
    } catch (error) {
      console.error('[Vector Search] Framework search failed:', error)
      return []
    }
  }

/**
 * Search content learnings by semantic similarity
 * Used for cross-user learning and pattern retrieval
 * 
 * @param queryEmbedding - 1536-dimensional embedding vector
 * @param contentType - Optional content type filter
 * @param options - Search options (threshold, limit)
 * @returns Array of matching learnings with similarity scores
 */
export async function searchContentLearnings(
    queryEmbedding: number[],
    contentType?: string,
    options: VectorSearchOptions = {}
): Promise<ContentLearningSearchResult[]> {
    const { threshold = 0.3, limit = 5 } = options

    try {
        const embeddingStr = `[${queryEmbedding.join(',')}]`

        // Build query with optional content type filter
        const contentTypeFilter = contentType 
            ? sql`AND content_type = ${contentType}` 
            : sql``

        const results = await db.execute(sql`
            SELECT 
                id,
                user_id,
                content_type,
                topic,
                ai_detection_score,
                techniques_used,
                1 - (embedding <=> ${embeddingStr}::vector) as similarity
            FROM content_learnings
            WHERE embedding IS NOT NULL
              AND 1 - (embedding <=> ${embeddingStr}::vector) > ${threshold}
              ${contentTypeFilter}
            ORDER BY embedding <=> ${embeddingStr}::vector
            LIMIT ${limit}
        `)

        return (results.rows as any[]).map(row => ({
            id: row.id,
            userId: row.user_id,
            contentType: row.content_type,
            topic: row.topic,
            aiDetectionScore: row.ai_detection_score,
            techniquesUsed: row.techniques_used,
            similarity: parseFloat(row.similarity),
        }))
    } catch (error) {
        console.error('[Vector Search] Content learnings search failed:', error)
        return []
    }
}

/**
 * Search brand voices by semantic similarity
 * 
 * Uses stricter defaults (threshold: 0.5, limit: 3) compared to other search
 * functions because brand voice matching requires higher similarity scores
 * and typically needs fewer, more precise results.
 * 
 * @param queryEmbedding - 1536-dimensional embedding vector
 * @param userId - Optional user ID filter
 * @param options - Search options (threshold, limit)
 * @throws Error if embedding is invalid (non-array, empty, or contains non-finite numbers)
 * @returns Array of matching brand voices with similarity scores
 */
export async function searchBrandVoices(
    queryEmbedding: number[],
    userId?: string,
    options: VectorSearchOptions = {}
): Promise<BrandVoiceSearchResult[]> {
    const { threshold = 0.5, limit = 3 } = options

    // Validate embedding input
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
        console.error('[Vector Search] Invalid embedding: must be non-empty array')
        return []
    }
    if (queryEmbedding.some(v => typeof v !== 'number' || !isFinite(v))) {
        console.error('[Vector Search] Invalid embedding: must contain only finite numbers')
        return []
    }

    try {
        const embeddingStr = `[${queryEmbedding.join(',')}]`
        const userFilter = userId ? sql`AND user_id = ${userId}` : sql``

        const results = await db.execute(sql`
            SELECT 
                id,
                user_id,
                tone,
                style,
                personality,
                sample_phrases,
                source,
                1 - (embedding <=> ${embeddingStr}::vector) as similarity
            FROM brand_voices
            WHERE embedding IS NOT NULL
              AND 1 - (embedding <=> ${embeddingStr}::vector) > ${threshold}
              ${userFilter}
            ORDER BY embedding <=> ${embeddingStr}::vector
            LIMIT ${limit}
        `)

        return (results.rows as Record<string, unknown>[]).map(row => ({
            id: row.id as string,
            userId: row.user_id as string | null,
            tone: row.tone as string | null,
            style: row.style as string | null,
            personality: row.personality as string | null,
            samplePhrases: row.sample_phrases as string | null,
            source: row.source as string | null,
            similarity: parseFloat(String(row.similarity)),
        }))
    } catch (error) {
        console.error('[Vector Search] Brand voices search failed:', error)
        return []
    }
}

// ============================================================================
// CRUD OPERATIONS WITH EMBEDDINGS
// ============================================================================

// Default source type for agent documents when not specified
const DEFAULT_SOURCE_TYPE = 'pdf'

/**
 * Validate embedding vector before use
 * @throws Error if embedding is invalid
 */
function validateEmbedding(embedding: unknown): number[] {
    if (!Array.isArray(embedding)) {
        throw new Error('[Vector Search] Embedding must be an array')
    }
    if (embedding.length === 0) {
        throw new Error('[Vector Search] Embedding cannot be empty')
    }
    if (embedding.some(v => typeof v !== 'number' || !isFinite(v))) {
        throw new Error('[Vector Search] Embedding must contain only finite numbers')
    }
    return embedding
}

/**
 * Validate UUID format
 * @throws Error if UUID is invalid
 */
function validateUUID(id: unknown): string {
    if (typeof id !== 'string') {
        throw new Error('[Vector Search] ID must be a string')
    }
    // UUID v4 pattern: 8-4-4-4-12 hex digits
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4?[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidPattern.test(id)) {
        throw new Error(`[Vector Search] Invalid UUID format: ${id}`)
    }
    return id
}

/**
 * Insert a writing framework with embedding
 * 
 * @param data - Framework data with validated embedding array
 * @throws Error if embedding is invalid (non-array, empty, or contains non-finite numbers)
 * @returns Inserted framework row
 */
export async function insertFrameworkWithEmbedding(
    data: {
        name: string
        description?: string
        structure?: unknown
        examples?: string
        category: string
        metadata?: unknown
        embedding: number[]
    }
) {
    // Validate embedding before processing
    const validatedEmbedding = validateEmbedding(data.embedding)
    const embeddingStr = `[${validatedEmbedding.join(',')}]`

    const result = await db.execute(sql`
        INSERT INTO writing_frameworks (name, description, structure, examples, category, metadata, embedding)
        VALUES (
            ${data.name},
            ${data.description || null},
            ${JSON.stringify(data.structure) || null}::jsonb,
            ${data.examples || null},
            ${data.category},
            ${JSON.stringify(data.metadata) || '{}'}::jsonb,
            ${embeddingStr}::vector
        )
        RETURNING *
    `)

    return result.rows[0]
}

/**
 * Insert an agent document with embedding
 * 
 * @param data - Document data with validated embedding array; sourceType defaults to 'pdf'
 * @throws Error if embedding is invalid (non-array, empty, or contains non-finite numbers)
 * @returns Inserted agent document row
 */
export async function insertAgentDocumentWithEmbedding(
    data: {
        agentType: string
        title: string
        content: string
        sourceType?: string
        metadata?: unknown
        embedding: number[]
    }
) {
    // Validate embedding before processing
    const validatedEmbedding = validateEmbedding(data.embedding)
    const embeddingStr = `[${validatedEmbedding.join(',')}]`

    const result = await db.execute(sql`
        INSERT INTO agent_documents (agent_type, title, content, source_type, metadata, embedding)
        VALUES (
            ${data.agentType},
            ${data.title},
            ${data.content},
            ${data.sourceType || DEFAULT_SOURCE_TYPE},
            ${JSON.stringify(data.metadata) || '{}'}::jsonb,
            ${embeddingStr}::vector
        )
        RETURNING *
    `)

    return result.rows[0]
}

/**
 * Update embedding for an existing document
 */
export async function updateDocumentEmbedding(
    table: 'writing_frameworks' | 'agent_documents' | 'content_learnings' | 'brand_voices',
    id: string,
    embedding: number[]
) {
    const embeddingStr = `[${embedding.join(',')}]`

    // Use a whitelist mapping to prevent SQL injection
    const tableMap = {
        'writing_frameworks': 'writing_frameworks',
        'agent_documents': 'agent_documents',
        'content_learnings': 'content_learnings',
        'brand_voices': 'brand_voices'
    } as const

    if (!(table in tableMap)) {
        throw new Error('Invalid table name')
    }

    // Build the SET clause conditionally - only agent_documents has updated_at column
    const setClause = table === 'agent_documents' 
        ? `embedding = ${embeddingStr}::vector, updated_at = NOW()`
        : `embedding = ${embeddingStr}::vector`

    await db.execute(sql`
        UPDATE ${sql.raw(tableMap[table])}
        SET ${sql.raw(setClause)}
        WHERE id = ${id}::uuid
    `)
}

/**
 * Increment framework usage count
 * 
 * @param frameworkId - UUID of the framework to increment
 * @throws Error if frameworkId is not a valid UUID
 */
export async function incrementFrameworkUsage(frameworkId: string) {
    // Validate UUID before executing query
    const validId = validateUUID(frameworkId)
    
    await db.execute(sql`
        UPDATE writing_frameworks
        SET usage_count = COALESCE(usage_count, 0) + 1
        WHERE id = ${validId}::uuid
    `)
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get documents that need embeddings generated
 */
export async function getDocumentsWithoutEmbeddings(
    table: 'writing_frameworks' | 'agent_documents',
    limit: number = 100
): Promise<{ id: string; content: string }[]> {
    const contentColumn = table === 'writing_frameworks' 
        ? sql`CONCAT(name, ' ', COALESCE(description, ''), ' ', COALESCE(examples, ''))`
        : sql`CONCAT(title, ' ', content)`

    const results = await db.execute(sql`
        SELECT id, ${contentColumn} as content
        FROM ${sql.raw(table)}
        WHERE embedding IS NULL
        LIMIT ${limit}
    `)

    return (results.rows as any[]).map(row => ({
        id: row.id,
        content: row.content,
    }))
}

/**
 * Get framework by ID with usage tracking
 */
export async function getFrameworkById(id: string): Promise<WritingFramework | null> {
    const [framework] = await db
        .select()
        .from(writingFrameworks)
        .where(eq(writingFrameworks.id, id))
        .limit(1)

    return framework ?? null
}

/**
 * Get all frameworks (without embeddings for listing)
 */
export async function getAllFrameworks(): Promise<Omit<WritingFramework, 'embedding'>[]> {
    const results = await db
        .select({
            id: writingFrameworks.id,
            name: writingFrameworks.name,
            description: writingFrameworks.description,
            structure: writingFrameworks.structure,
            examples: writingFrameworks.examples,
            category: writingFrameworks.category,
            metadata: writingFrameworks.metadata,
            usageCount: writingFrameworks.usageCount,
            createdAt: writingFrameworks.createdAt,
            updatedAt: writingFrameworks.updatedAt,
        })
        .from(writingFrameworks)
        .orderBy(desc(writingFrameworks.usageCount))

    return results
}
