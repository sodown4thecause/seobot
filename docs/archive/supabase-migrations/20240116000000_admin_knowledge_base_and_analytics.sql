-- Admin Dashboard: Agent Knowledge Bases and API Analytics
-- Created: 2024-01-16

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- AGENT KNOWLEDGE BASES (One table per agent)
-- =====================================================

-- SEO/AEO Manager Knowledge Base
CREATE TABLE IF NOT EXISTS seo_aeo_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'markdown', 'docx', 'txt')),
  file_url TEXT,
  embedding vector(1536), -- OpenAI ada-002 embeddings
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Strategist Knowledge Base
CREATE TABLE IF NOT EXISTS content_strategist_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'markdown', 'docx', 'txt')),
  file_url TEXT,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keyword Researcher Knowledge Base
CREATE TABLE IF NOT EXISTS keyword_researcher_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'markdown', 'docx', 'txt')),
  file_url TEXT,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor Analyst Knowledge Base
CREATE TABLE IF NOT EXISTS competitor_analyst_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'markdown', 'docx', 'txt')),
  file_url TEXT,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for vector similarity search
CREATE INDEX IF NOT EXISTS seo_aeo_knowledge_embedding_idx ON seo_aeo_knowledge USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS content_strategist_knowledge_embedding_idx ON content_strategist_knowledge USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS keyword_researcher_knowledge_embedding_idx ON keyword_researcher_knowledge USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS competitor_analyst_knowledge_embedding_idx ON competitor_analyst_knowledge USING ivfflat (embedding vector_cosine_ops);

-- Create indexes for user_id lookups
CREATE INDEX IF NOT EXISTS seo_aeo_knowledge_user_id_idx ON seo_aeo_knowledge(user_id);
CREATE INDEX IF NOT EXISTS content_strategist_knowledge_user_id_idx ON content_strategist_knowledge(user_id);
CREATE INDEX IF NOT EXISTS keyword_researcher_knowledge_user_id_idx ON keyword_researcher_knowledge(user_id);
CREATE INDEX IF NOT EXISTS competitor_analyst_knowledge_user_id_idx ON competitor_analyst_knowledge(user_id);

-- =====================================================
-- API ANALYTICS TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL CHECK (service IN ('dataforseo', 'perplexity', 'openai', 'firecrawl', 'rytr', 'winston', 'jina')),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  tokens_used INTEGER DEFAULT 0,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS api_usage_logs_user_id_idx ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS api_usage_logs_service_idx ON api_usage_logs(service);
CREATE INDEX IF NOT EXISTS api_usage_logs_created_at_idx ON api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS api_usage_logs_service_created_at_idx ON api_usage_logs(service, created_at DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- SEO/AEO Knowledge Base RLS
ALTER TABLE seo_aeo_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own SEO/AEO knowledge" ON seo_aeo_knowledge FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own SEO/AEO knowledge" ON seo_aeo_knowledge FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own SEO/AEO knowledge" ON seo_aeo_knowledge FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own SEO/AEO knowledge" ON seo_aeo_knowledge FOR DELETE USING (auth.uid() = user_id);

-- Content Strategist Knowledge Base RLS
ALTER TABLE content_strategist_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own Content Strategist knowledge" ON content_strategist_knowledge FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own Content Strategist knowledge" ON content_strategist_knowledge FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own Content Strategist knowledge" ON content_strategist_knowledge FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own Content Strategist knowledge" ON content_strategist_knowledge FOR DELETE USING (auth.uid() = user_id);

-- Keyword Researcher Knowledge Base RLS
ALTER TABLE keyword_researcher_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own Keyword Researcher knowledge" ON keyword_researcher_knowledge FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own Keyword Researcher knowledge" ON keyword_researcher_knowledge FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own Keyword Researcher knowledge" ON keyword_researcher_knowledge FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own Keyword Researcher knowledge" ON keyword_researcher_knowledge FOR DELETE USING (auth.uid() = user_id);

-- Competitor Analyst Knowledge Base RLS
ALTER TABLE competitor_analyst_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own Competitor Analyst knowledge" ON competitor_analyst_knowledge FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own Competitor Analyst knowledge" ON competitor_analyst_knowledge FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own Competitor Analyst knowledge" ON competitor_analyst_knowledge FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own Competitor Analyst knowledge" ON competitor_analyst_knowledge FOR DELETE USING (auth.uid() = user_id);

-- API Usage Logs RLS
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own API usage logs" ON api_usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own API usage logs" ON api_usage_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS FOR ANALYTICS
-- =====================================================

-- Function to get API usage summary by service and time period
CREATE OR REPLACE FUNCTION get_api_usage_summary(
  p_user_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  service TEXT,
  total_calls BIGINT,
  total_cost DECIMAL,
  total_tokens BIGINT,
  avg_duration_ms DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    api_usage_logs.service,
    COUNT(*)::BIGINT as total_calls,
    SUM(cost_usd)::DECIMAL as total_cost,
    SUM(tokens_used)::BIGINT as total_tokens,
    AVG(duration_ms)::DECIMAL as avg_duration_ms
  FROM api_usage_logs
  WHERE api_usage_logs.user_id = p_user_id
    AND api_usage_logs.created_at >= p_start_date
    AND api_usage_logs.created_at <= p_end_date
  GROUP BY api_usage_logs.service
  ORDER BY total_cost DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get daily API usage
CREATE OR REPLACE FUNCTION get_daily_api_usage(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  service TEXT,
  total_calls BIGINT,
  total_cost DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(api_usage_logs.created_at) as date,
    api_usage_logs.service,
    COUNT(*)::BIGINT as total_calls,
    SUM(cost_usd)::DECIMAL as total_cost
  FROM api_usage_logs
  WHERE api_usage_logs.user_id = p_user_id
    AND api_usage_logs.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE(api_usage_logs.created_at), api_usage_logs.service
  ORDER BY date DESC, total_cost DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

