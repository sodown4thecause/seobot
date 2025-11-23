-- Update vector dimensions from 1536 (OpenAI) to 768 (Gemini)

-- 1. Update brand_voices table
ALTER TABLE brand_voices 
ALTER COLUMN embedding TYPE vector(768);

-- 2. Update writing_frameworks table
ALTER TABLE writing_frameworks 
ALTER COLUMN embedding TYPE vector(768);

-- 3. Update match_frameworks function
DROP FUNCTION IF EXISTS match_frameworks(vector(1536), float, int);

CREATE OR REPLACE FUNCTION match_frameworks (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  name text,
  structure jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    writing_frameworks.id,
    writing_frameworks.name,
    writing_frameworks.structure,
    1 - (writing_frameworks.embedding <=> query_embedding) AS similarity
  FROM writing_frameworks
  WHERE 1 - (writing_frameworks.embedding <=> query_embedding) > match_threshold
  ORDER BY writing_frameworks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Recreate indexes (optional, but good practice if they were specific to dimensions)
-- Note: ivfflat indexes might need to be rebuilt anyway when data changes significantly
DROP INDEX IF EXISTS idx_brand_voice_embedding;
DROP INDEX IF EXISTS idx_frameworks_embedding;

CREATE INDEX idx_brand_voice_embedding ON brand_voices 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_frameworks_embedding ON writing_frameworks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
