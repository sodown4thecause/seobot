-- Neon PostgreSQL Migration: pgvector RAG System
-- This migration sets up the complete vector search infrastructure for RAG

-- Enable pgvector extension (should already be enabled but safe to run)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- AGENT DOCUMENTS TABLE
-- Stores uploaded research documents, PDFs, and expert knowledge
-- ============================================================================

CREATE TABLE IF NOT EXISTS "agent_documents" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "agent_type" text NOT NULL DEFAULT 'general',
    "title" text NOT NULL,
    "content" text NOT NULL,
    "embedding" vector(1536),
    "source_type" text DEFAULT 'pdf',
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- CONTENT LEARNINGS TABLE
-- Stores cross-user learning patterns from content generation
-- ============================================================================

CREATE TABLE IF NOT EXISTS "content_learnings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text,
    "content_type" text NOT NULL,
    "topic" text NOT NULL,
    "keywords" text[],
    "ai_detection_score" real,
    "human_probability" real,
    "successful" boolean DEFAULT false,
    "techniques_used" text[],
    "feedback" text,
    "content_sample" text,
    "embedding" vector(1536),
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- HNSW INDEXES FOR VECTOR SEARCH
-- HNSW (Hierarchical Navigable Small World) provides fast approximate nearest neighbor search
-- ============================================================================

-- Writing Frameworks vector index
CREATE INDEX IF NOT EXISTS "writing_frameworks_embedding_hnsw_idx" 
ON "writing_frameworks" 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Brand Voices vector index
CREATE INDEX IF NOT EXISTS "brand_voices_embedding_hnsw_idx" 
ON "brand_voices" 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Agent Documents vector index
CREATE INDEX IF NOT EXISTS "agent_documents_embedding_hnsw_idx" 
ON "agent_documents" 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Content Learnings vector index  
CREATE INDEX IF NOT EXISTS "content_learnings_embedding_hnsw_idx" 
ON "content_learnings" 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- REGULAR INDEXES FOR FILTERING
-- ============================================================================

-- Agent documents filtering
CREATE INDEX IF NOT EXISTS "agent_documents_agent_type_idx" ON "agent_documents"("agent_type");
CREATE INDEX IF NOT EXISTS "agent_documents_created_at_idx" ON "agent_documents"("created_at" DESC);

-- Content learnings filtering
CREATE INDEX IF NOT EXISTS "content_learnings_content_type_idx" ON "content_learnings"("content_type");
CREATE INDEX IF NOT EXISTS "content_learnings_successful_idx" ON "content_learnings"("successful");
CREATE INDEX IF NOT EXISTS "content_learnings_ai_score_idx" ON "content_learnings"("ai_detection_score");
CREATE INDEX IF NOT EXISTS "content_learnings_user_id_idx" ON "content_learnings"("user_id");

-- ============================================================================
-- HELPER FUNCTIONS FOR VECTOR SEARCH
-- These can be called directly from Drizzle using db.execute(sql`...`)
-- ============================================================================

-- Match frameworks by embedding similarity
CREATE OR REPLACE FUNCTION match_frameworks(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.3,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    structure jsonb,
    examples text,
    category text,
    metadata jsonb,
    usage_count integer,
    similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        wf.id,
        wf.name,
        wf.description,
        wf.structure,
        wf.examples,
        wf.category,
        wf.metadata,
        wf.usage_count,
        1 - (wf.embedding <=> query_embedding) AS similarity
    FROM writing_frameworks wf
    WHERE wf.embedding IS NOT NULL
      AND 1 - (wf.embedding <=> query_embedding) > match_threshold
    ORDER BY wf.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Match agent documents by embedding similarity
CREATE OR REPLACE FUNCTION match_agent_documents(
    query_embedding vector(1536),
    agent_type_param text DEFAULT 'general',
    match_threshold float DEFAULT 0.3,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id uuid,
    agent_type text,
    title text,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ad.id,
        ad.agent_type,
        ad.title,
        ad.content,
        ad.metadata,
        1 - (ad.embedding <=> query_embedding) AS similarity
    FROM agent_documents ad
    WHERE ad.agent_type = agent_type_param
      AND ad.embedding IS NOT NULL
      AND 1 - (ad.embedding <=> query_embedding) > match_threshold
    ORDER BY ad.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Match content learnings by embedding similarity
CREATE OR REPLACE FUNCTION match_content_learnings(
    query_embedding vector(1536),
    content_type_param text DEFAULT NULL,
    match_threshold float DEFAULT 0.3,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id uuid,
    user_id text,
    content_type text,
    topic text,
    ai_detection_score real,
    techniques_used text[],
    similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cl.id,
        cl.user_id,
        cl.content_type,
        cl.topic,
        cl.ai_detection_score,
        cl.techniques_used,
        1 - (cl.embedding <=> query_embedding) AS similarity
    FROM content_learnings cl
    WHERE cl.embedding IS NOT NULL
      AND 1 - (cl.embedding <=> query_embedding) > match_threshold
      AND (content_type_param IS NULL OR cl.content_type = content_type_param)
    ORDER BY cl.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ============================================================================
-- UTILITY: Get cross-user insights for content type
-- ============================================================================

CREATE OR REPLACE FUNCTION get_cross_user_insights(content_type_param text)
RETURNS TABLE (
    unique_users bigint,
    total_learnings bigint,
    successful_learnings bigint,
    avg_ai_score numeric,
    top_techniques jsonb
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH technique_stats AS (
        SELECT 
            unnest(cl.techniques_used) as technique,
            COUNT(*) as usage_count,
            AVG(cl.ai_detection_score) as avg_score
        FROM content_learnings cl
        WHERE cl.content_type = content_type_param
          AND cl.successful = true
          AND cl.techniques_used IS NOT NULL
        GROUP BY unnest(cl.techniques_used)
        ORDER BY usage_count DESC, avg_score ASC
        LIMIT 10
    )
    SELECT
        COUNT(DISTINCT cl.user_id)::bigint as unique_users,
        COUNT(*)::bigint as total_learnings,
        COUNT(*) FILTER (WHERE cl.successful = true)::bigint as successful_learnings,
        ROUND(AVG(cl.ai_detection_score)::numeric, 2) as avg_ai_score,
        COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'technique', ts.technique,
                'usage', ts.usage_count,
                'avgScore', ROUND(ts.avg_score::numeric, 1)
            ))
            FROM technique_stats ts),
            '[]'::jsonb
        ) as top_techniques
    FROM content_learnings cl
    WHERE cl.content_type = content_type_param;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE agent_documents IS 'Stores uploaded research documents and expert knowledge for RAG';
COMMENT ON TABLE content_learnings IS 'Cross-user learning patterns from content generation for continuous improvement';
COMMENT ON FUNCTION match_frameworks IS 'Vector similarity search for writing frameworks';
COMMENT ON FUNCTION match_agent_documents IS 'Vector similarity search for agent documents';
COMMENT ON FUNCTION match_content_learnings IS 'Vector similarity search for content learnings';
