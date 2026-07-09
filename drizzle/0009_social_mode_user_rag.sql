ALTER TABLE agent_documents
  DROP CONSTRAINT IF EXISTS agent_documents_mode_check;

ALTER TABLE agent_documents
  ADD CONSTRAINT agent_documents_mode_check CHECK (mode IN ('seo', 'geo', 'content', 'social'));

UPDATE agent_documents
SET mode = 'seo'
WHERE mode IS NULL OR mode NOT IN ('seo', 'geo', 'content', 'social');

CREATE INDEX IF NOT EXISTS agent_documents_embedding_social_hnsw_idx
ON agent_documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64)
WHERE mode = 'social' AND embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_documents_metadata_user_id
ON agent_documents ((metadata->>'userId'));

CREATE INDEX IF NOT EXISTS idx_agent_documents_user_mode_source
ON agent_documents ((metadata->>'userId'), mode, source_type);
