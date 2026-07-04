-- geomode companion nightly sync target (FlowIntent Neon)
-- See docs/specs/2026-06-12-geomode-geo-tracking-design.md

CREATE SCHEMA IF NOT EXISTS geo_tracking;

CREATE TABLE IF NOT EXISTS geo_tracking.daily_digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  digest_date date NOT NULL,
  brand text NOT NULL,
  digest jsonb NOT NULL,
  degraded_sections text[] DEFAULT '{}'::text[] NOT NULL,
  suggestions jsonb,
  synced_at timestamp DEFAULT now() NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT daily_digests_digest_date_unique UNIQUE (digest_date)
);

CREATE INDEX IF NOT EXISTS idx_geo_tracking_daily_digests_date
  ON geo_tracking.daily_digests (digest_date DESC);

CREATE INDEX IF NOT EXISTS idx_geo_tracking_daily_digests_brand
  ON geo_tracking.daily_digests (brand);

CREATE TABLE IF NOT EXISTS geo_tracking.digest_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  digest_id uuid NOT NULL REFERENCES geo_tracking.daily_digests(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  created_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT digest_embeddings_digest_section_unique UNIQUE (digest_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_geo_tracking_digest_embeddings_digest_id
  ON geo_tracking.digest_embeddings (digest_id);

CREATE INDEX IF NOT EXISTS geo_tracking_digest_embeddings_hnsw_idx
  ON geo_tracking.digest_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
