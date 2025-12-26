-- Add unique constraint on (title, agent_type) for agent_documents
-- This allows upsert operations to use onConflict: 'title,agent_type'
-- to prevent duplicate documents with the same title and agent_type

-- First, remove any duplicate rows that would violate the constraint
-- Keep only the most recent version of each (title, agent_type) pair
WITH duplicates AS (
  SELECT id,
         title,
         agent_type,
         ROW_NUMBER() OVER (
           PARTITION BY title, agent_type
           ORDER BY created_at DESC, id DESC
         ) as rn
  FROM agent_documents
)
DELETE FROM agent_documents
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add the unique constraint
-- Use a named constraint for better error handling
ALTER TABLE agent_documents
ADD CONSTRAINT agent_documents_title_agent_type_unique
UNIQUE (title, agent_type);

-- Create an index to improve query performance on these columns
-- (The unique constraint automatically creates an index, but we're being explicit)
-- Note: This is redundant with the unique constraint index, so we skip it
-- CREATE INDEX IF NOT EXISTS idx_agent_documents_title_agent_type
-- ON agent_documents (title, agent_type);
