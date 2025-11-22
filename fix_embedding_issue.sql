-- Fix Embedding Column Issue
-- Run this in your Supabase SQL Editor

-- First, let's see what exists
SELECT 'Current agent_documents table status:' as info;
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'agent_documents'
) as table_exists;

-- Check if embedding column exists
SELECT 'Embedding column status:' as info;
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'agent_documents' 
    AND column_name = 'embedding'
) as embedding_column_exists;

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop any existing functions first
DROP FUNCTION IF EXISTS match_agent_documents_v2(vector, text, double precision, integer);
DROP FUNCTION IF EXISTS match_agent_documents_v2(vector, text, float, integer);
DROP FUNCTION IF EXISTS match_agent_documents_v2(vector(768), text, float, integer);
DROP FUNCTION IF EXISTS match_agent_documents_v2(vector(1536), text, float, integer);
DROP FUNCTION IF EXISTS match_agent_documents_v2;

-- Create the agent_documents table (or recreate it with correct schema)
DROP TABLE IF EXISTS agent_documents CASCADE;

CREATE TABLE agent_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    agent_type TEXT NOT NULL DEFAULT 'content_writer',
    embedding vector(1536), -- 1536 dimensions for OpenAI text-embedding-3-small
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

SELECT 'Created agent_documents table with embedding column' as status;

-- Create the vector search function
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

-- Create index for vector similarity search
CREATE INDEX idx_agent_documents_embedding ON agent_documents 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Insert some sample data to test
INSERT INTO agent_documents (title, content, agent_type, embedding)
VALUES 
    ('SEO Writing Best Practices', 'Use clear headings, include relevant keywords naturally, write for humans first. Avoid keyword stuffing.', 'content_writer', array_fill(0.1, ARRAY[1536])::vector),
    ('Blog Structure Guide', 'Start with an engaging hook, use subheadings, include examples, end with a call to action.', 'content_writer', array_fill(0.2, ARRAY[1536])::vector);

SELECT 'Sample data inserted' as status;

-- Test the function
SELECT 'Testing vector search function:' as test;
SELECT id, title, similarity 
FROM match_agent_documents_v2(
    array_fill(0.1, ARRAY[1536])::vector, 
    'content_writer', 
    0.0, 
    2
);

SELECT 'Vector search function working correctly!' as final_status;