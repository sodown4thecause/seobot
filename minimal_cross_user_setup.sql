-- Minimal Cross-User Learning System Setup
-- Run this after fixing the embedding issue

-- Create the learning tables
CREATE TABLE IF NOT EXISTS content_learnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    topic TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    ai_detection_score FLOAT,
    human_probability FLOAT,
    successful BOOLEAN DEFAULT false,
    techniques_used TEXT[] DEFAULT '{}',
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_best_practices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL UNIQUE,
    techniques TEXT[] DEFAULT '{}',
    success_rate FLOAT,
    avg_ai_score FLOAT,
    sample_size INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE content_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_best_practices ENABLE ROW LEVEL SECURITY;

-- Create policies for cross-user learning
-- Users can insert their own learnings
CREATE POLICY "Users can insert own learnings" ON content_learnings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own learnings
CREATE POLICY "Users can read own learnings" ON content_learnings
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can read ALL learnings (enables cross-user learning)
CREATE POLICY "Service reads all learnings" ON content_best_practices
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Everyone can read best practices (the aggregated insights)
CREATE POLICY "Public read best practices" ON content_best_practices
    FOR SELECT USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_learnings_success ON content_learnings(content_type, successful);
CREATE INDEX IF NOT EXISTS idx_content_learnings_topic ON content_learnings USING gin(to_tsvector('english', topic));

-- Insert starter data
INSERT INTO content_best_practices (content_type, techniques, success_rate, avg_ai_score, sample_size) 
VALUES 
    ('blog_post', ARRAY['personal_examples', 'rhetorical_questions', 'varied_sentences'], 0.65, 28.5, 5),
    ('article', ARRAY['data_points', 'storytelling', 'subheadings'], 0.70, 26.2, 3)
ON CONFLICT (content_type) DO UPDATE SET
    techniques = EXCLUDED.techniques,
    success_rate = EXCLUDED.success_rate,
    avg_ai_score = EXCLUDED.avg_ai_score,
    sample_size = EXCLUDED.sample_size,
    last_updated = NOW();

SELECT 'Cross-user learning tables ready!' as status;
SELECT content_type, array_length(techniques, 1) as technique_count 
FROM content_best_practices;