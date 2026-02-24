CREATE TABLE IF NOT EXISTS dashboard_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    website_url text NOT NULL,
    data_type text NOT NULL,
    data jsonb,
    last_updated timestamp DEFAULT now() NOT NULL,
    freshness text DEFAULT 'fresh' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    job_type text NOT NULL,
    status text DEFAULT 'queued' NOT NULL,
    progress integer DEFAULT 0,
    metadata jsonb,
    started_at timestamp,
    completed_at timestamp,
    error_message text,
    estimated_cost real,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS job_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    job_id uuid NOT NULL,
    event_type text NOT NULL,
    event_data jsonb,
    created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS api_usage_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    job_id uuid,
    provider text NOT NULL,
    endpoint text NOT NULL,
    method text,
    cost_usd real,
    metadata jsonb,
    created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS user_competitors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    competitor_id uuid NOT NULL,
    website_url text NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dashboard_data_user_type_fresh ON dashboard_data (user_id, data_type, freshness);
CREATE INDEX IF NOT EXISTS idx_dashboard_data_last_updated ON dashboard_data (last_updated);
CREATE INDEX IF NOT EXISTS idx_dashboard_data_user_id ON dashboard_data (user_id);

CREATE INDEX IF NOT EXISTS idx_refresh_jobs_user_status ON refresh_jobs (user_id, status);
CREATE INDEX IF NOT EXISTS idx_refresh_jobs_started_at ON refresh_jobs (started_at);
CREATE INDEX IF NOT EXISTS idx_refresh_jobs_status ON refresh_jobs (status);

CREATE INDEX IF NOT EXISTS idx_job_history_job_id ON job_history (job_id);
CREATE INDEX IF NOT EXISTS idx_job_history_user_created ON job_history (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_created ON api_usage_events (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_provider_endpoint ON api_usage_events (provider, endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_job_id ON api_usage_events (job_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_competitors_user_competitor_unique ON user_competitors (user_id, competitor_id);
CREATE INDEX IF NOT EXISTS idx_user_competitors_user_website ON user_competitors (user_id, website_url);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'user_competitors_user_id_users_id_fk'
    ) THEN
        ALTER TABLE user_competitors
            ADD CONSTRAINT user_competitors_user_id_users_id_fk
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'user_competitors_competitor_id_competitors_id_fk'
    ) THEN
        ALTER TABLE user_competitors
            ADD CONSTRAINT user_competitors_competitor_id_competitors_id_fk
            FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE;
    END IF;
END $$;
