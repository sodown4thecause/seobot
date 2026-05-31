-- Add explicit SEO/GEO/Content mode separation for RAG and GEO runs.

ALTER TABLE users
  ALTER COLUMN clerk_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS better_auth_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_better_auth_id ON users(better_auth_id);

CREATE TABLE IF NOT EXISTS "user" (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  role text,
  banned boolean DEFAULT false,
  "banReason" text,
  "banExpires" timestamp,
  "clerkId" text,
  "subscriptionStatus" text DEFAULT 'inactive'
);

CREATE TABLE IF NOT EXISTS session (
  id text PRIMARY KEY,
  "expiresAt" timestamp NOT NULL,
  token text NOT NULL UNIQUE,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "impersonatedBy" text
);

CREATE INDEX IF NOT EXISTS "session_userId_idx" ON session("userId");

CREATE TABLE IF NOT EXISTS account (
  id text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp,
  "refreshTokenExpiresAt" timestamp,
  scope text,
  password text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "account_userId_idx" ON account("userId");

CREATE TABLE IF NOT EXISTS verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON verification(identifier);

ALTER TABLE agent_documents
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'seo',
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS engine text,
  ADD COLUMN IF NOT EXISTS query text,
  ADD COLUMN IF NOT EXISTS topic text,
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS competitor text,
  ADD COLUMN IF NOT EXISTS captured_at timestamp;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_documents_mode_check'
  ) THEN
    ALTER TABLE agent_documents
      ADD CONSTRAINT agent_documents_mode_check CHECK (mode IN ('seo', 'geo', 'content'));
  END IF;
END $$;

UPDATE agent_documents
SET mode = 'seo'
WHERE mode IS NULL OR mode NOT IN ('seo', 'geo', 'content');

CREATE INDEX IF NOT EXISTS idx_agent_documents_mode ON agent_documents(mode);
CREATE INDEX IF NOT EXISTS idx_agent_documents_mode_source_type ON agent_documents(mode, source_type);
CREATE INDEX IF NOT EXISTS idx_agent_documents_mode_topic ON agent_documents(mode, topic);

CREATE INDEX IF NOT EXISTS agent_documents_embedding_seo_hnsw_idx
ON agent_documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64)
WHERE mode = 'seo' AND embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS agent_documents_embedding_geo_hnsw_idx
ON agent_documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64)
WHERE mode = 'geo' AND embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS agent_documents_embedding_content_hnsw_idx
ON agent_documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64)
WHERE mode = 'content' AND embedding IS NOT NULL;

CREATE OR REPLACE FUNCTION match_agent_documents_by_mode(
    query_embedding vector(1536),
    mode_param text DEFAULT 'seo',
    match_threshold float DEFAULT 0.3,
    match_count int DEFAULT 5,
    topic_param text DEFAULT NULL,
    source_type_param text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    agent_type text,
    mode text,
    title text,
    content text,
    source_type text,
    url text,
    engine text,
    topic text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ad.id,
        ad.agent_type,
        ad.mode,
        ad.title,
        ad.content,
        ad.source_type,
        ad.url,
        ad.engine,
        ad.topic,
        ad.metadata,
        1 - (ad.embedding <=> query_embedding) AS similarity
    FROM agent_documents ad
    WHERE ad.mode = mode_param
      AND ad.embedding IS NOT NULL
      AND 1 - (ad.embedding <=> query_embedding) > match_threshold
      AND (topic_param IS NULL OR ad.topic = topic_param)
      AND (source_type_param IS NULL OR ad.source_type = source_type_param)
    ORDER BY ad.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

CREATE TABLE IF NOT EXISTS geo_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id text,
  prompt text NOT NULL,
  brand text,
  topic text,
  audience text,
  intent text,
  competitors text[],
  engines text[],
  active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geo_prompts_brand ON geo_prompts(brand);
CREATE INDEX IF NOT EXISTS idx_geo_prompts_user_id ON geo_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_geo_prompts_active ON geo_prompts(active);

CREATE TABLE IF NOT EXISTS geo_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id text,
  geo_prompt_id uuid REFERENCES geo_prompts(id) ON DELETE SET NULL,
  engine text NOT NULL,
  prompt text NOT NULL,
  brand text NOT NULL,
  competitors text[],
  response_text text,
  cited_urls text[],
  cited_domains text[],
  mentioned_brands text[],
  competitor_mentions jsonb,
  sentiment text,
  brand_position integer,
  visibility_score real,
  status text NOT NULL DEFAULT 'completed',
  raw_json jsonb,
  captured_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geo_runs_engine ON geo_runs(engine);
CREATE INDEX IF NOT EXISTS idx_geo_runs_user_id ON geo_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_geo_runs_brand ON geo_runs(brand);
CREATE INDEX IF NOT EXISTS idx_geo_runs_captured_at ON geo_runs(captured_at);

CREATE TABLE IF NOT EXISTS research_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id text,
  mode text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  summary text,
  raw_json jsonb,
  started_at timestamp,
  completed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT research_jobs_mode_check CHECK (mode IN ('seo', 'geo'))
);

CREATE INDEX IF NOT EXISTS idx_research_jobs_mode_status ON research_jobs(mode, status);
CREATE INDEX IF NOT EXISTS idx_research_jobs_user_id ON research_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_research_jobs_created_at ON research_jobs(created_at);
