-- Complete fix for agent_documents table and vector search function
-- This replaces the previous incomplete migrations

-- 1. Ensure the agent_documents table exists with correct schema
CREATE TABLE IF NOT EXISTS agent_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_embedding vector(768),
  source_type TEXT DEFAULT 'pdf',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE agent_documents ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Service role can manage all agent_documents" ON agent_documents;
    DROP POLICY IF EXISTS "Public can read agent_documents" ON agent_documents;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. Create RLS policies
CREATE POLICY "Service role can manage all agent_documents" ON agent_documents
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public can read agent_documents" ON agent_documents
    FOR SELECT
    USING (true);

-- 5. Create HNSW index for fast vector search (if it doesn't exist)
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_agent_documents_embedding 
    ON agent_documents 
    USING hnsw (content_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
EXCEPTION
    WHEN OTHERS THEN 
        RAISE NOTICE 'Index may already exist or there was an error: %', SQLERRM;
END $$;

-- 6. Create or replace the vector search function with correct search_path
CREATE OR REPLACE FUNCTION match_agent_documents_v2(
  query_embedding vector(768),
  agent_type_param TEXT DEFAULT 'general',
  match_threshold FLOAT DEFAULT 0.5,
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
    1 - (ad.content_embedding <=> query_embedding) as similarity
  FROM agent_documents ad
  WHERE ad.agent_type = agent_type_param
    AND (ad.content_embedding <=> query_embedding) < (1 - match_threshold)
  ORDER BY ad.content_embedding <=> query_embedding
  LIMIT max_results;
END;
$$;

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON agent_documents TO service_role;
GRANT SELECT ON agent_documents TO anon, authenticated;
GRANT EXECUTE ON FUNCTION match_agent_documents_v2 TO anon, authenticated, service_role;









