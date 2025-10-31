-- Phase 6: AI Image Generation Tables
-- Migration for multi-language support and AI-powered image generation

-- Generated Images Table
CREATE TABLE IF NOT EXISTS generated_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text NOT NULL,
  caption text,
  metadata jsonb NOT NULL, -- {prompt, style, size, provider, generated_at}
  storage_path text, -- Supabase storage path
  article_id uuid REFERENCES content(id) ON DELETE SET NULL, -- Link to article if used
  status text DEFAULT 'generated' CHECK (status IN ('generated', 'used', 'archived')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Image Variations Table (for A/B testing)
CREATE TABLE IF NOT EXISTS image_variations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_image_id uuid REFERENCES generated_images(id) ON DELETE CASCADE,
  variation_url text NOT NULL,
  alt_text text NOT NULL,
  metadata jsonb NOT NULL, -- {prompt, style, size, provider}
  performance_metrics jsonb, -- {clicks, views, conversions}
  created_at timestamp with time zone DEFAULT now()
);

-- User Language Preferences
CREATE TABLE IF NOT EXISTS user_language_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferred_language text DEFAULT 'en' NOT NULL CHECK (preferred_language IN ('en', 'es', 'fr', 'de')),
  interface_language text DEFAULT 'en' NOT NULL CHECK (interface_language IN ('en', 'es', 'fr', 'de')),
  content_language text DEFAULT 'en' NOT NULL CHECK (content_language IN ('en', 'es', 'fr', 'de')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- A/B Testing for Images
CREATE TABLE IF NOT EXISTS image_ab_tests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id uuid REFERENCES content(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  variants jsonb NOT NULL, -- [{image_id, url, alt_text, variant_name}]
  traffic_split jsonb NOT NULL, -- {variant_name: percentage}
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  start_date timestamp with time zone DEFAULT now(),
  end_date timestamp with time zone,
  results jsonb, -- {variant_name: {impressions, clicks, conversions, ctr}}
  winner text, -- Winning variant name
  confidence_score numeric, -- Statistical confidence
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Team Collaboration Tables
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  settings jsonb DEFAULT '{}', -- {brand_voice, guidelines, workflows}
  subscription_type text DEFAULT 'free' CHECK (subscription_type IN ('free', 'pro', 'enterprise')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'editor', 'member', 'viewer')),
  permissions jsonb DEFAULT '[]', -- Array of permission strings
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamp with time zone,
  joined_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive')),
  UNIQUE(team_id, user_id)
);

-- Content Comments and Approvals
CREATE TABLE IF NOT EXISTS content_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id uuid REFERENCES content(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  comment_text text NOT NULL,
  comment_type text DEFAULT 'general' CHECK (comment_type IN ('general', 'seo', 'style', 'fact_check', 'approval')),
  parent_comment_id uuid REFERENCES content_comments(id) ON DELETE CASCADE, -- For replies
  resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_approvals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id uuid REFERENCES content(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')),
  approval_level text DEFAULT 'review' CHECK (approval_level IN ('draft', 'review', 'final', 'publish')),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(content_id, user_id, approval_level)
);

-- White Label Settings for Agencies
CREATE TABLE IF NOT EXISTS white_label_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  company_name text NOT NULL,
  logo_url text,
  custom_domain text,
  brand_colors jsonb DEFAULT '{}', -- {primary, secondary, accent}
  custom_css text,
  email_settings jsonb DEFAULT '{}', -- {from_name, from_email, custom_templates}
  feature_flags jsonb DEFAULT '{}', -- {hide_branding, custom_analytics, etc.}
  subscription_plan text DEFAULT 'agency' CHECK (subscription_plan IN ('agency', 'enterprise')),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_generated_images_user ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_article ON generated_images(article_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_status ON generated_images(status);
CREATE INDEX IF NOT EXISTS idx_generated_images_created ON generated_images(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_image_variations_parent ON image_variations(parent_image_id);
CREATE INDEX IF NOT EXISTS idx_image_variations_created ON image_variations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_language_preferences_user ON user_language_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_image_ab_tests_user ON image_ab_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_image_ab_tests_article ON image_ab_tests(article_id);
CREATE INDEX IF NOT EXISTS idx_image_ab_tests_status ON image_ab_tests(status);

CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

CREATE INDEX IF NOT EXISTS idx_content_comments_content ON content_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_user ON content_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_team ON content_comments(team_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_parent ON content_comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_content_approvals_content ON content_approvals(content_id);
CREATE INDEX IF NOT EXISTS idx_content_approvals_user ON content_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_content_approvals_status ON content_approvals(status);

CREATE INDEX IF NOT EXISTS idx_white_label_settings_user ON white_label_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_white_label_settings_team ON white_label_settings(team_id);
CREATE INDEX IF NOT EXISTS idx_white_label_settings_active ON white_label_settings(is_active);

-- Row Level Security
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_language_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Generated Images
CREATE POLICY "Users can view own generated images" ON generated_images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generated images" ON generated_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generated images" ON generated_images
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generated images" ON generated_images
  FOR DELETE USING (auth.uid() = user_id);

-- Image Variations (inherited from parent image ownership)
CREATE POLICY "Users can view own image variations" ON image_variations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM generated_images 
      WHERE id = parent_image_id AND user_id = auth.uid()
    )
  );

-- User Language Preferences
CREATE POLICY "Users can manage own language preferences" ON user_language_preferences
  FOR ALL USING (auth.uid() = user_id);

-- A/B Tests
CREATE POLICY "Users can manage own image ab tests" ON image_ab_tests
  FOR ALL USING (auth.uid() = user_id);

-- Teams
CREATE POLICY "Users can view own teams" ON teams
  FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = teams.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage teams" ON teams
  FOR ALL USING (auth.uid() = owner_id);

-- Team Members
CREATE POLICY "Team members can view team membership" ON team_members
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM team_members tm2
      WHERE tm2.team_id = team_members.team_id 
        AND tm2.user_id = auth.uid()
        AND tm2.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team admins can manage team members" ON team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm2
      WHERE tm2.team_id = team_members.team_id 
        AND tm2.user_id = auth.uid()
        AND tm2.role IN ('owner', 'admin')
    )
  );

-- Content Comments
CREATE POLICY "Users can view relevant content comments" ON content_comments
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM content 
      WHERE id = content_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = content_comments.team_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own comments" ON content_comments
  FOR ALL USING (auth.uid() = user_id);

-- Content Approvals
CREATE POLICY "Users can manage own content approvals" ON content_approvals
  FOR ALL USING (auth.uid() = user_id);

-- White Label Settings
CREATE POLICY "Users can manage own white label settings" ON white_label_settings
  FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_generated_images_updated_at 
  BEFORE UPDATE ON generated_images 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_language_preferences_updated_at 
  BEFORE UPDATE ON user_language_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_image_ab_tests_updated_at 
  BEFORE UPDATE ON image_ab_tests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at 
  BEFORE UPDATE ON teams 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_comments_updated_at 
  BEFORE UPDATE ON content_comments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_approvals_updated_at 
  BEFORE UPDATE ON content_approvals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_white_label_settings_updated_at 
  BEFORE UPDATE ON white_label_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for generated images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for article images
CREATE POLICY "Users can upload article images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'article-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view own article images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'article-images' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR
     starts_with(name, 'generated/'))
  );

CREATE POLICY "Users can update own article images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'article-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own article images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'article-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
