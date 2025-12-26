-- Workflow Engine Persistence Migration
-- Enhances workflow_executions table and adds scheduling/analytics

-- Check if workflow_executions exists, if not create it
CREATE TABLE IF NOT EXISTS workflow_executions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id text NOT NULL,
  conversation_id uuid,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled', 'paused')),
  current_step text,
  step_results jsonb DEFAULT '[]',
  workflow_state jsonb DEFAULT '{}', -- Full workflow state for recovery
  checkpoint_data jsonb DEFAULT '{}', -- Last successful checkpoint
  start_time timestamp with time zone DEFAULT now(),
  end_time timestamp with time zone,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'workflow_executions' AND column_name = 'workflow_state') THEN
    ALTER TABLE workflow_executions ADD COLUMN workflow_state jsonb DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'workflow_executions' AND column_name = 'checkpoint_data') THEN
    ALTER TABLE workflow_executions ADD COLUMN checkpoint_data jsonb DEFAULT '{}';
  END IF;
END $$;

-- Workflow Schedules Table
CREATE TABLE IF NOT EXISTS workflow_schedules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id text NOT NULL,
  schedule_type text NOT NULL CHECK (schedule_type IN ('once', 'daily', 'weekly', 'monthly', 'cron')),
  schedule_config jsonb NOT NULL, -- Cron expression or schedule details
  workflow_params jsonb DEFAULT '{}', -- Parameters to pass to workflow
  enabled boolean DEFAULT true,
  last_run_at timestamp with time zone,
  next_run_at timestamp with time zone,
  run_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Workflow Analytics Table
CREATE TABLE IF NOT EXISTS workflow_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id text NOT NULL,
  execution_id uuid REFERENCES workflow_executions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_ms integer,
  steps_completed integer DEFAULT 0,
  steps_total integer DEFAULT 0,
  tools_executed text[] DEFAULT '{}',
  success boolean DEFAULT false,
  error_type text,
  performance_metrics jsonb DEFAULT '{}', -- Tool execution times, cache hits, etc.
  created_at timestamp with time zone DEFAULT now()
);

-- Workflow Checkpoints Table (for recovery)
CREATE TABLE IF NOT EXISTS workflow_checkpoints (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id uuid REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_id text NOT NULL,
  checkpoint_type text NOT NULL CHECK (checkpoint_type IN ('step_start', 'step_complete', 'manual', 'error_recovery')),
  checkpoint_data jsonb NOT NULL, -- Full state at checkpoint
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_id ON workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_conversation_id ON workflow_executions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_start_time ON workflow_executions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_user_id ON workflow_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_enabled ON workflow_schedules(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_next_run ON workflow_schedules(next_run_at) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_workflow_analytics_workflow_id ON workflow_analytics(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_analytics_user_id ON workflow_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_analytics_created_at ON workflow_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_checkpoints_execution_id ON workflow_checkpoints(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_checkpoints_created_at ON workflow_checkpoints(created_at DESC);

-- Row Level Security
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_checkpoints ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own workflow executions" ON workflow_executions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own workflow schedules" ON workflow_schedules
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own workflow analytics" ON workflow_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert workflow analytics" ON workflow_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage own workflow checkpoints" ON workflow_checkpoints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workflow_executions 
      WHERE id = workflow_checkpoints.execution_id 
      AND user_id = auth.uid()
    )
  );

-- Triggers
CREATE TRIGGER update_workflow_executions_updated_at 
  BEFORE UPDATE ON workflow_executions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_schedules_updated_at 
  BEFORE UPDATE ON workflow_schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to save workflow checkpoint
CREATE OR REPLACE FUNCTION save_workflow_checkpoint(
  p_execution_id uuid,
  p_step_id text,
  p_checkpoint_type text,
  p_checkpoint_data jsonb
) RETURNS void AS $$
BEGIN
  -- Save checkpoint
  INSERT INTO workflow_checkpoints (execution_id, step_id, checkpoint_type, checkpoint_data)
  VALUES (p_execution_id, p_step_id, p_checkpoint_type, p_checkpoint_data);
  
  -- Update execution checkpoint data if it's a step_complete checkpoint
  IF p_checkpoint_type = 'step_complete' THEN
    UPDATE workflow_executions
    SET checkpoint_data = p_checkpoint_data
    WHERE id = p_execution_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resume workflow from checkpoint
CREATE OR REPLACE FUNCTION resume_workflow_from_checkpoint(
  p_execution_id uuid
) RETURNS jsonb AS $$
DECLARE
  checkpoint_record record;
BEGIN
  -- Get latest checkpoint
  SELECT checkpoint_data INTO checkpoint_record
  FROM workflow_checkpoints
  WHERE execution_id = p_execution_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF checkpoint_record IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;
  
  -- Update execution status
  UPDATE workflow_executions
  SET 
    status = 'running',
    workflow_state = checkpoint_record.checkpoint_data,
    updated_at = now()
  WHERE id = p_execution_id;
  
  RETURN checkpoint_record.checkpoint_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record workflow analytics
CREATE OR REPLACE FUNCTION record_workflow_analytics(
  p_workflow_id text,
  p_execution_id uuid,
  p_user_id uuid,
  p_duration_ms integer,
  p_steps_completed integer,
  p_steps_total integer,
  p_tools_executed text[],
  p_success boolean,
  p_error_type text DEFAULT NULL,
  p_performance_metrics jsonb DEFAULT '{}'
) RETURNS void AS $$
BEGIN
  INSERT INTO workflow_analytics (
    workflow_id, execution_id, user_id, duration_ms,
    steps_completed, steps_total, tools_executed,
    success, error_type, performance_metrics
  )
  VALUES (
    p_workflow_id, p_execution_id, p_user_id, p_duration_ms,
    p_steps_completed, p_steps_total, p_tools_executed,
    p_success, p_error_type, p_performance_metrics
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE workflow_executions IS 'Workflow execution records with state persistence';
COMMENT ON TABLE workflow_schedules IS 'Scheduled workflow executions';
COMMENT ON TABLE workflow_analytics IS 'Workflow performance analytics';
COMMENT ON TABLE workflow_checkpoints IS 'Workflow checkpoints for recovery';
COMMENT ON FUNCTION save_workflow_checkpoint IS 'Saves a workflow checkpoint for recovery';
COMMENT ON FUNCTION resume_workflow_from_checkpoint IS 'Resumes a workflow from its latest checkpoint';
COMMENT ON FUNCTION record_workflow_analytics IS 'Records workflow execution analytics';

