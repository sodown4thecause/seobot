-- Add competitor monitoring tables

-- competitor_alerts table
CREATE TABLE IF NOT EXISTS competitor_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_name TEXT NOT NULL,
  competitor_domains TEXT[] NOT NULL,
  target_keywords TEXT[] NOT NULL,
  alert_types TEXT[] NOT NULL,
  notification_channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  alert_frequency TEXT NOT NULL CHECK (alert_frequency IN ('real_time', 'hourly', 'daily', 'weekly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered TIMESTAMPTZ,
  alert_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- competitor_alert_events table
CREATE TABLE IF NOT EXISTS competitor_alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES competitor_alerts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  competitor_domain TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved')),
  notification_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- analytics_snapshots table (extended from original)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_snapshots') THEN
    CREATE TABLE analytics_snapshots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
      competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
      snapshot_date TIMESTAMPTZ NOT NULL DEFAULT now(),
      keyword_rankings JSONB DEFAULT '[]'::jsonb,
      domain_authority INTEGER,
      backlink_count INTEGER,
      referring_domains INTEGER,
      organic_traffic INTEGER,
      top_pages JSONB DEFAULT '[]'::jsonb,
      content_summary JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Add missing columns to notifications table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'severity') THEN
    ALTER TABLE notifications ADD COLUMN severity TEXT DEFAULT 'medium';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'data') THEN
    ALTER TABLE notifications ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add tracked_keywords column to competitors table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitors' AND column_name = 'tracked_keywords') THEN
    ALTER TABLE competitors ADD COLUMN tracked_keywords TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_competitor_alerts_user_id ON competitor_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_alerts_is_active ON competitor_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_competitor_alert_events_alert_id ON competitor_alert_events(alert_id);
CREATE INDEX IF NOT EXISTS idx_competitor_alert_events_status ON competitor_alert_events(status);
CREATE INDEX IF NOT EXISTS idx_competitor_alert_events_detected_at ON competitor_alert_events(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_business_profile_id ON analytics_snapshots(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_competitor_id ON analytics_snapshots(competitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_snapshot_date ON analytics_snapshots(snapshot_date DESC);

-- Enable Row Level Security
ALTER TABLE competitor_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitor_alerts
CREATE POLICY "Users can view their own alerts"
  ON competitor_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts"
  ON competitor_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON competitor_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON competitor_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for competitor_alert_events
CREATE POLICY "Users can view events for their alerts"
  ON competitor_alert_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM competitor_alerts
      WHERE competitor_alerts.id = competitor_alert_events.alert_id
      AND competitor_alerts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update events for their alerts"
  ON competitor_alert_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM competitor_alerts
      WHERE competitor_alerts.id = competitor_alert_events.alert_id
      AND competitor_alerts.user_id = auth.uid()
    )
  );

-- RLS Policies for analytics_snapshots
CREATE POLICY "Users can view snapshots for their business profiles"
  ON analytics_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = analytics_snapshots.business_profile_id
      AND business_profiles.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for competitor_alerts
CREATE TRIGGER update_competitor_alerts_updated_at
  BEFORE UPDATE ON competitor_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE competitor_alerts IS 'User-configured competitor monitoring alerts';
COMMENT ON TABLE competitor_alert_events IS 'Detected competitor activity events';
COMMENT ON TABLE analytics_snapshots IS 'Periodic snapshots of competitor metrics for trend analysis';
