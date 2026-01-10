-- Migration: Add vector indexes for pgvector performance optimization
-- Created: 2026-01-09
-- Description: Adds HNSW indexes to all vector columns for efficient similarity search

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add HNSW index for agent_documents.embedding
-- HNSW (Hierarchical Navigable Small World) provides better query performance than IVFFlat
-- m=16: number of connections per layer (higher = better recall, more memory)
-- ef_construction=64: size of dynamic candidate list (higher = better index quality, slower build)
CREATE INDEX IF NOT EXISTS agent_documents_embedding_idx 
ON agent_documents 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Add HNSW index for brand_voices.embedding
CREATE INDEX IF NOT EXISTS brand_voices_embedding_idx 
ON brand_voices 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Add HNSW index for content_learnings.embedding
CREATE INDEX IF NOT EXISTS content_learnings_embedding_idx 
ON content_learnings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Add HNSW index for writing_frameworks.embedding
CREATE INDEX IF NOT EXISTS writing_frameworks_embedding_idx 
ON writing_frameworks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Set maintenance_work_mem for better index build performance (optional, adjust based on available RAM)
-- Uncomment if you have sufficient memory:
-- SET maintenance_work_mem = '1GB';

-- Analyze tables after index creation for query planner optimization
ANALYZE agent_documents;
ANALYZE brand_voices;
ANALYZE content_learnings;
ANALYZE writing_frameworks;
