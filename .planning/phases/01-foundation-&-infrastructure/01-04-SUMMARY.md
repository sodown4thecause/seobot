---
phase: 01-foundation-&-infrastructure
plan: 04
subsystem: infra
tags: [nextjs, cache-components, cachelife, tanstack-query, upstash-redis, swr]

requires:
  - phase: 01-01
    provides: dashboard_data table for cache-backed dashboard payloads
  - phase: 01-02
    provides: refresh workflow foundation used by stale-while-revalidate flows
provides:
  - Next.js cache profile configuration for dashboard data classes
  - Upstash Redis cache client with key generation, TTL controls, and invalidation helpers
  - Dashboard TanStack Query client + hook-based stale-while-revalidate access pattern
affects: [phase-02-core-dashboards, dashboard-data-hooks, cache-invalidation]

tech-stack:
  added: []
  patterns:
    - three-layer caching (Next.js cache directive + TanStack Query + Redis)
    - data-type TTL mapping for consistency across server and client cache layers

key-files:
  created:
    - lib/cache/redis-client.ts
    - lib/cache/query-client.ts
    - lib/cache/hooks/use-dashboard-data.ts
  modified:
    - next.config.ts
    - app/dashboard/layout.tsx

key-decisions:
  - Keep cache config under next.config experimental fields because current app route segment runtime flags conflict with top-level cacheComponents.
  - Standardize dashboard TTLs across Next.js profiles, Redis constants, and TanStack stale times.

patterns-established:
  - "Cache keys follow dashboard:{userId}:{dataType}:{hash(params)}"
  - "Dashboard layout owns QueryClientProvider scope to avoid conflicts with other app providers"

duration: 16 min
completed: 2026-02-24
---

# Phase 1 Plan 04: Three-Layer Caching Summary

**Next.js cache profiles, Redis dashboard cache primitives, and TanStack Query stale-while-revalidate plumbing are now in place for sub-3s dashboard data loading paths.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-02-24T11:28:20Z
- **Completed:** 2026-02-24T11:44:56Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Added cacheLife profiles for rankings, backlinks, audit, and competitor dashboard data in `next.config.ts`.
- Implemented Upstash Redis dashboard cache client with TTL constants, pattern invalidation, and cache warming helper.
- Added dashboard-scoped TanStack Query client, data-type stale-time helper, and `useDashboardData` hook.
- Wrapped dashboard layout with `QueryClientProvider` to enable SWR data patterns in dashboard UI routes.

## TTL Values by Data Type
- `rankings`: stale 6h / revalidate 12h / expire 24h
- `backlinks`: stale 48h / revalidate 72h / expire 7d
- `audit`: stale 24h / revalidate 48h / expire 72h
- `competitor`: stale 12h / revalidate 24h / expire 48h

## Key Naming Convention
- Redis key format: `dashboard:{userId}:{dataType}:{hash(params)}`
- Parameter hashing uses SHA-256 (truncated) for stable key length and deterministic variants.

## Stale-While-Revalidate Behavior
- Client reads are mediated through TanStack Query with `staleTime` mapped per data type.
- `placeholderData: previousData => previousData` keeps stale data visible while background refetch runs.
- Redis warming helper supports refresh jobs writing fresh values without blocking initial reads.

## Task Commits
1. **Task 1: Configure Next.js 16 'use cache' directive** - `89a444d` (feat)
2. **Task 2: Create Redis cache client with TTL management** - `e1ef4f6` (feat)
3. **Task 3: Setup TanStack Query with stale-while-revalidate** - `6c1c06f` (feat)

## Files Created/Modified
- `next.config.ts` - Added dashboard cache profile configuration.
- `lib/cache/redis-client.ts` - Added Upstash Redis dashboard cache operations and TTL constants.
- `lib/cache/query-client.ts` - Added dashboard query client defaults and stale-time helper.
- `lib/cache/hooks/use-dashboard-data.ts` - Added reusable dashboard SWR query hook.
- `app/dashboard/layout.tsx` - Scoped QueryClientProvider to dashboard routes.

## Decisions Made
- Kept `cacheComponents` / `cacheLife` in `experimental` config because top-level keys break existing route segment runtime configuration across the current codebase.
- Added dashboard query provider at layout scope only to avoid clashing with separate query usage outside dashboard.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npx next build --dry-run` is not supported in this Next.js version; used `npx next build` to validate config parsing instead.
- Full production build did not complete in verification window due unrelated pre-existing project build issues; cache config parsing and TypeScript checks succeeded.

## Authentication Gates

None.

## User Setup Required

External service configuration is still required for Upstash credentials:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Next Phase Readiness
- Caching primitives are ready for dashboard data fetch integrations in Phase 2/3 dashboard implementation plans.
- Cache invalidation APIs and refresh trigger wiring can now use shared redis client + hook patterns.

---
*Phase: 01-foundation-&-infrastructure*
*Completed: 2026-02-24*
