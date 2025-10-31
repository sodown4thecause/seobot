-- Phase 7: Video SEO and Podcast Features
-- Migration for video content optimization, podcast transcription, schema markup, local SEO, and competitor alerts

-- Video SEO Analysis Table
CREATE TABLE IF NOT EXISTS video_seo_analysis (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  video_title text NOT NULL,
  video_description text,
  tags text[] DEFAULT '{}',
  thumbnail_url text,
  duration integer, -- in seconds
  transcript text,
  seo_score integer CHECK (seo_score >= 0 AND seo_score <= 100),
  optimization_suggestions jsonb DEFAULT '[]',
  target_keywords text[] DEFAULT '{}',
  competitor_analysis jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}', -- {platform, videoId, channelName, etc.}
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Podcast Transcription Table
CREATE TABLE IF NOT EXISTS podcast_transcriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_url text NOT NULL,
  podcast_title text NOT NULL,
  podcast_description text,
  episode_number integer,
  duration integer, -- in seconds
  transcript text NOT NULL,
  summary text,
  key_topics text[] DEFAULT '{}',
  guest_speakers text[] DEFAULT '{}',
  seo_optimized_content jsonb DEFAULT '{}', -- {show_notes, timestamps, quotes}
  target_keywords text[] DEFAULT '{}',
  content_repurposing jsonb DEFAULT '{}', -- {blog_posts, social_media, quotes}
  metadata jsonb DEFAULT '{}', -- {platform, language, etc.}
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Schema Markup Templates Table
CREATE TABLE IF NOT EXISTS schema_markup_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  schema_type text NOT NULL, -- Article, Product, Event, etc.
  template_content jsonb NOT NULL, -- The actual schema.org structure
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Generated Schema Markup Table
CREATE TABLE IF NOT EXISTS generated_schema_markup (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid REFERENCES content(id) ON DELETE CASCADE,
  schema_type text NOT NULL,
  schema_data jsonb NOT NULL,
  template_id uuid REFERENCES schema_markup_templates(id) ON DELETE SET NULL,
  validation_status text DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid')),
  validation_errors text[] DEFAULT '{}',
  implementation_status text DEFAULT 'draft' CHECK (implementation_status IN ('draft', 'implemented', 'tested')),
  search_console_impact jsonb DEFAULT '{}', -- {impressions, clicks, ctr}
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Local SEO Business Profiles Table
CREATE TABLE IF NOT EXISTS local_seo_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_category text NOT NULL,
  business_address jsonb NOT NULL, -- {street, city, state, zip, country}
  business_phone text,
  business_website text,
  google_business_profile_id text,
  business_hours jsonb DEFAULT '{}', -- {day: {open, close}}
  services_offered text[] DEFAULT '{}',
  service_areas text[] DEFAULT '{}',
  photos text[] DEFAULT '{}', -- URLs to business photos
  reviews jsonb DEFAULT '{}', -- {rating, count, recent_reviews}
  local_keywords text[] DEFAULT '{}',
  competitor_businesses jsonb DEFAULT '[]', -- Local competitor analysis
  citation_sources jsonb DEFAULT '[]', -- Local directories and citations
  seo_score integer CHECK (seo_score >= 0 AND seo_score <= 100),
  optimization_tasks jsonb DEFAULT '[]', -- Recommended optimization tasks
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Competitor Alert Configurations Table
CREATE TABLE IF NOT EXISTS competitor_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_name text NOT NULL,
  competitor_domains text[] NOT NULL,
  target_keywords text[] DEFAULT '{}',
  alert_types text[] DEFAULT '{}', -- {new_content, ranking_changes, backlinks, price_changes}
  notification_channels jsonb DEFAULT '[]', -- {email, slack, webhook}
  alert_frequency text DEFAULT 'daily' CHECK (alert_frequency IN ('real_time', 'hourly', 'daily', 'weekly')),
  is_active boolean DEFAULT true,
  last_triggered timestamp with time zone,
  alert_conditions jsonb DEFAULT '{}', -- Custom conditions for triggering alerts
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Competitor Alert Events Table
CREATE TABLE IF NOT EXISTS competitor_alert_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id uuid REFERENCES competitor_alerts(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- new_content, ranking_change, etc.
  competitor_domain text NOT NULL,
  detected_at timestamp with time zone DEFAULT now(),
  event_data jsonb NOT NULL, -- Details about the event
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved')),
  notification_sent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Content Repurposing Queue Table
CREATE TABLE IF NOT EXISTS content_repurposing_queue (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  source_content_id uuid REFERENCES content(id) ON DELETE CASCADE,
  source_type text NOT NULL, -- article, video, podcast
  target_formats text[] NOT NULL, -- {twitter_thread, linkedin_post, infographic, etc.}
  repurposed_content jsonb DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  scheduled_for timestamp with time zone,
  processing_started_at timestamp with time zone,
  completed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- AI Content Generation Templates Table
CREATE TABLE IF NOT EXISTS ai_content_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  template_type text NOT NULL, -- social_media, email_newsletter, blog_outline, etc.
  template_prompt text NOT NULL,
  variables jsonb DEFAULT '{}', -- Template variables and their descriptions
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  rating numeric(3,2) CHECK (rating >= 0 AND rating <= 5),
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL, -- article, video, podcast, etc.
  content_id text, -- Can be UUID or external ID
  metric_type text NOT NULL, -- views, engagement, conversions, etc.
  metric_value numeric NOT NULL,
  metric_date date NOT NULL,
  source text NOT NULL, -- google_analytics, youtube_api, etc.
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_seo_analysis_user ON video_seo_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_video_seo_analysis_created ON video_seo_analysis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_seo_analysis_seo_score ON video_seo_analysis(seo_score);

CREATE INDEX IF NOT EXISTS idx_podcast_transcriptions_user ON podcast_transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_podcast_transcriptions_created ON podcast_transcriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_podcast_transcriptions_duration ON podcast_transcriptions(duration);

CREATE INDEX IF NOT EXISTS idx_schema_markup_templates_user ON schema_markup_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_schema_markup_templates_type ON schema_markup_templates(schema_type);
CREATE INDEX IF NOT EXISTS idx_schema_markup_templates_active ON schema_markup_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_generated_schema_markup_user ON generated_schema_markup(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_schema_markup_content ON generated_schema_markup(content_id);
CREATE INDEX IF NOT EXISTS idx_generated_schema_markup_type ON generated_schema_markup(schema_type);

CREATE INDEX IF NOT EXISTS idx_local_seo_profiles_user ON local_seo_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_local_seo_profiles_business ON local_seo_profiles(business_name);
CREATE INDEX IF NOT EXISTS idx_local_seo_profiles_seo_score ON local_seo_profiles(seo_score);

CREATE INDEX IF NOT EXISTS idx_competitor_alerts_user ON competitor_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_alerts_active ON competitor_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_competitor_alerts_triggered ON competitor_alerts(last_triggered DESC);

CREATE INDEX IF NOT EXISTS idx_competitor_alert_events_alert ON competitor_alert_events(alert_id);
CREATE INDEX IF NOT EXISTS idx_competitor_alert_events_detected ON competitor_alert_events(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_alert_events_status ON competitor_alert_events(status);

CREATE INDEX IF NOT EXISTS idx_content_repurposing_queue_user ON content_repurposing_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_content_repurposing_queue_status ON content_repurposing_queue(status);
CREATE INDEX IF NOT EXISTS idx_content_repurposing_queue_scheduled ON content_repurposing_queue(scheduled_for);

CREATE INDEX IF NOT EXISTS idx_ai_content_templates_user ON ai_content_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_templates_type ON ai_content_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_ai_content_templates_public ON ai_content_templates(is_public);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_user ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_content_type ON performance_metrics(content_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);

-- Row Level Security
ALTER TABLE video_seo_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_markup_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_schema_markup ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_seo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_repurposing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Video SEO Analysis
DROP POLICY IF EXISTS "Users can manage own video SEO analysis" ON video_seo_analysis;
CREATE POLICY "Users can manage own video SEO analysis" ON video_seo_analysis
  FOR ALL USING (auth.uid() = user_id);

-- Podcast Transcriptions
DROP POLICY IF EXISTS "Users can manage own podcast transcriptions" ON podcast_transcriptions;
CREATE POLICY "Users can manage own podcast transcriptions" ON podcast_transcriptions
  FOR ALL USING (auth.uid() = user_id);

-- Schema Markup Templates
DROP POLICY IF EXISTS "Users can manage own schema templates" ON schema_markup_templates;
CREATE POLICY "Users can manage own schema templates" ON schema_markup_templates
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public templates are viewable by all authenticated users" ON schema_markup_templates;
CREATE POLICY "Public templates are viewable by all authenticated users" ON schema_markup_templates
  FOR SELECT USING (is_public = true AND auth.role() = 'authenticated');

-- Generated Schema Markup
DROP POLICY IF EXISTS "Users can manage own generated schema markup" ON generated_schema_markup;
CREATE POLICY "Users can manage own generated schema markup" ON generated_schema_markup
  FOR ALL USING (auth.uid() = user_id);

-- Local SEO Profiles
DROP POLICY IF EXISTS "Users can manage own local SEO profiles" ON local_seo_profiles;
CREATE POLICY "Users can manage own local SEO profiles" ON local_seo_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Competitor Alerts
DROP POLICY IF EXISTS "Users can manage own competitor alerts" ON competitor_alerts;
CREATE POLICY "Users can manage own competitor alerts" ON competitor_alerts
  FOR ALL USING (auth.uid() = user_id);

-- Competitor Alert Events
DROP POLICY IF EXISTS "Users can view own competitor alert events" ON competitor_alert_events;
CREATE POLICY "Users can view own competitor alert events" ON competitor_alert_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM competitor_alerts 
      WHERE id = alert_id AND user_id = auth.uid()
    )
  );

-- Content Repurposing Queue
DROP POLICY IF EXISTS "Users can manage own repurposing queue" ON content_repurposing_queue;
CREATE POLICY "Users can manage own repurposing queue" ON content_repurposing_queue
  FOR ALL USING (auth.uid() = user_id);

-- AI Content Templates
DROP POLICY IF EXISTS "Users can manage own AI templates" ON ai_content_templates;
CREATE POLICY "Users can manage own AI templates" ON ai_content_templates
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public AI templates are viewable by all authenticated users" ON ai_content_templates;
CREATE POLICY "Public AI templates are viewable by all authenticated users" ON ai_content_templates
  FOR SELECT USING (is_public = true AND auth.role() = 'authenticated');

-- Performance Metrics
DROP POLICY IF EXISTS "Users can manage own performance metrics" ON performance_metrics;
CREATE POLICY "Users can manage own performance metrics" ON performance_metrics
  FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_video_seo_analysis_updated_at ON video_seo_analysis;
CREATE TRIGGER update_video_seo_analysis_updated_at 
  BEFORE UPDATE ON video_seo_analysis 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_podcast_transcriptions_updated_at ON podcast_transcriptions;
CREATE TRIGGER update_podcast_transcriptions_updated_at 
  BEFORE UPDATE ON podcast_transcriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schema_markup_templates_updated_at ON schema_markup_templates;
CREATE TRIGGER update_schema_markup_templates_updated_at 
  BEFORE UPDATE ON schema_markup_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_generated_schema_markup_updated_at ON generated_schema_markup;
CREATE TRIGGER update_generated_schema_markup_updated_at 
  BEFORE UPDATE ON generated_schema_markup 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_local_seo_profiles_updated_at ON local_seo_profiles;
CREATE TRIGGER update_local_seo_profiles_updated_at 
  BEFORE UPDATE ON local_seo_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_competitor_alerts_updated_at ON competitor_alerts;
CREATE TRIGGER update_competitor_alerts_updated_at 
  BEFORE UPDATE ON competitor_alerts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_repurposing_queue_updated_at ON content_repurposing_queue;
CREATE TRIGGER update_content_repurposing_queue_updated_at 
  BEFORE UPDATE ON content_repurposing_queue 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_content_templates_updated_at ON ai_content_templates;
CREATE TRIGGER update_ai_content_templates_updated_at 
  BEFORE UPDATE ON ai_content_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for podcast audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'podcast-audio',
  'podcast-audio',
  true,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for podcast audio
DROP POLICY IF EXISTS "Users can upload podcast audio" ON storage.objects;
CREATE POLICY "Users can upload podcast audio" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'podcast-audio' AND
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view own podcast audio" ON storage.objects;
CREATE POLICY "Users can view own podcast audio" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'podcast-audio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update own podcast audio" ON storage.objects;
CREATE POLICY "Users can update own podcast audio" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'podcast-audio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own podcast audio" ON storage.objects;
CREATE POLICY "Users can delete own podcast audio" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'podcast-audio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Functions for advanced features
CREATE OR REPLACE FUNCTION calculate_content_performance_score(
  content_user_id UUID,
  content_date DATE
) RETURNS INTEGER AS $$
DECLARE
  total_views INTEGER := 0;
  total_engagement INTEGER := 0;
  performance_score INTEGER := 0;
BEGIN
  -- Calculate total views and engagement for the date
  SELECT COALESCE(SUM(metric_value), 0) INTO total_views
  FROM performance_metrics
  WHERE user_id = content_user_id 
    AND metric_date = content_date
    AND metric_type = 'views';
    
  SELECT COALESCE(SUM(metric_value), 0) INTO total_engagement
  FROM performance_metrics
  WHERE user_id = content_user_id 
    AND metric_date = content_date
    AND metric_type IN ('likes', 'shares', 'comments');
    
  -- Calculate performance score (0-100)
  performance_score := LEAST(100, GREATEST(0, 
    (total_views * 0.3 + total_engagement * 0.7) / 100
  ));
  
  RETURN performance_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for competitor alert processing
CREATE OR REPLACE FUNCTION process_competitor_alerts()
RETURNS TABLE(alert_id UUID, event_count INTEGER) AS $$
BEGIN
  -- This function would be called by a scheduled job
  -- to check for new competitor activities and trigger alerts
  
  RETURN QUERY
  SELECT ca.id, COUNT(cae.id)
  FROM competitor_alerts ca
  LEFT JOIN competitor_alert_events cae ON ca.id = cae.alert_id
    AND cae.detected_at >= NOW() - INTERVAL '1 hour'
  WHERE ca.is_active = true
    AND ca.alert_frequency = 'hourly'
  GROUP BY ca.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
