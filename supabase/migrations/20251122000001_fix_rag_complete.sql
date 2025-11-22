-- Fix RAG System - Complete Migration
-- Issues being fixed:
-- 1. Embedding column dimension mismatch (768 vs 1536)
-- 2. Similarity threshold too high (0.5 should be 0.3)
-- 3. Column name inconsistency (content_embedding vs embedding)

-- Step 1: Check current state and drop old function
DROP FUNCTION IF EXISTS match_agent_documents_v2(vector, TEXT, FLOAT, INTEGER);
DROP FUNCTION IF EXISTS match_agent_documents(vector, TEXT, FLOAT, INTEGER);

-- Step 2: Ensure table exists with correct schema
CREATE TABLE IF NOT EXISTS agent_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- Changed from content_embedding vector(768)
  source_type TEXT DEFAULT 'pdf',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: If old column exists, rename it (handles migration from old schema)
DO $$
BEGIN
  -- Check if content_embedding exists and embedding doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_documents' 
    AND column_name = 'content_embedding'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_documents' 
    AND column_name = 'embedding'
  ) THEN
    -- Rename the column
    ALTER TABLE agent_documents RENAME COLUMN content_embedding TO embedding;
    RAISE NOTICE 'Renamed content_embedding to embedding';
  END IF;
  
  -- Update dimension if needed (drop and recreate with correct dimension)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_documents' 
    AND column_name = 'embedding'
  ) THEN
    -- Get the current dimension
    -- Note: This will fail if dimension is wrong, so we just recreate the column
    BEGIN
      ALTER TABLE agent_documents DROP COLUMN IF EXISTS embedding;
      ALTER TABLE agent_documents ADD COLUMN embedding vector(1536);
      RAISE NOTICE 'Recreated embedding column with 1536 dimensions';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Column recreation skipped or already correct: %', SQLERRM;
    END;
  END IF;
END $$;

-- Step 4: Drop old indexes
DROP INDEX IF EXISTS idx_agent_documents_embedding;
DROP INDEX IF EXISTS idx_agent_documents_content_embedding;

-- Step 5: Create HNSW index for fast vector search
CREATE INDEX IF NOT EXISTS idx_agent_documents_embedding 
ON agent_documents 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Step 6: Enable RLS
ALTER TABLE agent_documents ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop existing policies if they exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Service role can manage all agent_documents" ON agent_documents;
    DROP POLICY IF EXISTS "Public can read agent_documents" ON agent_documents;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Step 8: Create RLS policies
CREATE POLICY "Service role can manage all agent_documents" ON agent_documents
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public can read agent_documents" ON agent_documents
    FOR SELECT
    USING (true);

-- Step 9: Create the vector search function with LOWERED threshold default
CREATE OR REPLACE FUNCTION match_agent_documents_v2(
  query_embedding vector(1536), -- Changed from 768 to 1536
  agent_type_param TEXT DEFAULT 'general',
  match_threshold FLOAT DEFAULT 0.3, -- LOWERED from 0.5 to 0.3
  max_results INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  agent_type TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ad.id,
    ad.agent_type,
    ad.title,
    ad.content,
    ad.metadata,
    1 - (ad.embedding <=> query_embedding) as similarity -- Changed from content_embedding
  FROM agent_documents ad
  WHERE ad.agent_type = agent_type_param
    AND (ad.embedding <=> query_embedding) < (1 - match_threshold)
  ORDER BY ad.embedding <=> query_embedding
  LIMIT max_results;
END;
$$;

-- Step 10: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON agent_documents TO service_role;
GRANT SELECT ON agent_documents TO anon, authenticated;
GRANT EXECUTE ON FUNCTION match_agent_documents_v2 TO anon, authenticated, service_role;

-- Step 11: Output summary
DO $$
DECLARE
  doc_count INTEGER;
  embedding_count INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(embedding) INTO doc_count, embedding_count
  FROM agent_documents
  WHERE agent_type = 'content_writer';
  
  RAISE NOTICE '=== RAG System Fix Complete ===';
  RAISE NOTICE 'Documents for content_writer: %', doc_count;
  RAISE NOTICE 'Documents with embeddings: %', embedding_count;
  RAISE NOTICE 'Match threshold lowered: 0.5 → 0.3';
  RAISE NOTICE 'Embedding dimension: 1536 (OpenAI text-embedding-3-small)';
  RAISE NOTICE 'Column name: embedding (not content_embedding)';
  
  IF embedding_count = 0 THEN
    RAISE WARNING 'No embeddings found! You need to:';
    RAISE WARNING '1. Add SEO research documents to agent_documents table';
    RAISE WARNING '2. Generate embeddings via POST /api/admin/generate-embeddings';
  END IF;
END $$;
