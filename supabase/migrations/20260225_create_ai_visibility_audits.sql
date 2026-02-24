-- AI visibility audit lead-magnet persistence table

CREATE TABLE IF NOT EXISTS public.ai_visibility_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  domain TEXT NOT NULL,
  brand_name TEXT,
  category TEXT,
  icp TEXT,
  competitors JSONB DEFAULT '[]'::jsonb,
  vertical TEXT,
  visibility_rate INTEGER,
  brand_found_count INTEGER,
  total_checks INTEGER,
  top_competitor TEXT,
  top_competitor_count INTEGER,
  platform_results JSONB,
  citation_urls JSONB DEFAULT '[]'::jsonb,
  ip_address TEXT,
  converted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_visibility_audits_created_at
  ON public.ai_visibility_audits (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_visibility_audits_email_domain
  ON public.ai_visibility_audits (email, domain);
