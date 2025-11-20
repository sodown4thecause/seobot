-- Create tables for Content Learning Loop

-- 1. Content Learnings Table
-- Stores individual content generation results and feedback
CREATE TABLE IF NOT EXISTS content_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- blog_post, article, etc.
  topic TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  ai_detection_score FLOAT, -- 0-100 (lower is better)
  human_probability FLOAT, -- 0-100 (higher is better)
  successful BOOLEAN DEFAULT false, -- true if met target score
  techniques_used TEXT[] DEFAULT '{}', -- techniques identified in content
  feedback TEXT, -- unstructured feedback from analysis
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for fast retrieval of similar topics
  CONSTRAINT content_learnings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- 2. Content Best Practices Table
-- Stores aggregated learnings for RAG
CREATE TABLE IF NOT EXISTS content_best_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL UNIQUE, -- One record per content type
  techniques TEXT[] DEFAULT '{}', -- Best performing techniques
  success_rate FLOAT, -- 0-1
  avg_ai_score FLOAT, -- Average AI score of successful content
  sample_size INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE content_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_best_practices ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- content_learnings: Users can insert their own, and read their own
CREATE POLICY "Users can insert their own learnings" ON content_learnings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own learnings" ON content_learnings
    FOR SELECT USING (auth.uid() = user_id);

-- Allow service role to read all learnings (for aggregation)
CREATE POLICY "Service role can read all learnings" ON content_learnings
    FOR SELECT TO service_role USING (true);
    
-- content_best_practices: Public read (for RAG), Service role write (for aggregation)
CREATE POLICY "Everyone can read best practices" ON content_best_practices
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage best practices" ON content_best_practices
    USING (true)
    WITH CHECK (true);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_content_learnings_topic ON content_learnings(topic);
CREATE INDEX IF NOT EXISTS idx_content_learnings_type_success ON content_learnings(content_type, successful);
