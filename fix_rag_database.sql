-- Fix RAG Database Issues
-- Run this SQL script in your Supabase SQL Editor

-- 1. Create content_learnings table with all required columns
CREATE TABLE IF NOT EXISTS content_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  topic TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  ai_detection_score FLOAT,
  human_probability FLOAT,
  successful BOOLEAN DEFAULT false, -- This was missing
  techniques_used TEXT[] DEFAULT '{}',
  feedback TEXT, -- This was missing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create content_best_practices table (was looking for wrong name)
CREATE TABLE IF NOT EXISTS content_best_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL UNIQUE,
  techniques TEXT[] DEFAULT '{}',
  success_rate FLOAT,
  avg_ai_score FLOAT,
  sample_size INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Check if vector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- 4. Check existing agent_documents table and fix vector dimension if needed
-- First, let's see what exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_documents') THEN
        -- Check the vector column dimension
        -- If it's 768, we need to update it to 1536 to match OpenAI text-embedding-3-small
        
        -- For safety, let's create a new table with correct dimensions
        CREATE TABLE IF NOT EXISTS agent_documents_new (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            agent_type TEXT NOT NULL DEFAULT 'content_writer',
            embedding vector(1536), -- 1536 dimensions for OpenAI text-embedding-3-small
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create index for vector similarity search
        CREATE INDEX IF NOT EXISTS idx_agent_documents_embedding ON agent_documents_new 
        USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
        
        RAISE NOTICE 'Created agent_documents_new with 1536-dimensional vectors';
    ELSE
        -- Create the table with correct dimensions from scratch
        CREATE TABLE agent_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            agent_type TEXT NOT NULL DEFAULT 'content_writer',
            embedding vector(1536), -- 1536 dimensions for OpenAI text-embedding-3-small
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create index for vector similarity search
        CREATE INDEX IF NOT EXISTS idx_agent_documents_embedding ON agent_documents 
        USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
        
        RAISE NOTICE 'Created agent_documents with 1536-dimensional vectors';
    END IF;
END $$;

-- 5. Create or update the vector search function for 1536 dimensions
CREATE OR REPLACE FUNCTION match_agent_documents_v2(
    query_embedding vector(1536),
    agent_type_param text DEFAULT NULL,
    match_threshold float DEFAULT 0.5,
    max_results integer DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    title text,
    content text,
    agent_type text,
    similarity float
)
LANGUAGE SQL STABLE
AS $$
    SELECT 
        id,
        title,
        content,
        agent_type,
        1 - (embedding <=> query_embedding) as similarity
    FROM agent_documents
    WHERE 
        (agent_type_param IS NULL OR agent_type = agent_type_param)
        AND 1 - (embedding <=> query_embedding) > match_threshold
    ORDER BY embedding <=> query_embedding
    LIMIT max_results;
$$;

-- 6. Enable RLS on new tables
ALTER TABLE content_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_best_practices ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
-- Content learnings - users can manage their own
DROP POLICY IF EXISTS "Users can insert their own learnings" ON content_learnings;
CREATE POLICY "Users can insert their own learnings" ON content_learnings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own learnings" ON content_learnings;
CREATE POLICY "Users can read their own learnings" ON content_learnings
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can read all for aggregation
DROP POLICY IF EXISTS "Service role can read all learnings" ON content_learnings;
CREATE POLICY "Service role can read all learnings" ON content_learnings
    FOR SELECT TO service_role USING (true);

-- Best practices - public read, service role write
DROP POLICY IF EXISTS "Everyone can read best practices" ON content_best_practices;
CREATE POLICY "Everyone can read best practices" ON content_best_practices
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage best practices" ON content_best_practices;
CREATE POLICY "Service role can manage best practices" ON content_best_practices
    USING (true) WITH CHECK (true);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_learnings_topic ON content_learnings(topic);
CREATE INDEX IF NOT EXISTS idx_content_learnings_type_success ON content_learnings(content_type, successful);
CREATE INDEX IF NOT EXISTS idx_content_learnings_user_type ON content_learnings(user_id, content_type);

-- 9. Insert sample best practices to get started
INSERT INTO content_best_practices (content_type, techniques, success_rate, avg_ai_score, sample_size) 
VALUES 
    ('blog_post', ARRAY['personal_examples', 'varied_sentence_structure', 'rhetorical_questions'], 0.75, 25.0, 10),
    ('article', ARRAY['data_points', 'storytelling', 'contractions'], 0.70, 28.0, 8)
ON CONFLICT (content_type) DO NOTHING;

-- 10. Show what we created
SELECT 'Tables created:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('content_learnings', 'content_best_practices', 'agent_documents', 'agent_documents_new');

-- Check vector dimensions
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND data_type = 'USER-DEFINED'
        AND table_name LIKE '%agent_documents%'
    LOOP
        RAISE NOTICE 'Vector column: %.% (%)', rec.table_name, rec.column_name, rec.data_type;
    END LOOP;
END $$;