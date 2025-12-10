# Supabase Security & Performance Hardening

This document summarizes the security and performance improvements applied to the Supabase database based on advisor recommendations.

## Overview

This hardening effort addresses critical security vulnerabilities and performance issues identified by Supabase advisors, including:
- Row Level Security (RLS) configuration
- Function security hardening
- Index optimization
- Auth configuration recommendations

## Security Improvements

### 1. Row Level Security (RLS)

#### Critical Tables - RLS Enabled
- **agent_documents**: Enabled RLS with policies for authenticated users (read) and service role (full access)
- **aeo_audit_history**: Enabled RLS with user-scoped and admin access policies

#### Tables with Missing Policies - Policies Added
The following tables had RLS enabled but no policies, which has been fixed:

- **analytics_snapshots**: User-scoped access (users can only access their own snapshots)
- **audit_events**: Admin and service role access (public can insert for tracking)
- **audit_leads**: Admin and service role access (public can insert for lead capture)
- **cms_integrations**: User-scoped access
- **link_opportunities**: User-scoped access
- **message_attachments**: User-scoped access (via conversation ownership)
- **outreach_campaigns**: User-scoped access
- **social_connections**: User-scoped access

### 2. RLS Policy Optimization

All RLS policies have been optimized to use `((select auth.uid()))` instead of `auth.uid()` to prevent per-row re-evaluation. This significantly improves query performance by caching the user ID evaluation.

#### Policy Consolidation
Multiple permissive policies have been consolidated where possible:
- **writing_frameworks**: Combined separate policies for custom/global frameworks into unified policies
- **aeo_audits**: Combined user and service role policies
- **content_comments**: Consolidated viewing policies with team-based access
- **schema_markup_templates**: Combined public and private template viewing

### 3. Function Security Hardening

All database functions have been updated with fixed `search_path` to prevent search path injection attacks:

```sql
SET search_path = public, extensions, pg_temp
```

Or for functions accessing auth schema:
```sql
SET search_path = public, auth, pg_temp
```

#### Functions Updated
- `get_user_counts()`
- `get_framework_by_name()`
- `get_ai_usage_timeseries()`
- `calculate_content_performance_score()`
- `process_competitor_alerts()`
- `update_updated_at_column()`
- `get_image_generation_summary()`
- `get_top_models()`
- `match_frameworks()`
- `match_agent_documents_v2()`
- `match_agent_documents()`
- `get_ai_usage_summary()`
- `update_conversation_timestamp()`
- `generate_conversation_title_from_message()`
- `search_similar_learnings()`
- `check_is_admin()`

## Performance Improvements

### 1. Foreign Key Indexes

Indexes have been added for all unindexed foreign keys to improve join performance:

- `aeo_audit_history.audit_id`
- `cms_integrations.user_id`
- `content_approvals.team_id`
- `content_comments.resolved_by`
- `content_quality_reviews.content_version_id`
- `content_repurposing_queue.source_content_id`
- `content_versions.content_id` and `created_by`
- `generated_schema_markup.template_id`
- `library_items.message_id`
- `link_opportunities.user_id`
- `outreach_campaigns.link_opportunity_id` and `user_id`
- `social_connections.user_id`
- `team_members.invited_by`
- `writing_frameworks.user_id`

### 2. Index Cleanup

Duplicate indexes have been removed:
- Removed duplicate indexes on `ai_usage_events.user_id`
- Removed duplicate indexes on `brand_voices.embedding`
- Removed duplicate indexes on `writing_frameworks.embedding`

## Access Patterns

### User-Scoped Tables
These tables use `user_id = ((select auth.uid()))` policies:
- `business_profiles`
- `brand_voices`
- `competitors`
- `keywords`
- `content`
- `chat_messages`
- `notifications`
- `generated_images`
- `cms_integrations`
- `link_opportunities`
- `outreach_campaigns`
- `social_connections`
- `analytics_snapshots`
- `competitor_alerts`
- `video_seo_analysis`
- `podcast_transcriptions`
- `generated_schema_markup`
- `local_seo_profiles`
- `content_repurposing_queue`
- `ai_content_templates`
- `performance_metrics`
- `user_usage_limits`
- `user_usage_monthly`
- `conversations`
- `messages`
- `library_items`
- `content_learnings`
- `content_quality_reviews`
- `content_revision_sessions`

### Team-Scoped Tables
These tables support team-based access:
- `teams`: Owners and team members can view
- `team_members`: Team members can view, admins can manage
- `content_comments`: Users can view comments on content they own or team content
- `content_approvals`: Users can manage approvals for their own content
- `content_versions`: Users can manage versions of their own content

### Admin-Only Tables
These tables restrict access to admins:
- `audit_events`: Admins can view, public can insert
- `audit_leads`: Admins can view, public can insert
- `aeo_leads`: Admins can view

### Public/Global Tables
These tables have special access patterns:
- `writing_frameworks`: Global frameworks are viewable by all authenticated users, custom frameworks are user-scoped
- `schema_markup_templates`: Public templates are viewable by all authenticated users, custom templates are user-scoped
- `ai_content_templates`: Public templates are viewable by all authenticated users, custom templates are user-scoped
- `agent_documents`: All authenticated users can read (for RAG queries)

### Service Role Access
The `service_role` has full access to all tables for backend operations. This is necessary for:
- Background jobs
- Admin operations
- System-level data operations
- API route handlers using service role key

## Auth Configuration

### Recommended Settings

The following Auth settings should be configured in the Supabase Dashboard:

1. **Leaked Password Protection**: Enable to prevent use of compromised passwords
   - Location: Authentication > Policies > Password
   - Reference: [Supabase Auth Security](https://supabase.com/docs/guides/auth/auth-password-security)

2. **MFA Options**: Configure Multi-Factor Authentication based on product requirements
   - TOTP (Time-based One-Time Password): Recommended for high-security accounts
   - WebAuthn: Recommended for passwordless authentication
   - Location: Authentication > Providers > MFA

### Current Configuration

- **Admin Check**: Uses `check_is_admin()` function which checks `auth.users.raw_app_meta_data->>'is_super_admin'` or `auth.users.raw_user_meta_data->>'is_admin'`
- **User Isolation**: All user-scoped tables enforce strict user_id matching
- **Service Role**: Used for backend operations via `SUPABASE_SERVICE_ROLE_KEY`

## Migration Details

The hardening changes are applied via migration:
- **File**: `supabase/migrations/20250106000000_supabase_advisor_fixes.sql`
- **Date**: 2025-01-06
- **Status**: Applied

## Verification

After applying the migration, verify:

1. **RLS Status**: All public tables should have RLS enabled
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename NOT IN (
     SELECT tablename FROM pg_tables t
     JOIN pg_policies p ON t.tablename = p.tablename
   );
   ```

2. **Function Search Path**: All functions should have fixed search_path
   ```sql
   SELECT proname, prosecdef, proconfig 
   FROM pg_proc 
   WHERE pronamespace = 'public'::regnamespace
   AND prosecdef = true
   AND NOT ('search_path' = ANY(proconfig));
   ```

3. **Index Coverage**: All foreign keys should have indexes
   ```sql
   SELECT 
     tc.table_name, 
     kcu.column_name,
     CASE WHEN idx.indexname IS NULL THEN 'MISSING' ELSE 'EXISTS' END as index_status
   FROM information_schema.table_constraints tc
   JOIN information_schema.key_column_usage kcu 
     ON tc.constraint_name = kcu.constraint_name
   LEFT JOIN pg_indexes idx 
     ON idx.tablename = tc.table_name 
     AND idx.indexdef LIKE '%' || kcu.column_name || '%'
   WHERE tc.constraint_type = 'FOREIGN KEY'
   AND tc.table_schema = 'public';
   ```

## Maintenance

### Adding New Tables

When adding new tables:

1. **Enable RLS**: `ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;`
2. **Add Policies**: Use `((select auth.uid()))` pattern for user-scoped access
3. **Index Foreign Keys**: Create indexes on all foreign key columns
4. **Fix Function Search Path**: If creating functions, set `SET search_path = public, extensions, pg_temp`

### Adding New Functions

When creating new functions:

1. **Set Search Path**: Always include `SET search_path = public, extensions, pg_temp` (or include `auth` if needed)
2. **Use SECURITY DEFINER**: Only when necessary, and document why
3. **Schema Qualification**: Prefer explicit schema qualification (`public.table_name`) over relying on search_path

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Performance](https://www.postgresql.org/docs/current/runtime-config-query.html#RUNTIME-CONFIG-QUERY-ENABLE)
- [Supabase Auth Security Best Practices](https://supabase.com/docs/guides/auth/auth-password-security)

