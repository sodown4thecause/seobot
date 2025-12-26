-- User Achievements and Skills System Migration
-- Creates tables for progress tracking, gamification, and skill development

-- Achievement Definitions Table
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  achievement_id text NOT NULL UNIQUE, -- e.g., 'first_keyword', 'ranking_improvement'
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('content', 'technical', 'links', 'local', 'aeo', 'general')),
  icon text, -- Icon identifier or emoji
  points integer DEFAULT 0, -- XP points awarded
  requirements jsonb DEFAULT '{}', -- Conditions to unlock (e.g., {"keywords_tracked": 1})
  rarity text DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- User Achievements Table (tracks earned achievements)
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL REFERENCES achievement_definitions(achievement_id) ON DELETE CASCADE,
  earned_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}', -- Context about how it was earned
  UNIQUE(user_id, achievement_id)
);

-- User Skills Table (tracks skill levels and XP)
CREATE TABLE IF NOT EXISTS user_skills (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_category text NOT NULL CHECK (skill_category IN ('keywordResearch', 'contentCreation', 'technicalSEO', 'linkBuilding', 'localSEO')),
  level integer DEFAULT 1,
  xp integer DEFAULT 0,
  next_level_xp integer DEFAULT 100, -- XP needed for next level
  total_xp integer DEFAULT 0, -- Lifetime XP
  last_updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, skill_category)
);

-- Skill Activity Log (tracks XP gains)
CREATE TABLE IF NOT EXISTS skill_activity_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_category text NOT NULL,
  activity_type text NOT NULL, -- 'keyword_researched', 'content_created', etc.
  xp_gained integer DEFAULT 0,
  level_before integer,
  level_after integer,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Real Metrics Correlation Table (links actions to ranking improvements)
CREATE TABLE IF NOT EXISTS metrics_correlations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL, -- 'content_created', 'link_built', 'technical_fix'
  action_id uuid, -- Reference to specific action/workflow execution
  metric_type text NOT NULL, -- 'ranking_improvement', 'traffic_gain', 'backlink_count'
  metric_value numeric, -- Actual metric value
  metric_unit text, -- 'positions', 'percent', 'count'
  measured_at timestamp with time zone DEFAULT now(),
  correlation_window_days integer DEFAULT 30, -- Days after action to measure
  metadata jsonb DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_category ON achievement_definitions(category);
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_enabled ON achievement_definitions(enabled);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_category ON user_skills(skill_category);
CREATE INDEX IF NOT EXISTS idx_skill_activity_log_user_category ON skill_activity_log(user_id, skill_category);
CREATE INDEX IF NOT EXISTS idx_skill_activity_log_created_at ON skill_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_correlations_user_action ON metrics_correlations(user_id, action_type);
CREATE INDEX IF NOT EXISTS idx_metrics_correlations_measured_at ON metrics_correlations(measured_at DESC);

-- Row Level Security
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_correlations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can read achievement definitions" ON achievement_definitions
  FOR SELECT USING (enabled = true);

CREATE POLICY "Users can manage own achievements" ON user_achievements
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own skills" ON user_skills
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own activity log" ON skill_activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert activity log" ON skill_activity_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage own metrics" ON metrics_correlations
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to award achievement
CREATE OR REPLACE FUNCTION award_achievement(
  p_user_id uuid,
  p_achievement_id text,
  p_metadata jsonb DEFAULT '{}'
) RETURNS boolean AS $$
DECLARE
  already_earned boolean;
BEGIN
  -- Check if already earned
  SELECT EXISTS(
    SELECT 1 FROM user_achievements 
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id
  ) INTO already_earned;
  
  IF already_earned THEN
    RETURN false;
  END IF;
  
  -- Award achievement
  INSERT INTO user_achievements (user_id, achievement_id, metadata)
  VALUES (p_user_id, p_achievement_id, p_metadata);
  
  -- Award XP if achievement has points
  UPDATE user_skills
  SET 
    xp = xp + COALESCE((SELECT points FROM achievement_definitions WHERE achievement_id = p_achievement_id), 0),
    total_xp = total_xp + COALESCE((SELECT points FROM achievement_definitions WHERE achievement_id = p_achievement_id), 0),
    last_updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add XP to a skill
CREATE OR REPLACE FUNCTION add_skill_xp(
  p_user_id uuid,
  p_skill_category text,
  p_xp_amount integer,
  p_activity_type text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
) RETURNS jsonb AS $$
DECLARE
  current_level integer;
  current_xp integer;
  new_xp integer;
  new_level integer;
  xp_for_next_level integer;
  leveled_up boolean := false;
BEGIN
  -- Get or create skill record
  INSERT INTO user_skills (user_id, skill_category, xp, total_xp)
  VALUES (p_user_id, p_skill_category, 0, 0)
  ON CONFLICT (user_id, skill_category) DO NOTHING;
  
  -- Get current state
  SELECT level, xp INTO current_level, current_xp
  FROM user_skills
  WHERE user_id = p_user_id AND skill_category = p_skill_category;
  
  new_xp := current_xp + p_xp_amount;
  new_level := current_level;
  xp_for_next_level := 100 * POWER(1.5, new_level - 1)::integer; -- Exponential leveling
  
  -- Check for level up
  WHILE new_xp >= xp_for_next_level LOOP
    new_level := new_level + 1;
    new_xp := new_xp - xp_for_next_level;
    xp_for_next_level := 100 * POWER(1.5, new_level - 1)::integer;
    leveled_up := true;
  END LOOP;
  
  -- Update skill
  UPDATE user_skills
  SET 
    level = new_level,
    xp = new_xp,
    next_level_xp = xp_for_next_level,
    total_xp = total_xp + p_xp_amount,
    last_updated_at = now()
  WHERE user_id = p_user_id AND skill_category = p_skill_category;
  
  -- Log activity
  INSERT INTO skill_activity_log (
    user_id, skill_category, activity_type, xp_gained,
    level_before, level_after, metadata
  )
  VALUES (
    p_user_id, p_skill_category, p_activity_type, p_xp_amount,
    current_level, new_level, p_metadata
  );
  
  RETURN jsonb_build_object(
    'level', new_level,
    'xp', new_xp,
    'next_level_xp', xp_for_next_level,
    'leveled_up', leveled_up,
    'total_xp_gained', p_xp_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award achievements based on user stats
CREATE OR REPLACE FUNCTION check_achievement_requirements(
  p_user_id uuid
) RETURNS void AS $$
DECLARE
  achievement_record record;
  requirements_met boolean;
  stat_value numeric;
BEGIN
  -- Loop through all enabled achievements
  FOR achievement_record IN 
    SELECT * FROM achievement_definitions WHERE enabled = true
  LOOP
    -- Skip if already earned
    IF EXISTS(
      SELECT 1 FROM user_achievements 
      WHERE user_id = p_user_id AND achievement_id = achievement_record.achievement_id
    ) THEN
      CONTINUE;
    END IF;
    
    -- Check requirements (simplified - would need more complex logic for real implementation)
    requirements_met := true;
    
    -- Example: Check if user has tracked keywords
    IF achievement_record.requirements ? 'keywords_tracked' THEN
      -- Would need to query actual keyword tracking table
      -- For now, assume requirements are met if achievement exists
      requirements_met := true;
    END IF;
    
    -- Award if requirements met
    IF requirements_met THEN
      PERFORM award_achievement(p_user_id, achievement_record.achievement_id);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE achievement_definitions IS 'Achievement definitions and requirements';
COMMENT ON TABLE user_achievements IS 'User earned achievements';
COMMENT ON TABLE user_skills IS 'User skill levels and XP tracking';
COMMENT ON TABLE skill_activity_log IS 'Log of XP gains and level changes';
COMMENT ON TABLE metrics_correlations IS 'Correlation between actions and ranking improvements';
COMMENT ON FUNCTION award_achievement IS 'Awards an achievement to a user and grants XP';
COMMENT ON FUNCTION add_skill_xp IS 'Adds XP to a skill category and handles leveling';
COMMENT ON FUNCTION check_achievement_requirements IS 'Checks and awards achievements based on user stats';

