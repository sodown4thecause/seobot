-- Migration: Add Campaign Analytics Columns to Workflow Executions
-- Enables tracking of campaign performance metrics for instant campaigns

-- Add campaign-specific columns to workflow_executions
DO $$ 
BEGIN
  -- Campaign type (instant-rank-keyword, instant-beat-competitor, etc.)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'workflow_executions' AND column_name = 'campaign_type') THEN
    ALTER TABLE workflow_executions ADD COLUMN campaign_type TEXT;
  END IF;

  -- Target keyword for SEO campaigns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'workflow_executions' AND column_name = 'target_keyword') THEN
    ALTER TABLE workflow_executions ADD COLUMN target_keyword TEXT;
  END IF;

  -- Execution speed in seconds (for "3-minute promise" tracking)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'workflow_executions' AND column_name = 'speed_seconds') THEN
    ALTER TABLE workflow_executions ADD COLUMN speed_seconds INTEGER;
  END IF;

  -- Quality score from optimization tools (Frase, etc.)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'workflow_executions' AND column_name = 'quality_score') THEN
    ALTER TABLE workflow_executions ADD COLUMN quality_score DECIMAL(5,2);
  END IF;

  -- Content word count (for comparison with competitors)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'workflow_executions' AND column_name = 'content_word_count') THEN
    ALTER TABLE workflow_executions ADD COLUMN content_word_count INTEGER;
  END IF;

  -- Optimization score (0-100 scale)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'workflow_executions' AND column_name = 'optimization_score') THEN
    ALTER TABLE workflow_executions ADD COLUMN optimization_score INTEGER CHECK (optimization_score >= 0 AND optimization_score <= 100);
  END IF;

  -- Images generated count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'workflow_executions' AND column_name = 'images_generated') THEN
    ALTER TABLE workflow_executions ADD COLUMN images_generated INTEGER DEFAULT 0;
  END IF;

  -- Competitor URL (for beat-competitor campaigns)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'workflow_executions' AND column_name = 'competitor_url') THEN
    ALTER TABLE workflow_executions ADD COLUMN competitor_url TEXT;
  END IF;

  -- AEO optimized flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'workflow_executions' AND column_name = 'aeo_optimized') THEN
    ALTER TABLE workflow_executions ADD COLUMN aeo_optimized BOOLEAN DEFAULT false;
  END IF;

  -- Citation target flag (for citation capture campaigns)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'workflow_executions' AND column_name = 'citation_target') THEN
    ALTER TABLE workflow_executions ADD COLUMN citation_target BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add indexes for campaign analytics queries
CREATE INDEX IF NOT EXISTS idx_workflow_executions_campaign_type ON workflow_executions(campaign_type);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_target_keyword ON workflow_executions(target_keyword);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_speed ON workflow_executions(speed_seconds);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_quality ON workflow_executions(quality_score DESC) WHERE quality_score IS NOT NULL;

-- Add index for campaign performance queries (user + campaign type + time)
CREATE INDEX IF NOT EXISTS idx_workflow_executions_campaign_analytics 
  ON workflow_executions(user_id, campaign_type, start_time DESC) 
  WHERE campaign_type IS NOT NULL;

-- Function to calculate and update speed_seconds automatically
CREATE OR REPLACE FUNCTION calculate_workflow_speed()
RETURNS TRIGGER AS $$
BEGIN
  -- When workflow completes or fails, calculate speed
  IF NEW.status IN ('completed', 'failed') AND NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.speed_seconds := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate speed
DROP TRIGGER IF EXISTS trigger_calculate_workflow_speed ON workflow_executions;
CREATE TRIGGER trigger_calculate_workflow_speed
  BEFORE UPDATE OF status, end_time ON workflow_executions
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'failed') AND NEW.end_time IS NOT NULL)
  EXECUTE FUNCTION calculate_workflow_speed();

-- View for campaign performance analytics
CREATE OR REPLACE VIEW campaign_performance_summary AS
SELECT 
  user_id,
  campaign_type,
  COUNT(*) as total_runs,
  AVG(speed_seconds) as avg_speed_seconds,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY speed_seconds) as median_speed_seconds,
  MIN(speed_seconds) as min_speed_seconds,
  MAX(speed_seconds) as max_speed_seconds,
  AVG(quality_score) as avg_quality_score,
  AVG(optimization_score) as avg_optimization_score,
  AVG(content_word_count) as avg_word_count,
  SUM(images_generated) as total_images_generated,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_runs,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_runs,
  (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*) * 100) as success_rate,
  COUNT(*) FILTER (WHERE speed_seconds <= 180 AND status = 'completed') as runs_under_3_min,
  (COUNT(*) FILTER (WHERE speed_seconds <= 180 AND status = 'completed')::DECIMAL / 
   NULLIF(COUNT(*) FILTER (WHERE status = 'completed'), 0) * 100) as pct_under_3_min,
  MAX(start_time) as last_run_at
FROM workflow_executions
WHERE campaign_type IS NOT NULL
GROUP BY user_id, campaign_type;

COMMENT ON VIEW campaign_performance_summary IS 'Aggregated campaign performance metrics for analytics dashboard';

-- View for daily campaign trends
CREATE OR REPLACE VIEW campaign_daily_trends AS
SELECT 
  user_id,
  campaign_type,
  DATE(start_time) as date,
  COUNT(*) as runs,
  AVG(speed_seconds) as avg_speed,
  AVG(quality_score) as avg_quality,
  COUNT(*) FILTER (WHERE status = 'completed') as successful,
  COUNT(*) FILTER (WHERE speed_seconds <= 180 AND status = 'completed') as under_3_min
FROM workflow_executions
WHERE campaign_type IS NOT NULL
GROUP BY user_id, campaign_type, DATE(start_time)
ORDER BY date DESC;

COMMENT ON VIEW campaign_daily_trends IS 'Daily campaign performance trends for time-series charts';

-- Function to get campaign stats for a user
CREATE OR REPLACE FUNCTION get_user_campaign_stats(p_user_id UUID)
RETURNS TABLE (
  campaign_type TEXT,
  total_runs BIGINT,
  avg_speed_seconds NUMERIC,
  success_rate NUMERIC,
  pct_under_3_min NUMERIC,
  avg_quality_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cps.campaign_type,
    cps.total_runs,
    ROUND(cps.avg_speed_seconds, 1) as avg_speed_seconds,
    ROUND(cps.success_rate, 1) as success_rate,
    ROUND(cps.pct_under_3_min, 1) as pct_under_3_min,
    ROUND(cps.avg_quality_score, 1) as avg_quality_score
  FROM campaign_performance_summary cps
  WHERE cps.user_id = p_user_id
  ORDER BY cps.total_runs DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_campaign_stats IS 'Get campaign performance statistics for a specific user';

-- Comments
COMMENT ON COLUMN workflow_executions.campaign_type IS 'Type of instant campaign (instant-rank-keyword, instant-beat-competitor, etc.)';
COMMENT ON COLUMN workflow_executions.target_keyword IS 'Target keyword for SEO campaigns';
COMMENT ON COLUMN workflow_executions.speed_seconds IS 'Execution time in seconds (for "3-minute promise" tracking)';
COMMENT ON COLUMN workflow_executions.quality_score IS 'Content quality score from optimization tools (0-100)';
COMMENT ON COLUMN workflow_executions.optimization_score IS 'SEO optimization score (0-100)';
COMMENT ON COLUMN workflow_executions.images_generated IS 'Number of images generated in campaign';
COMMENT ON COLUMN workflow_executions.aeo_optimized IS 'Whether content is optimized for AI citations';
COMMENT ON COLUMN workflow_executions.citation_target IS 'Whether this is a citation capture campaign';
