-- Add explicit SEO/GEO/Content mode separation for RAG and GEO runs.

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
