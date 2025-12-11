-- Add metadata column to agent_documents table
-- This fixes the error: column ad.metadata does not exist
-- The match_agent_documents_v2 function expects this column to exist

-- Add metadata column if it doesn't exist
ALTER TABLE public.agent_documents 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update any existing rows that might have NULL metadata
UPDATE public.agent_documents 
SET metadata = '{}'::jsonb 
WHERE metadata IS NULL;

-- Ensure the function is correctly defined to use metadata
-- Recreate match_agent_documents_v2 to ensure it matches the expected signature
CREATE OR REPLACE FUNCTION match_agent_documents_v2(
  query_embedding vector(1536),
  agent_type_param TEXT DEFAULT 'general',
  match_threshold FLOAT DEFAULT 0.3,
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
    COALESCE(ad.metadata, '{}'::jsonb) as metadata, -- Use COALESCE for safety
    1 - (ad.embedding <=> query_embedding) as similarity
  FROM agent_documents ad
  WHERE ad.agent_type = agent_type_param
    AND ad.embedding IS NOT NULL
    AND (ad.embedding <=> query_embedding) < (1 - match_threshold)
  ORDER BY ad.embedding <=> query_embedding
  LIMIT max_results;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION match_agent_documents_v2 TO anon, authenticated, service_role;

