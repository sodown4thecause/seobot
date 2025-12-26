-- User Mode System Migration
-- Creates tables and functions for the user experience mode system

-- User Mode Configurations Table
CREATE TABLE IF NOT EXISTS user_mode_configs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_mode text NOT NULL DEFAULT 'beginner' CHECK (current_mode IN ('beginner', 'practitioner', 'agency')),
  preferences jsonb NOT NULL DEFAULT '{
    "showTutorials": true,
    "jargonTooltips": true,
    "progressTracking": true,
    "batchOperations": false,
    "dataVisualization": "simple",
    "workflowComplexity": "guided"
  }',
  customizations jsonb NOT NULL DEFAULT '{
    "dashboardLayout": [],
    "hiddenFeatures": [],
    "pinnedTools": []
  }',
  onboarding_completed jsonb NOT NULL DEFAULT '{
    "beginner": false,
    "practitioner": false,
    "agency": false
  }',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- User Mode Transitions Log (for analytics and validation)
CREATE TABLE IF NOT EXISTS user_mode_transitions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  from_mode text CHECK (from_mode IN ('beginner', 'practitioner', 'agency')),
  to_mode text NOT NULL CHECK (to_mode IN ('beginner', 'practitioner', 'agency')),
  transition_reason text,
  requirements_met jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- User Progress Tracking (for mode transition validation)
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL, -- 'tutorial', 'milestone', 'usage'
  item_key text NOT NULL, -- specific tutorial/milestone identifier
  completed_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  UNIQUE(user_id, category, item_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_mode_configs_user_id ON user_mode_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mode_configs_mode ON user_mode_configs(current_mode);
CREATE INDEX IF NOT EXISTS idx_user_mode_transitions_user_id ON user_mode_transitions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mode_transitions_created ON user_mode_transitions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_category ON user_progress(category, item_key);

-- Row Level Security
ALTER TABLE user_mode_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mode_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own mode config" ON user_mode_configs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own mode transitions" ON user_mode_transitions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mode transitions" ON user_mode_transitions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_user_mode_configs_updated_at 
  BEFORE UPDATE ON user_mode_configs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate mode transitions
CREATE OR REPLACE FUNCTION validate_mode_transition(
  p_user_id uuid,
  p_from_mode text,
  p_to_mode text
) RETURNS boolean AS $$
DECLARE
  user_days_active integer;
  completed_tutorials text[];
  achieved_milestones text[];
BEGIN
  -- Allow same mode (no-op)
  IF p_from_mode = p_to_mode THEN
    RETURN true;
  END IF;

  -- Allow downgrading without restrictions
  IF (p_from_mode = 'practitioner' AND p_to_mode = 'beginner') OR
     (p_from_mode = 'agency' AND p_to_mode IN ('beginner', 'practitioner')) THEN
    RETURN true;
  END IF;

  -- Get user activity metrics
  SELECT 
    EXTRACT(days FROM (now() - min(created_at)))::integer
  INTO user_days_active
  FROM user_progress 
  WHERE user_id = p_user_id;

  -- Get completed tutorials
  SELECT array_agg(item_key)
  INTO completed_tutorials
  FROM user_progress
  WHERE user_id = p_user_id AND category = 'tutorial';

  -- Get achieved milestones
  SELECT array_agg(item_key)
  INTO achieved_milestones
  FROM user_progress
  WHERE user_id = p_user_id AND category = 'milestone';

  -- Validate beginner -> practitioner transition
  IF p_from_mode = 'beginner' AND p_to_mode = 'practitioner' THEN
    RETURN (
      COALESCE(user_days_active, 0) >= 7 AND
      COALESCE(array_length(completed_tutorials, 1), 0) >= 2 AND
      COALESCE(array_length(achieved_milestones, 1), 0) >= 2
    );
  END IF;

  -- Validate practitioner -> agency transition
  IF p_from_mode = 'practitioner' AND p_to_mode = 'agency' THEN
    RETURN (
      COALESCE(user_days_active, 0) >= 30 AND
      COALESCE(array_length(completed_tutorials, 1), 0) >= 4 AND
      COALESCE(array_length(achieved_milestones, 1), 0) >= 4
    );
  END IF;

  -- Validate beginner -> agency transition (skip practitioner)
  IF p_from_mode = 'beginner' AND p_to_mode = 'agency' THEN
    RETURN (
      COALESCE(user_days_active, 0) >= 30 AND
      COALESCE(array_length(completed_tutorials, 1), 0) >= 6 AND
      COALESCE(array_length(achieved_milestones, 1), 0) >= 6
    );
  END IF;

  -- Default: disallow transition
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log mode transitions
CREATE OR REPLACE FUNCTION log_mode_transition() RETURNS trigger AS $$
BEGIN
  -- Only log if mode actually changed
  IF OLD.current_mode IS DISTINCT FROM NEW.current_mode THEN
    INSERT INTO user_mode_transitions (
      user_id,
      from_mode,
      to_mode,
      transition_reason
    ) VALUES (
      NEW.user_id,
      OLD.current_mode,
      NEW.current_mode,
      'user_initiated'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically log mode transitions
CREATE TRIGGER log_user_mode_transitions
  AFTER UPDATE ON user_mode_configs
  FOR EACH ROW EXECUTE FUNCTION log_mode_transition();

-- Function to track user progress
CREATE OR REPLACE FUNCTION track_user_progress(
  p_user_id uuid,
  p_category text,
  p_item_key text,
  p_metadata jsonb DEFAULT '{}'
) RETURNS void AS $$
BEGIN
  INSERT INTO user_progress (user_id, category, item_key, metadata)
  VALUES (p_user_id, p_category, p_item_key, p_metadata)
  ON CONFLICT (user_id, category, item_key) 
  DO UPDATE SET 
    completed_at = now(),
    metadata = p_metadata;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE user_mode_configs IS 'User experience mode configurations and preferences';
COMMENT ON TABLE user_mode_transitions IS 'Log of user mode transitions for analytics';
COMMENT ON TABLE user_progress IS 'User progress tracking for tutorials, milestones, and usage metrics';
COMMENT ON FUNCTION validate_mode_transition IS 'Validates if a user can transition between experience modes';
COMMENT ON FUNCTION track_user_progress IS 'Tracks user progress for tutorials and milestones';