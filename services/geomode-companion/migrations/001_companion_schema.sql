-- Local companion schema on VPS Postgres (shared stack with geomode)
CREATE SCHEMA IF NOT EXISTS companion;

CREATE TABLE IF NOT EXISTS companion.tracked_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  domain text NOT NULL,
  location_code integer NOT NULL DEFAULT 2840,
  language_code text NOT NULL DEFAULT 'en',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT tracked_keywords_unique UNIQUE (keyword, domain, location_code, language_code)
);

CREATE TABLE IF NOT EXISTS companion.serp_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  domain text NOT NULL,
  snapshot_date date NOT NULL,
  rank integer,
  previous_rank integer,
  search_volume integer,
  serp_features text[] NOT NULL DEFAULT '{}',
  raw_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  collected_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT serp_snapshots_unique UNIQUE (keyword, domain, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_companion_serp_snapshots_date
  ON companion.serp_snapshots (snapshot_date DESC);

CREATE TABLE IF NOT EXISTS companion.daily_digest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_date date NOT NULL UNIQUE,
  brand text NOT NULL,
  digest jsonb NOT NULL,
  degraded_sections text[] NOT NULL DEFAULT '{}',
  suggestions jsonb,
  built_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS companion.job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  status text NOT NULL,
  started_at timestamp NOT NULL DEFAULT now(),
  finished_at timestamp,
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_companion_job_runs_job_started
  ON companion.job_runs (job_name, started_at DESC);
