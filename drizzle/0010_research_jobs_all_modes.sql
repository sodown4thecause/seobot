ALTER TABLE research_jobs
  DROP CONSTRAINT IF EXISTS research_jobs_mode_check;

ALTER TABLE research_jobs
  ADD CONSTRAINT research_jobs_mode_check CHECK (mode IN ('seo', 'geo', 'content', 'social'));
