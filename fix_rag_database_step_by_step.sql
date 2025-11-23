-- Fix RAG Database Issues - Step by Step Approach
-- Run each section separately in your Supabase SQL Editor

-- STEP 1: Check current state
SELECT 'Current tables:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('content_learnings', 'content_best_practices', 'agent_documents');

-- STEP 2: Create missing tables with required columns
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

CREATE TABLE IF NOT EXISTS content_best_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL UNIQUE,
  techniques TEXT[] DEFAULT '{}',
  success_rate FLOAT,
  avg_ai_score FLOAT,
  sample_size INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

SELECT 'Tables created successfully' as status;

-- STEP 3: Check vector extension and existing functions
CREATE EXTENSION IF NOT EXISTS vector;

SELECT 'Existing functions:' as info;
SELECT routine_name, routine_type FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%agent_documents%';

-- STEP 4: Drop existing vector search function (all possible signatures)
DO $$
BEGIN
    -- Try to drop all possible signatures
    DROP FUNCTION IF EXISTS match_agent_documents_v2(vector, text, double precision, integer);
    DROP FUNCTION IF EXISTS match_agent_documents_v2(vector, text, float, integer);  
    DROP FUNCTION IF EXISTS match_agent_documents_v2(vector(768), text, float, integer);
    DROP FUNCTION IF EXISTS match_agent_documents_v2(vector(1536), text, float, integer);
    DROP FUNCTION IF EXISTS match_agent_documents_v2;
    RAISE NOTICE 'Dropped existing functions';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'No existing functions to drop: %', SQLERRM;
END $$;

-- STEP 5: Check if agent_documents table exists and its structure
DO $$
DECLARE
    table_exists boolean;
    vector_dim text;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'agent_documents'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'agent_documents table exists';
        
        -- Try to get vector dimension info
        SELECT data_type INTO vector_dim
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agent_documents' 
        AND column_name = 'embedding';
        
        RAISE NOTICE 'Embedding column type: %', vector_dim;
    ELSE
        RAISE NOTICE 'agent_documents table does not exist';
        
        -- Create the table with correct dimensions
        CREATE TABLE agent_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            agent_type TEXT NOT NULL DEFAULT 'content_writer',
            embedding vector(1536), -- 1536 dimensions for OpenAI text-embedding-3-small
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created agent_documents table with 1536-dimensional vectors';
    END IF;
END $$;

-- STEP 6: Create vector search function with proper error handling
DO $$
BEGIN
    CREATE FUNCTION match_agent_documents_v2(
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
    AS $function$
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
    $function$;
    
    RAISE NOTICE 'Successfully created match_agent_documents_v2 function';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Failed to create function: %', SQLERRM;
END $$;

-- STEP 7: Create vector index for performance
CREATE INDEX IF NOT EXISTS idx_agent_documents_embedding ON agent_documents 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- STEP 8: Set up RLS policies
ALTER TABLE content_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_best_practices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own learnings" ON content_learnings;
DROP POLICY IF EXISTS "Users can read their own learnings" ON content_learnings;
DROP POLICY IF EXISTS "Service role can read all learnings" ON content_learnings;
DROP POLICY IF EXISTS "Everyone can read best practices" ON content_best_practices;
DROP POLICY IF EXISTS "Service role can manage best practices" ON content_best_practices;

-- Create policies
CREATE POLICY "Users can insert their own learnings" ON content_learnings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own learnings" ON content_learnings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can read all learnings" ON content_learnings
    FOR SELECT TO service_role USING (true);

CREATE POLICY "Everyone can read best practices" ON content_best_practices
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage best practices" ON content_best_practices
    USING (true) WITH CHECK (true);

-- STEP 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_learnings_topic ON content_learnings(topic);
CREATE INDEX IF NOT EXISTS idx_content_learnings_type_success ON content_learnings(content_type, successful);
CREATE INDEX IF NOT EXISTS idx_content_learnings_user_type ON content_learnings(user_id, content_type);

-- STEP 10: Insert sample data to get started
INSERT INTO content_best_practices (content_type, techniques, success_rate, avg_ai_score, sample_size) 
VALUES 
    ('blog_post', ARRAY['personal_examples', 'varied_sentence_structure', 'rhetorical_questions'], 0.75, 25.0, 10),
    ('article', ARRAY['data_points', 'storytelling', 'contractions'], 0.70, 28.0, 8)
ON CONFLICT (content_type) DO UPDATE SET
    techniques = EXCLUDED.techniques,
    success_rate = EXCLUDED.success_rate,
    avg_ai_score = EXCLUDED.avg_ai_score,
    sample_size = EXCLUDED.sample_size,
    last_updated = NOW();

-- STEP 11: Final verification
SELECT 'Final verification:' as status;

SELECT 'Tables created:' as info, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('content_learnings', 'content_best_practices', 'agent_documents');

SELECT 'Functions created:' as info, routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'match_agent_documents_v2';

SELECT 'Sample data:' as info, content_type, array_length(techniques, 1) as technique_count
FROM content_best_practices;

SELECT 'Setup complete! Cross-user learning system is ready.' as final_status;