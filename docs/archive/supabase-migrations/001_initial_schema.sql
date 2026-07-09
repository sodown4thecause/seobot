-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Business Profiles Table
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  industry TEXT,
  locations JSONB,
  goals JSONB,
  content_frequency TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand Voices Table
CREATE TABLE brand_voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tone TEXT NOT NULL,
  style TEXT NOT NULL,
  personality JSONB,
  sample_phrases TEXT[],
  embedding vector(1536),
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Connections Table
CREATE TABLE social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  profile_url TEXT,
  access_token TEXT,
  posts_analyzed INT DEFAULT 0,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitors Table
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  domain_authority INT,
  monthly_traffic BIGINT,
  priority TEXT DEFAULT 'secondary',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keywords Table
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INT,
  keyword_difficulty INT,
  current_ranking INT,
  intent TEXT,
  priority TEXT DEFAULT 'medium',
  metadata JSONB,
  status TEXT DEFAULT 'opportunity',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Table
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content_type TEXT NOT NULL,
  target_keyword TEXT,
  word_count INT,
  seo_score INT,
  status TEXT DEFAULT 'draft',
  published_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  cms_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Versions Table
CREATE TABLE content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  content_html TEXT,
  content_markdown TEXT,
  meta_title TEXT,
  meta_description TEXT,
  version_number INT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Writing Frameworks Table
CREATE TABLE writing_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  structure JSONB,
  example TEXT,
  embedding vector(1536),
  is_custom BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CMS Integrations Table
CREATE TABLE cms_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  site_url TEXT,
  credentials JSONB,
  settings JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link Opportunities Table
CREATE TABLE link_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_type TEXT NOT NULL,
  target_domain TEXT NOT NULL,
  domain_authority INT,
  contact_info JSONB,
  status TEXT DEFAULT 'identified',
  notes TEXT,
  outreach_sent_at TIMESTAMP WITH TIME ZONE,
  response_received_at TIMESTAMP WITH TIME ZONE,
  link_acquired_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Outreach Campaigns Table
CREATE TABLE outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  link_opportunity_id UUID REFERENCES link_opportunities(id) ON DELETE CASCADE,
  email_subject TEXT,
  email_body TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft'
);

-- Analytics Snapshots Table
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

-- Chat Messages Table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX idx_brand_voices_user_id ON brand_voices(user_id);
CREATE INDEX idx_competitors_user_id ON competitors(user_id);
CREATE INDEX idx_keywords_user_priority ON keywords(user_id, priority, search_volume DESC);
CREATE INDEX idx_content_user_status ON content(user_id, status, created_at DESC);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);

-- Vector indexes for RAG
CREATE INDEX idx_brand_voice_embedding ON brand_voices 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_frameworks_embedding ON writing_frameworks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Row Level Security Policies
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for user access
CREATE POLICY "Users can view own business_profiles" ON business_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own business_profiles" ON business_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own business_profiles" ON business_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own brand_voices" ON brand_voices
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own brand_voices" ON brand_voices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own competitors" ON competitors
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own competitors" ON competitors
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own competitors" ON competitors
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own competitors" ON competitors
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own keywords" ON keywords
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own keywords" ON keywords
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own keywords" ON keywords
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own content" ON content
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own content" ON content
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content" ON content
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own content" ON content
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chat_messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat_messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_frameworks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  name text,
  structure jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    writing_frameworks.id,
    writing_frameworks.name,
    writing_frameworks.structure,
    1 - (writing_frameworks.embedding <=> query_embedding) AS similarity
  FROM writing_frameworks
  WHERE 1 - (writing_frameworks.embedding <=> query_embedding) > match_threshold
  ORDER BY writing_frameworks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
