---
phase: quick-006-ai-visibility-audit-prompt
plan: 006
subsystem: audit-analytics
tags: [audit, analytics, funnel, attribution, nextjs, vitest]

# Dependency graph
requires:
  - phase: quick-004-ai-visibility-audit-prompt
    provides: Completed-run `auditId` handoff and non-blocking CTA conversion attribution.
  - phase: quick-005-ai-visibility-audit-prompt
    provides: Durable `/audit/results/[id]` re-entry path for report revisit tracking.
provides:
  - Live audit funnel events now emit start, email capture, completion, and failure telemetry with session identity.
  - Re-opened report loads emit dedicated `results_viewed` events tagged for re-engagement analysis.
  - Audit analytics ingestion now validates and normalizes payloads while preserving explicit 400s for malformed requests.
  - Focused unit tests guard payload shape, metadata passthrough, and non-blocking tracker behavior.
affects: [launch-readiness, audit-funnel-optimization, attribution-reporting]

# Tech tracking
tech-stack:
  added: [none]
  patterns: [non-blocking keepalive analytics, session-and-auditId attribution enrichment, strict payload normalization]

key-files:
  created:
    - tests/unit/audit/audit-analytics.test.ts
  modified:
    - components/audit/AuditFlow.tsx
    - app/audit/results/[id]/page.tsx
    - lib/analytics/audit-tracker.ts
    - app/api/analytics/audit/route.ts

key-decisions:
  - "Treat analytics calls as fire-and-forget keepalive requests so telemetry outages cannot affect audit UX transitions."
  - "Use stable session IDs for live attempts and include `auditId` in event properties for downstream attribution joins."
  - "Normalize and validate event payloads at ingestion with explicit 400s for malformed data while keeping success response shape unchanged."

patterns-established:
  - "Audit funnel analytics pattern: emit `audit_started`/`email_captured`/`audit_completed`/`audit_failed` from detect+run transitions."
  - "Re-entry analytics pattern: track reopened reports separately with `results_viewed` and `source: reopened-report`."

# Metrics
duration: 11m
completed: 2026-02-25
---

# Phase quick-006 Plan 006: AI Visibility Audit Prompt Summary

**Instrumented end-to-end audit telemetry across live runs and reopened reports with normalized ingestion plus tests proving payload safety and non-blocking delivery.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-02-24T21:32:18Z
- **Completed:** 2026-02-24T21:43:16Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Added stable per-attempt session IDs to the live audit flow and emitted best-effort `audit_started`, `email_captured`, `audit_completed`, and `audit_failed` events with contextual properties.
- Added reopened-report tracking by emitting `results_viewed` on successful `/audit/results/[id]` loads with `source: reopened-report` and `auditId` context.
- Hardened `/api/analytics/audit` payload validation/normalization to consistently accept optional metadata and reject malformed payloads with explicit 400 responses.
- Added focused unit tests for payload serialization, metadata passthrough, malformed request rejection, and tracker failure isolation.

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire live audit funnel analytics in the client flow** - `0de8a60` (feat)
2. **Task 2: Track durable report re-entry and normalize analytics ingestion** - `b546972` (feat)
3. **Task 3: Add focused tests for analytics payload safety and reliability** - `d564929` (test)

## Files Created/Modified
- `components/audit/AuditFlow.tsx` - Added session-based lifecycle event tracking for detect/run transitions.
- `app/audit/results/[id]/page.tsx` - Added reopened report view analytics emission on successful payload load.
- `lib/analytics/audit-tracker.ts` - Added payload builder, `auditId` enrichment, and non-blocking keepalive transport.
- `app/api/analytics/audit/route.ts` - Added strict payload normalization/validation and explicit malformed-request handling.
- `tests/unit/audit/audit-analytics.test.ts` - Added contract tests for serialization, ingestion validation, and non-blocking failures.

## Decisions Made
- Chose fire-and-forget analytics transport with keepalive and catch-only failure handling so tracking never blocks navigation or results rendering.
- Stored attribution metadata (including `auditId`) in event `properties` to avoid schema changes while preserving queryable context.
- Whitelisted accepted `eventType` values at ingestion to keep funnel reporting clean and prevent malformed writes.

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None.

## Issues Encountered
- None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Audit launch analysis now has reliable funnel step telemetry and reopened-report re-engagement data in the same event pipeline.
- Ready to build dashboard/queries for completion drop-off, failure drivers, and CTA attribution segmented by `sessionId`/`auditId`.

---
*Phase: quick-006-ai-visibility-audit-prompt*
*Completed: 2026-02-25*
