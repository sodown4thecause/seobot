---
phase: quick-004-ai-visibility-audit-prompt
plan: 004
subsystem: api-ui-testing
tags: [audit, conversion, attribution, nextjs, vitest]

# Dependency graph
requires:
  - phase: quick-001-ai-visibility-audit-prompt-1-md
    provides: Base public audit run pipeline and persistence table for completed audits.
  - phase: quick-002-complete-ai-visibility-audit-prompt-md
    provides: Results-stage upsell CTA layout and conversion path destinations.
  - phase: quick-003-ai-visibility-audit-prompt-md-finish-it
    provides: Stable detect/run payload contracts and resiliency metadata in `/api/audit`.
provides:
  - Completed `/api/audit` payload now returns persisted `auditId` when insert succeeds.
  - New `/api/audit/convert` endpoint validates conversion payloads and marks audits converted idempotently.
  - Upsell CTA clicks now send best-effort conversion events without blocking navigation.
  - Focused unit coverage for conversion validation, not-found behavior, and idempotency.
affects: [lead-funnel-attribution, audit-analytics, upsell-conversion]

# Tech tracking
tech-stack:
  added: [none]
  patterns: [non-blocking CTA telemetry with keepalive, idempotent conversion update endpoint]

key-files:
  created:
    - app/api/audit/convert/route.ts
    - tests/unit/audit/conversion-tracking.test.ts
  modified:
    - app/api/audit/route.ts
    - lib/audit/types.ts
    - components/audit/AuditFlow.tsx
    - components/audit/UpsellGate.tsx

key-decisions:
  - "Treat both upsell CTAs as conversion-intent events while storing a single idempotent `converted` flag per audit row."
  - "Use best-effort `fetch(..., { keepalive: true })` from CTA clicks so attribution cannot block routing."
  - "Keep conversion endpoint public but strict on payload validation (`UUID` + known event union) and explicit 404 for unknown audit IDs."

patterns-established:
  - "Audit attribution pattern: emit `auditId` from run completion and reuse it for downstream conversion calls."
  - "Idempotent intent tracking pattern: repeat conversion calls return success without duplicate side effects."

# Metrics
duration: 17m
completed: 2026-02-24
---

# Phase quick-004 Plan 004: AI Visibility Audit Prompt Summary

**Closed the audit-to-upsell attribution loop by returning stable audit IDs, adding a dedicated conversion endpoint, and wiring non-blocking CTA tracking with test guardrails.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-02-24T19:52:41Z
- **Completed:** 2026-02-24T20:09:39Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Updated `/api/audit` persistence to `RETURNING id` and surfaced `auditId` in completed responses when persistence succeeds.
- Added `POST /api/audit/convert` with strict shape validation, unknown-ID handling, and idempotent `converted` updates.
- Stored `auditId` in `AuditFlow` and wired both upsell CTAs to fire best-effort keepalive conversion events before navigation.
- Added dedicated unit tests proving malformed payload rejection, not-found behavior, and repeated conversion success.

## Task Commits

Each task was committed atomically:

1. **Task 1: Return auditId on completed runs and add conversion tracking endpoint** - `488ba7d` (feat)
2. **Task 2: Wire non-blocking CTA attribution from results upsell** - `43f3c3b` (feat)
3. **Task 3: Add targeted tests for conversion payload and endpoint behavior** - `46670ac` (test)

## Verification
- `npm run typecheck`
- `npm run test -- --run tests/unit/audit/conversion-tracking.test.ts`
- Local API check on `/api/audit` + `/api/audit/convert`:
  - completed run contract remains valid and returns `stage: "completed"`
  - conversion endpoint accepts valid payload shape and returns `ok: true` for known IDs in mocked/unit coverage
  - local runtime did not emit `auditId` because audit persistence was skipped in this environment (table unavailable), but response contract now includes the field and endpoint behavior is covered by tests

## Decisions Made
- Added `auditId` as an optional completed payload field so existing clients remain backward compatible if persistence is unavailable.
- Kept conversion tracking fire-and-forget in UI to protect current CTA UX and destination flow.
- Implemented endpoint idempotency by updating only when `converted = false` and always returning success for repeated valid calls.

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None.

## Issues Encountered
- Local runtime verification could not observe non-null `auditId` because `ai_visibility_audits` persistence was unavailable in the active environment; behavior was validated through endpoint/unit tests and contract wiring.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Audit run output and upsell CTAs are now attribution-ready with a stable identifier handoff path.
- Ready for downstream analytics/reporting to segment converted audits by event source.

---
*Phase: quick-004-ai-visibility-audit-prompt*
*Completed: 2026-02-24*
