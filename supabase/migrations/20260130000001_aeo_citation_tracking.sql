-- Migration: AEO Citation Tracking System
-- Enables tracking of AI citations across multiple platforms (ChatGPT, Perplexity, Claude, Gemini, Google AI Overview)

-- Main citations table
CREATE TABLE IF NOT EXISTS public.aeo_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Clerk user ID
  query TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('chatgpt', 'perplexity', 'claude', 'gemini', 'google_ai_overview')),
  cited BOOLEAN NOT NULL DEFAULT false,
  citation_text TEXT,
  citation_position INTEGER, -- Position in AI response (1 = first citation)
  citation_url TEXT, -- User's URL that was cited
  competitor_urls TEXT[], -- Competitor URLs cited for this query
  response_snippet TEXT, -- Snippet of AI response
  tracked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_citations_user_query ON public.aeo_citations(user_id, query);
CREATE INDEX IF NOT EXISTS idx_citations_platform ON public.aeo_citations(platform, tracked_at DESC);
CREATE INDEX IF NOT EXISTS idx_citations_user_cited ON public.aeo_citations(user_id, cited, tracked_at DESC);
CREATE INDEX IF NOT EXISTS idx_citations_query_platform ON public.aeo_citations(query, platform);

-- Citation gaps table (tracks opportunities where competitors are cited but user isn't)
CREATE TABLE IF NOT EXISTS public.citation_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('chatgpt', 'perplexity', 'claude', 'gemini', 'google_ai_overview')),
  competitors_cited TEXT[], -- URLs of competitors getting citations
  difficulty_score INTEGER CHECK (difficulty_score >= 1 AND difficulty_score <= 100), -- 1-100: how hard to capture
  opportunity_score INTEGER CHECK (opportunity_score >= 1 AND opportunity_score <= 100), -- Combined metric
  search_volume INTEGER,
  ai_search_volume INTEGER,
  user_has_content BOOLEAN DEFAULT false, -- Does user have existing content on this topic?
  user_content_url TEXT, -- If they have content, what's the URL?
  identified_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'captured', 'dismissed')),
  captured_at TIMESTAMPTZ, -- When citation was successfully captured
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for citation gaps
CREATE INDEX IF NOT EXISTS idx_gaps_user ON public.citation_gaps(user_id, opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_gaps_status ON public.citation_gaps(user_id, status);
CREATE INDEX IF NOT EXISTS idx_gaps_platform ON public.citation_gaps(platform, identified_at DESC);

-- Tracked queries table (queries user wants to monitor)
CREATE TABLE IF NOT EXISTS public.tracked_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  platforms TEXT[] DEFAULT ARRAY['chatgpt', 'perplexity', 'claude', 'gemini', 'google_ai_overview'], -- Which platforms to track
  check_frequency TEXT DEFAULT 'daily' CHECK (check_frequency IN ('hourly', 'daily', 'weekly')),
  last_checked_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, query)
);

-- Indexes for tracked queries
CREATE INDEX IF NOT EXISTS idx_tracked_queries_user ON public.tracked_queries(user_id, active);
CREATE INDEX IF NOT EXISTS idx_tracked_queries_check ON public.tracked_queries(check_frequency, last_checked_at) WHERE active = true;

-- Citation trends table (aggregated data for analytics)
CREATE TABLE IF NOT EXISTS public.citation_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  total_citations INTEGER DEFAULT 0,
  total_queries_tracked INTEGER DEFAULT 0,
  citation_rate DECIMAL(5,2), -- Percentage: citations / queries tracked
  avg_citation_position DECIMAL(4,2), -- Average position when cited
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, date, platform)
);

-- Indexes for trends
CREATE INDEX IF NOT EXISTS idx_trends_user_date ON public.citation_trends(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_trends_platform ON public.citation_trends(platform, date DESC);

-- Comments
COMMENT ON TABLE public.aeo_citations IS 'Tracks AI citations across multiple platforms (ChatGPT, Perplexity, Claude, Gemini, Google AI Overview)';
COMMENT ON TABLE public.citation_gaps IS 'Identifies opportunities where competitors are cited but user is not';
COMMENT ON TABLE public.tracked_queries IS 'Queries that users want to monitor for citations';
COMMENT ON TABLE public.citation_trends IS 'Aggregated citation trends for analytics and dashboards';

-- Function to update citation_trends automatically
CREATE OR REPLACE FUNCTION update_citation_trends()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.citation_trends (user_id, date, platform, total_citations, total_queries_tracked, citation_rate, avg_citation_position)
  SELECT 
    c.user_id,
    CURRENT_DATE as date,
    c.platform,
    COUNT(*) FILTER (WHERE c.cited = true) as total_citations,
    COUNT(DISTINCT c.query) as total_queries_tracked,
    (COUNT(*) FILTER (WHERE c.cited = true)::DECIMAL / NULLIF(COUNT(DISTINCT c.query), 0) * 100) as citation_rate,
    AVG(c.citation_position) FILTER (WHERE c.cited = true) as avg_citation_position
  FROM public.aeo_citations c
  WHERE DATE(c.tracked_at) = CURRENT_DATE
  GROUP BY c.user_id, c.platform
  ON CONFLICT (user_id, date, platform) 
  DO UPDATE SET
    total_citations = EXCLUDED.total_citations,
    total_queries_tracked = EXCLUDED.total_queries_tracked,
    citation_rate = EXCLUDED.citation_rate,
    avg_citation_position = EXCLUDED.avg_citation_position,
    created_at = NOW();
END;
$$;

COMMENT ON FUNCTION update_citation_trends() IS 'Aggregates daily citation data into trends table. Run via cron job.';
