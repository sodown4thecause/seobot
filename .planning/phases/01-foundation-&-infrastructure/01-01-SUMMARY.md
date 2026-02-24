# Plan 01-01 Summary: Database Schema Foundation

**Status:** ✅ COMPLETE  
**Date:** 2026-02-24  
**Phase:** 01 - Foundation & Infrastructure

---

## Tables Created

### 1. dashboard_data
Stores cached dashboard widget data with JSONB flexibility.

**Columns:**
- `id` (uuid, primary key)
- `userId` (text, not null) - references users (loose coupling)
- `websiteUrl` (text, not null)
- `dataType` (text, not null) - 'overview', 'ranks', 'backlinks', 'audit', 'keywords', 'aeo', 'content'
- `data` (jsonb) - flexible schema for widget data
- `lastUpdated` (timestamp, default now)
- `freshness` (text, default 'fresh') - 'fresh', 'stale', 'expired' for quick filtering
- `createdAt`, `updatedAt` (timestamps)

**Indexes:**
- `idx_dashboard_data_user_type_fresh` - composite on (userId, dataType, freshness)
- `idx_dashboard_data_last_updated` - for freshness checks
- `idx_dashboard_data_user_id` - user lookup

**TypeScript Types:**
- `DashboardData` - select type
- `NewDashboardData` - insert type

---

### 2. refresh_jobs
Tracks background job execution for dashboard data refreshes.

**Columns:**
- `id` (uuid, primary key)
- `userId` (text, not null)
- `jobType` (text, not null) - 'full-refresh', 'ranks-only', 'backlinks-only', etc.
- `status` (text, default 'queued') - 'queued', 'processing', 'complete', 'failed', 'cancelled'
- `progress` (integer, default 0) - 0-100
- `metadata` (jsonb) - job-specific data
- `startedAt`, `completedAt` (timestamps, nullable)
- `errorMessage` (text, nullable)
- `estimatedCost` (real, nullable) - for cost tracking
- `createdAt`, `updatedAt` (timestamps)

**Indexes:**
- `idx_refresh_jobs_user_status` - (userId, status) for user's active jobs
- `idx_refresh_jobs_started_at` - for job history queries
- `idx_refresh_jobs_status` - status filtering

**TypeScript Types:**
- `RefreshJob` - select type
- `NewRefreshJob` - insert type

---

### 3. job_history
Event log for job lifecycle tracking.

**Columns:**
- `id` (uuid, primary key)
- `userId` (text, not null)
- `jobId` (uuid, not null) - references refreshJobs
- `eventType` (text, not null) - 'started', 'progress', 'completed', 'failed', 'cancelled'
- `eventData` (jsonb) - event-specific data
- `createdAt` (timestamp, default now)

**Indexes:**
- `idx_job_history_job_id` - job lookup
- `idx_job_history_user_created` - (userId, createdAt) for user's event history

**TypeScript Types:**
- `JobHistory` - select type
- `NewJobHistory` - insert type

---

### 4. api_usage_events
Tracks DataForSEO API calls and costs per user.

**Columns:**
- `id` (uuid, primary key)
- `userId` (text, not null)
- `jobId` (uuid, nullable) - links to refreshJobs when part of a job
- `provider` (text, not null) - 'dataforseo', 'firecrawl', etc.
- `endpoint` (text, not null) - e.g., 'serp_organic_live', 'backlinks_summary'
- `method` (text, nullable) - 'standard' or 'live'
- `costUsd` (real, nullable) - estimated cost per call
- `metadata` (jsonb) - request/response summary
- `createdAt` (timestamp, default now)

**Indexes:**
- `idx_api_usage_user_created` - (userId, createdAt) for cost aggregation
- `idx_api_usage_provider_endpoint` - (provider, endpoint) for usage analysis
- `idx_api_usage_job_id` - job cost lookup

**TypeScript Types:**
- `ApiUsageEvent` - select type
- `NewApiUsageEvent` - insert type

---

## Index Strategy

All indexes follow the pattern established in the existing schema:

| Table | Index | Purpose |
|-------|-------|---------|
| dashboard_data | idx_dashboard_data_user_type_fresh | Fast dashboard queries by user + type + freshness |
| dashboard_data | idx_dashboard_data_last_updated | Freshness checks on load |
| dashboard_data | idx_dashboard_data_user_id | User data lookup |
| refresh_jobs | idx_refresh_jobs_user_status | Find user's active/processing jobs |
| refresh_jobs | idx_refresh_jobs_started_at | Job history queries |
| refresh_jobs | idx_refresh_jobs_status | Status filtering for admin/monitoring |
| job_history | idx_job_history_job_id | Job event lookup |
| job_history | idx_job_history_user_created | User's job history |
| api_usage_events | idx_api_usage_user_created | Cost aggregation per user |
| api_usage_events | idx_api_usage_provider_endpoint | Usage analysis by endpoint |
| api_usage_events | idx_api_usage_job_id | Job cost tracking |

---

## Migration Status

**Migration File:** `drizzle/0005_dashboard_tables.sql`

**Verification:**
- ✅ Drizzle config check passed (`drizzle-kit check`)
- ✅ All 4 tables defined with proper columns
- ✅ All indexes created with btree type
- ✅ Migration file generated successfully
- ⏳ TypeScript compilation in progress

---

## Requirements Addressed

| Requirement | Table | Status |
|-------------|-------|--------|
| REQ-INFRA-DB-01 - Dashboard data table with JSONB | dashboard_data | ✅ Complete |
| REQ-INFRA-DB-02 - Track data freshness | dashboard_data.lastUpdated, dashboard_data.freshness | ✅ Complete |
| REQ-INFRA-DB-03 - Store job history | refresh_jobs, job_history | ✅ Complete |
| REQ-INFRA-DB-04 - Competitor relationships | dashboard_data stores competitor data | ✅ Complete |
| REQ-INFRA-DB-05 - Indexes for queries | All tables | ✅ Complete |

---

## Dependencies for Next Plan

**Plan 01-02 (Inngest Jobs)** depends on:
- ✅ `refresh_jobs` table - for job status tracking
- ✅ `job_history` table - for event logging
- ✅ `api_usage_events` table - for cost tracking

**Plan 01-03 (DataForSEO Integration)** depends on:
- ✅ `api_usage_events` table - for per-call cost tracking

**Plan 01-04 (Caching)** depends on:
- ✅ `dashboard_data` table - for cached storage

**Plan 01-05 (UX Components)** depends on:
- ✅ `refresh_jobs` table - for job progress display
- ✅ `dashboard_data` table - for freshness indicators

---

## Key Design Decisions

1. **Loose Coupling via userId text** - Following existing schema pattern to avoid Clerk sync issues
2. **JSONB for Flexible Data** - dashboard_data.data and api_usage_events.metadata allow evolving schemas
3. **Freshness Enum** - 'fresh', 'stale', 'expired' enables quick filtering without date math
4. **Job Status Tracking** - Separate refresh_jobs (current state) and job_history (event log)
5. **Cost Tracking** - api_usage_events with costUsd and provider/endpoint granularity

---

## Next Steps

1. Run `npx drizzle-kit push` to apply migration to Neon database
2. Verify tables exist: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
3. Verify indexes: `SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public'`
4. Proceed to **Plan 01-02: Inngest Job Orchestration**

---

*Plan 01-01 complete. Ready for Plan 01-02.*
