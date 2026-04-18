-- ==========================================================================
-- Neon RLS Migration: public.auth_uid() shim + custom roles + RLS policies
--
-- Strategy (per Neon docs):
--   1. Create public.auth_uid() shim that reads from current_setting
--   2. Create an authenticated_backend role for app queries (enforces RLS)
--   3. Create a neondb_service role for admin/background jobs (bypasses RLS)
--   4. Enable RLS on ALL tables
--   5. Drop existing Supabase policies and recreate for our roles
--   6. neondb_owner keeps BYPASSRLS (for migrations only)
--
-- App code must:
--   - Use DATABASE_AUTHENTICATED_URL (authenticated_backend) for user requests
--   - Use DATABASE_URL (neondb_owner) for migrations/admin only
--   - Call set_config('request.jwt.claims', ...) in a transaction per request
-- ==========================================================================

-- ---------------------------------------------------------------------------
-- STEP 1: RLS helper functions in public schema
-- Neon doesn't have an auth schema like Supabase, so we create these in public.
-- public.auth_uid() reads the Clerk user ID from session variable set by app middleware.
-- Falls back to NULL if not set (RLS policies will deny access).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auth_uid()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT current_setting('request.jwt.claims.sub', true);
$$;

-- Convenience wrapper named public.auth_uid() in public schema for compatibility
-- (We can't create in auth schema on plain Neon, so policies reference public.auth_uid)
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT current_setting('request.jwt.claims.sub', true);
$$;

-- Helper: return full claims as JSONB (for policies that need more than sub)
CREATE OR REPLACE FUNCTION public.auth_jwt()
RETURNS JSONB
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true))::jsonb,
    '{}'::jsonb
  );
$$;

-- ---------------------------------------------------------------------------
-- STEP 2: Create roles
-- authenticated_backend: for app queries, enforces RLS
-- neondb_service: for background jobs, bypasses RLS
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- authenticated_backend role: LOGIN, respects RLS, NO BYPASSRLS
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated_backend') THEN
    CREATE ROLE authenticated_backend WITH LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';
  END IF;

  -- neondb_service role: for webhooks, cron jobs, admin operations
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'neondb_service') THEN
    CREATE ROLE neondb_service WITH LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION' BYPASSRLS;
  END IF;
END;
$$;

-- Grant neondb_owner's schema and table permissions to both roles
GRANT USAGE ON SCHEMA public TO authenticated_backend;
GRANT USAGE ON SCHEMA public TO neondb_service;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated_backend;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO neondb_service;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated_backend;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO neondb_service;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated_backend;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO neondb_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated_backend;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO neondb_service;

-- Force RLS on the authenticated_backend role (belt and suspenders)
ALTER ROLE authenticated_backend FORCE ROW LEVEL SECURITY;

-- neondb_owner keeps BYPASSRLS but we also force RLS on it for defense-in-depth
-- Remove this if you need neondb_owner to bypass RLS for admin operations:
-- ALTER ROLE neondb_owner FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- STEP 3: Enable RLS on ALL tables (idempotent)
-- ---------------------------------------------------------------------------
-- Core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mode_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mode_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roadmap_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_visibility_audits ENABLE ROW LEVEL SECURITY;

-- Phase 6+ tables (may not exist yet)
ALTER TABLE IF EXISTS generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS image_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_language_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS white_label_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS video_seo_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS podcast_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schema_markup_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS generated_schema_markup ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS local_seo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS competitor_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS competitor_alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content_repurposing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS seo_aeo_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content_strategist_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS keyword_researcher_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS competitor_analyst_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS aeo_audit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS example_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_members ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- STEP 4: Drop all existing policies (Supabase ones use public.auth_uid() uuid type)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- STEP 5: Create RLS policies for authenticated_backend role
-- Convention: {table}_{operation}_{scope}
--   "own" = user_id = public.auth_uid() (Clerk ID)
--   "authenticated" = any logged-in user
--   "public_insert" = anyone can insert (lead capture, analytics)
-- ---------------------------------------------------------------------------

-- === users (clerk_id is the user identifier) ===
CREATE POLICY users_select_own ON users FOR SELECT TO authenticated_backend
  USING (clerk_id = public.auth_uid());
CREATE POLICY users_insert_own ON users FOR INSERT TO authenticated_backend
  WITH CHECK (clerk_id = public.auth_uid());
CREATE POLICY users_update_own ON users FOR UPDATE TO authenticated_backend
  USING (clerk_id = public.auth_uid());

-- === business_profiles ===
CREATE POLICY business_profiles_select_own ON business_profiles FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY business_profiles_insert_own ON business_profiles FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY business_profiles_update_own ON business_profiles FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY business_profiles_delete_own ON business_profiles FOR DELETE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === brand_voices ===
CREATE POLICY brand_voices_select_own ON brand_voices FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY brand_voices_insert_own ON brand_voices FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY brand_voices_update_own ON brand_voices FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY brand_voices_delete_own ON brand_voices FOR DELETE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === competitors ===
CREATE POLICY competitors_select_own ON competitors FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY competitors_insert_own ON competitors FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY competitors_update_own ON competitors FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY competitors_delete_own ON competitors FOR DELETE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === user_competitors ===
CREATE POLICY user_competitors_select_own ON user_competitors FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY user_competitors_insert_own ON user_competitors FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY user_competitors_update_own ON user_competitors FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY user_competitors_delete_own ON user_competitors FOR DELETE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === keywords ===
CREATE POLICY keywords_select_own ON keywords FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY keywords_insert_own ON keywords FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY keywords_update_own ON keywords FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY keywords_delete_own ON keywords FOR DELETE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === content ===
CREATE POLICY content_select_own ON content FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY content_insert_own ON content FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY content_update_own ON content FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY content_delete_own ON content FOR DELETE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === content_versions ===
CREATE POLICY content_versions_select_own ON content_versions FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY content_versions_insert_own ON content_versions FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY content_versions_update_own ON content_versions FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === conversations ===
CREATE POLICY conversations_select_own ON conversations FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY conversations_insert_own ON conversations FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY conversations_update_own ON conversations FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY conversations_delete_own ON conversations FOR DELETE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === messages (owned via conversation) ===
CREATE POLICY messages_select_own ON messages FOR SELECT TO authenticated_backend
  USING (conversation_id IN (SELECT id FROM conversations WHERE user_id = public.auth_uid()));
CREATE POLICY messages_insert_own ON messages FOR INSERT TO authenticated_backend
  WITH CHECK (conversation_id IN (SELECT id FROM conversations WHERE user_id = public.auth_uid()));
CREATE POLICY messages_delete_own ON messages FOR DELETE TO authenticated_backend
  USING (conversation_id IN (SELECT id FROM conversations WHERE user_id = public.auth_uid()));

-- === chat_messages ===
CREATE POLICY chat_messages_select_own ON chat_messages FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY chat_messages_insert_own ON chat_messages FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());

-- === library_items ===
CREATE POLICY library_items_select_own ON library_items FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY library_items_insert_own ON library_items FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY library_items_update_own ON library_items FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY library_items_delete_own ON library_items FOR DELETE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === writing_frameworks (global read, admin-only writes) ===
CREATE POLICY writing_frameworks_select_authenticated ON writing_frameworks FOR SELECT TO authenticated_backend
  USING (true);

-- === agent_documents (global read for RAG) ===
CREATE POLICY agent_documents_select_authenticated ON agent_documents FOR SELECT TO authenticated_backend
  USING (true);

-- === content_learnings ===
CREATE POLICY content_learnings_select_own ON content_learnings FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid() OR user_id IS NULL);
CREATE POLICY content_learnings_insert_own ON content_learnings FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid() OR user_id IS NULL);

-- === agent_memory ===
CREATE POLICY agent_memory_select_own ON agent_memory FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY agent_memory_insert_own ON agent_memory FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY agent_memory_update_own ON agent_memory FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY agent_memory_delete_own ON agent_memory FOR DELETE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === user_mode_configs ===
CREATE POLICY user_mode_configs_select_own ON user_mode_configs FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY user_mode_configs_insert_own ON user_mode_configs FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY user_mode_configs_update_own ON user_mode_configs FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === user_mode_transitions ===
CREATE POLICY user_mode_transitions_select_own ON user_mode_transitions FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY user_mode_transitions_insert_own ON user_mode_transitions FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());

-- === user_progress ===
CREATE POLICY user_progress_select_own ON user_progress FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY user_progress_insert_own ON user_progress FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());

-- === ai_usage_events ===
CREATE POLICY ai_usage_events_select_own ON ai_usage_events FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY ai_usage_events_insert_own ON ai_usage_events FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());

-- === user_usage_limits ===
CREATE POLICY user_usage_limits_select_own ON user_usage_limits FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY user_usage_limits_update_own ON user_usage_limits FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === dashboard_data ===
CREATE POLICY dashboard_data_select_own ON dashboard_data FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY dashboard_data_insert_own ON dashboard_data FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY dashboard_data_update_own ON dashboard_data FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY dashboard_data_delete_own ON dashboard_data FOR DELETE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === refresh_jobs ===
CREATE POLICY refresh_jobs_select_own ON refresh_jobs FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY refresh_jobs_insert_own ON refresh_jobs FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY refresh_jobs_update_own ON refresh_jobs FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === job_history ===
CREATE POLICY job_history_select_own ON job_history FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY job_history_insert_own ON job_history FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());

-- === api_usage_events ===
CREATE POLICY api_usage_events_select_own ON api_usage_events FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY api_usage_events_insert_own ON api_usage_events FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());

-- === user_roadmap_progress ===
CREATE POLICY user_roadmap_progress_select_own ON user_roadmap_progress FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY user_roadmap_progress_insert_own ON user_roadmap_progress FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY user_roadmap_progress_update_own ON user_roadmap_progress FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === completed_tasks ===
CREATE POLICY completed_tasks_select_own ON completed_tasks FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY completed_tasks_insert_own ON completed_tasks FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY completed_tasks_delete_own ON completed_tasks FOR DELETE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === notifications ===
CREATE POLICY notifications_select_own ON notifications FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === cms_integrations ===
CREATE POLICY cms_integrations_select_own ON cms_integrations FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY cms_integrations_insert_own ON cms_integrations FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY cms_integrations_update_own ON cms_integrations FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY cms_integrations_delete_own ON cms_integrations FOR DELETE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === link_opportunities ===
CREATE POLICY link_opportunities_select_own ON link_opportunities FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY link_opportunities_insert_own ON link_opportunities FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY link_opportunities_update_own ON link_opportunities FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY link_opportunities_delete_own ON link_opportunities FOR DELETE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === outreach_campaigns ===
CREATE POLICY outreach_campaigns_select_own ON outreach_campaigns FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY outreach_campaigns_insert_own ON outreach_campaigns FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY outreach_campaigns_update_own ON outreach_campaigns FOR UPDATE TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY outreach_campaigns_delete_own ON outreach_campaigns FOR DELETE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === analytics_snapshots ===
CREATE POLICY analytics_snapshots_select_own ON analytics_snapshots FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === social_connections ===
CREATE POLICY social_connections_select_own ON social_connections FOR SELECT TO authenticated_backend
  USING (user_id = public.auth_uid());
CREATE POLICY social_connections_insert_own ON social_connections FOR INSERT TO authenticated_backend
  WITH CHECK (user_id = public.auth_uid());
CREATE POLICY social_connections_delete_own ON social_connections FOR DELETE TO authenticated_backend
  USING (user_id = public.auth_uid());

-- === audit_leads (public insert for lead capture) ===
CREATE POLICY audit_leads_insert ON audit_leads FOR INSERT TO authenticated_backend
  WITH CHECK (true);

-- === audit_events (public insert for analytics) ===
CREATE POLICY audit_events_insert ON audit_events FOR INSERT TO authenticated_backend
  WITH CHECK (true);

-- === ai_visibility_audits (public insert for lead capture) ===
CREATE POLICY ai_visibility_audits_insert ON ai_visibility_audits FOR INSERT TO authenticated_backend
  WITH CHECK (true);

-- === blocked_ips (authenticated read) ===
CREATE POLICY blocked_ips_select_authenticated ON blocked_ips FOR SELECT TO authenticated_backend
  USING (true);