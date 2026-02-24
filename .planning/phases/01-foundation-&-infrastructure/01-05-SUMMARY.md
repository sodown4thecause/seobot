---
phase: 01-foundation-&-infrastructure
plan: 05
status: completed
completed: 2026-02-24
duration: 00:54:00
subsystem: dashboard-ux
tags:
  - nextjs
  - clerk
  - sse
  - dashboard
  - inngest
requires:
  - 01-02
  - 01-04
provides:
  - Dashboard sidebar with 8 dashboard links
  - Breadcrumbs and header controls for dashboard pages
  - Freshness badge + refresh trigger UX
  - SSE job progress stream and client hook
affects:
  - 02-core-dashboards
  - 03-advanced-intelligence
tech-stack:
  added:
    - "none"
  patterns:
    - "SSE polling stream from API route to EventSource hook"
    - "Header-level refresh controls tied to background jobs"
key-files:
  created:
    - components/dashboard/breadcrumbs.tsx
    - components/dashboard/freshness-indicator.tsx
    - components/dashboard/refresh-button.tsx
    - components/dashboard/job-progress.tsx
    - components/dashboard/index.ts
    - lib/hooks/use-freshness.ts
    - lib/hooks/use-job-status.ts
    - app/api/jobs/refresh/route.ts
    - app/api/jobs/sse/route.ts
    - app/api/jobs/cancel/route.ts
    - types/opossum.d.ts
  modified:
    - components/dashboard/sidebar.tsx
    - app/dashboard/layout.tsx
    - lib/dataforseo/circuit-breaker.ts
    - lib/jobs/inngest-client.ts
decisions:
  - "Use cookie-authenticated same-origin EventSource for job updates; no token query params required."
  - "Enforce one active SSE connection per user in-memory to reduce duplicate polling load."
  - "Keep refresh trigger server-mediated via /api/jobs/refresh to avoid exposing Inngest client on the browser."
---

# Phase 01 Plan 05: Dashboard UX and SSE Summary

Dashboard UX now includes persistent navigation, page breadcrumbs, freshness status cues, and real-time job progress streaming so users can refresh data with visible state transitions instead of waiting on opaque background work.

## Task Commits

1. `8f73408` - sidebar navigation + breadcrumbs
2. `7f72b4f` - freshness logic + refresh trigger
3. `32bcffa` - SSE stream, job progress UI, layout integration

## Component Inventory

- `components/dashboard/sidebar.tsx`: 8 dashboard links with icons, active-link highlighting, desktop collapse and mobile collapsible drawer.
- `components/dashboard/breadcrumbs.tsx`: `Home > Dashboard > [Current Page]` breadcrumbs.
- `components/dashboard/freshness-indicator.tsx`: color-coded freshness badge with exact timestamp tooltip.
- `components/dashboard/refresh-button.tsx`: authenticated refresh trigger with loading/completion states.
- `components/dashboard/job-progress.tsx`: SSE-backed progress bar, status text, cancel button, auto-hide after completion.
- `app/dashboard/layout.tsx`: integrates sidebar + breadcrumb header + refresh + progress controls.

## SSE Architecture

1. User starts refresh via `POST /api/jobs/refresh`.
2. Server route resolves user + website context and emits `dashboard/refresh.requested` through Inngest.
3. Client hook `useJobStatus` opens `EventSource('/api/jobs/sse')`.
4. `GET /api/jobs/sse` polls `refresh_jobs` every 2s and emits `text/event-stream` updates.
5. `JobProgress` renders streaming status/progress and can call `POST /api/jobs/cancel`.

## Freshness Calculation Logic

- `<24h` => `fresh` (`text-green-500`)
- `24-48h` => `stale` (`text-yellow-500`)
- `>48h` => `expired` (`text-red-500`)
- Output shape from hook: `{ freshness, hoursAgo, color }`

## Verification Executed

- `npx tsc --noEmit`
- `npx tsc --noEmit && ls -la components/dashboard/sidebar.tsx components/dashboard/breadcrumbs.tsx`
- `npx tsc --noEmit && grep -E "freshness|lastUpdated" components/dashboard/freshness-indicator.tsx`
- `npx tsc --noEmit && grep -l "EventSource\|text/event-stream" app/api/jobs/sse/route.ts lib/hooks/use-job-status.ts`
- `npx tsc --noEmit && ls components/dashboard/*.tsx | wc -l && ls lib/hooks/*.ts | grep -E "use-freshness|use-job-status" && ls app/api/jobs/sse/route.ts`

## Checkpoint for Visual Verification

1. Open any dashboard page (for example `/dashboard/overview`).
2. Confirm sidebar shows all 8 dashboard links with active page highlight.
3. Confirm header shows `Home > Dashboard > [Page]`, `Refresh Now`, and live progress panel when a refresh is queued.
4. Confirm freshness badge renders `Last updated: X hours ago` with green/yellow/red states.

## Deviations from Plan

### Auto-fixed Issues

1. `[Rule 3 - Blocking]` TypeScript verification was blocked by missing `opossum` declarations and strict callback typing.
   - Fix: added `types/opossum.d.ts`, typed callback parameters in `lib/dataforseo/circuit-breaker.ts`, and removed invalid Inngest middleware wiring in `lib/jobs/inngest-client.ts`.
   - Commit: `8f73408`

2. `[Rule 2 - Missing Critical]` Refresh and cancellation API routes were absent, preventing the refresh button and cancel control from performing their required behavior.
   - Fix: added `app/api/jobs/refresh/route.ts` and `app/api/jobs/cancel/route.ts`.
   - Commits: `7f72b4f`, `32bcffa`

## Authentication Gates

None encountered during execution.

## Next Phase Readiness

- Ready for dashboard page-level data wiring in Phase 02.
- SSE infrastructure is in place; remaining work is to emit richer job messages/progress detail from job executors.
