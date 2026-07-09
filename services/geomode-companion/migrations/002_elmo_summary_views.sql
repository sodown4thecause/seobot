-- Optional SQL views for geomode/Elmo Postgres.
-- Customize table/column names to match your Elmo fork schema once confirmed.

CREATE VIEW IF NOT EXISTS public.elmo_run_summary AS
SELECT
  COALESCE(engine, 'unknown') AS engine,
  COALESCE(brand, '') AS brand,
  COALESCE(brand_mentioned, false) AS brand_mentioned,
  NULL::text AS citation_url,
  NULL::double precision AS share_of_voice,
  captured_at
FROM (
  SELECT
    'chatgpt'::text AS engine,
    ''::text AS brand,
    false AS brand_mentioned,
    NOW() AS captured_at
  WHERE false
) AS placeholder
;

CREATE VIEW IF NOT EXISTS public.elmo_citation_summary AS
SELECT
  ''::text AS url,
  ''::text AS domain,
  ARRAY[]::text[] AS engines,
  false AS mentions_brand,
  0 AS citation_count,
  NOW() AS captured_at,
  ''::text AS brand
WHERE false
;
