-- Tutorial Progress System Migration
-- Creates tables for interactive tutorial system with progress tracking

-- Tutorial Definitions Table (stores tutorial metadata)
CREATE TABLE IF NOT EXISTS tutorial_definitions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutorial_id text NOT NULL UNIQUE, -- e.g., 'seo-fundamentals-101'
  title text NOT NULL,
  description text,
  difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_time text, -- e.g., '15 minutes'
  prerequisites text[] DEFAULT '{}',
  linked_workflow text, -- Optional workflow ID this tutorial links to
  outcomes jsonb DEFAULT '[]', -- Learning outcomes array
  steps jsonb NOT NULL DEFAULT '[]', -- Tutorial steps configuration
  enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tutorial Progress Table (tracks user progress through tutorials)
CREATE TABLE IF NOT EXISTS tutorial_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_id text NOT NULL REFERENCES tutorial_definitions(tutorial_id) ON DELETE CASCADE,
  current_step_index integer DEFAULT 0,
  completed_steps jsonb DEFAULT '[]', -- Array of completed step IDs
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  last_accessed_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}', -- Store quiz answers, demo results, etc.
  UNIQUE(user_id, tutorial_id)
);

-- Tutorial Step Completions (detailed tracking per step)
CREATE TABLE IF NOT EXISTS tutorial_step_completions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_id text NOT NULL,
  step_id text NOT NULL,
  step_index integer NOT NULL,
  completed_at timestamp with time zone DEFAULT now(),
  quiz_score float, -- 0-100 if step has quiz
  demo_executed boolean DEFAULT false,
  time_spent_seconds integer,
  metadata jsonb DEFAULT '{}',
  UNIQUE(user_id, tutorial_id, step_id)
);

-- Tutorial Milestones (achievements for completing tutorials)
CREATE TABLE IF NOT EXISTS tutorial_milestones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type text NOT NULL, -- 'tutorial_completed', 'step_completed', 'quiz_perfect'
  tutorial_id text,
  step_id text,
  achieved_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  UNIQUE(user_id, milestone_type, tutorial_id, step_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tutorial_definitions_tutorial_id ON tutorial_definitions(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_definitions_difficulty ON tutorial_definitions(difficulty);
CREATE INDEX IF NOT EXISTS idx_tutorial_definitions_enabled ON tutorial_definitions(enabled);
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_user_id ON tutorial_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_tutorial_id ON tutorial_progress(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_completed ON tutorial_progress(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tutorial_step_completions_user_tutorial ON tutorial_step_completions(user_id, tutorial_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_milestones_user_id ON tutorial_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_milestones_type ON tutorial_milestones(milestone_type);

-- Row Level Security
ALTER TABLE tutorial_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_step_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can read tutorial definitions" ON tutorial_definitions
  FOR SELECT USING (enabled = true);

CREATE POLICY "Users can manage own tutorial progress" ON tutorial_progress
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own step completions" ON tutorial_step_completions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own milestones" ON tutorial_milestones
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_tutorial_definitions_updated_at 
  BEFORE UPDATE ON tutorial_definitions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutorial_progress_last_accessed 
  BEFORE UPDATE ON tutorial_progress 
  FOR EACH ROW 
  WHEN (OLD.current_step_index IS DISTINCT FROM NEW.current_step_index)
  EXECUTE FUNCTION update_updated_at_column();

-- Function to mark tutorial as completed
CREATE OR REPLACE FUNCTION complete_tutorial(
  p_user_id uuid,
  p_tutorial_id text
) RETURNS void AS $$
DECLARE
  total_steps integer;
  completed_count integer;
BEGIN
  -- Get total steps from tutorial definition
  SELECT jsonb_array_length(steps) INTO total_steps
  FROM tutorial_definitions
  WHERE tutorial_id = p_tutorial_id;
  
  -- Get completed steps count
  SELECT jsonb_array_length(completed_steps) INTO completed_count
  FROM tutorial_progress
  WHERE user_id = p_user_id AND tutorial_id = p_tutorial_id;
  
  -- Mark as completed if all steps done
  IF completed_count >= total_steps THEN
    UPDATE tutorial_progress
    SET completed_at = now()
    WHERE user_id = p_user_id AND tutorial_id = p_tutorial_id;
    
    -- Create milestone
    INSERT INTO tutorial_milestones (user_id, milestone_type, tutorial_id)
    VALUES (p_user_id, 'tutorial_completed', p_tutorial_id)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record step completion
CREATE OR REPLACE FUNCTION record_tutorial_step(
  p_user_id uuid,
  p_tutorial_id text,
  p_step_id text,
  p_step_index integer,
  p_quiz_score float DEFAULT NULL,
  p_demo_executed boolean DEFAULT false,
  p_time_spent_seconds integer DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
) RETURNS void AS $$
BEGIN
  -- Record step completion
  INSERT INTO tutorial_step_completions (
    user_id, tutorial_id, step_id, step_index,
    quiz_score, demo_executed, time_spent_seconds, metadata
  )
  VALUES (
    p_user_id, p_tutorial_id, p_step_id, p_step_index,
    p_quiz_score, p_demo_executed, p_time_spent_seconds, p_metadata
  )
  ON CONFLICT (user_id, tutorial_id, step_id) 
  DO UPDATE SET
    completed_at = now(),
    quiz_score = COALESCE(EXCLUDED.quiz_score, tutorial_step_completions.quiz_score),
    demo_executed = EXCLUDED.demo_executed OR tutorial_step_completions.demo_executed,
    time_spent_seconds = COALESCE(EXCLUDED.time_spent_seconds, tutorial_step_completions.time_spent_seconds),
    metadata = tutorial_step_completions.metadata || EXCLUDED.metadata;
  
  -- Update tutorial progress
  UPDATE tutorial_progress
  SET 
    current_step_index = GREATEST(current_step_index, p_step_index + 1),
    completed_steps = completed_steps || jsonb_build_array(p_step_id),
    last_accessed_at = now()
  WHERE user_id = p_user_id AND tutorial_id = p_tutorial_id;
  
  -- Check if tutorial is complete
  PERFORM complete_tutorial(p_user_id, p_tutorial_id);
  
  -- Create milestone for step completion
  INSERT INTO tutorial_milestones (user_id, milestone_type, tutorial_id, step_id)
  VALUES (p_user_id, 'step_completed', p_tutorial_id, p_step_id)
  ON CONFLICT DO NOTHING;
  
  -- Create milestone for perfect quiz score
  IF p_quiz_score IS NOT NULL AND p_quiz_score = 100 THEN
    INSERT INTO tutorial_milestones (user_id, milestone_type, tutorial_id, step_id)
    VALUES (p_user_id, 'quiz_perfect', p_tutorial_id, p_step_id)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE tutorial_definitions IS 'Tutorial definitions and metadata';
COMMENT ON TABLE tutorial_progress IS 'User progress through tutorials';
COMMENT ON TABLE tutorial_step_completions IS 'Detailed step completion tracking';
COMMENT ON TABLE tutorial_milestones IS 'Tutorial-related achievements and milestones';
COMMENT ON FUNCTION complete_tutorial IS 'Marks a tutorial as completed when all steps are done';
COMMENT ON FUNCTION record_tutorial_step IS 'Records completion of a tutorial step with optional quiz/demo data';

