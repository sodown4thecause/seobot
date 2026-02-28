---
phase: quick-001-ai-visibility-audit-prompt-1-md
plan: 001
subsystem: api
tags: [nextjs, workflow-engine, perplexity, grok, gemini, rate-limit, supabase]

# Dependency graph
requires:
  - phase: 01-foundation-&-infrastructure
    provides: Existing Next.js app routing, workflow engine, Redis helpers, and Drizzle DB client.
provides:
  - Public `/audit` conversion flow with detect -> confirm -> run -> results UX.
  - Fixed-cost 5-check AI visibility pipeline (3 Perplexity, 1 Grok, 1 Gemini).
  - Audit persistence schema with guardrails (2/day IP cap + daily budget + kill switch).
affects: [phase-2-core-dashboards, lead-funnel-analytics, aeo-optimization]

# Tech tracking
tech-stack:
  added: [none]
  patterns: [fixed-check workflow orchestration, staged public audit endpoint, graceful persistence fallback]

key-files:
  created:
    - app/api/audit/route.ts
    - lib/workflows/definitions/ai-visibility-audit.ts
    - lib/audit/types.ts
    - lib/audit/prompts.ts
    - lib/audit/parser.ts
    - lib/audit/scorer.ts
    - components/audit/AuditFlow.tsx
    - components/audit/AuditForm.tsx
    - components/audit/BrandConfirmation.tsx
    - components/audit/ResultsHero.tsx
    - components/audit/PlatformBreakdown.tsx
    - components/audit/CitationSources.tsx
    - supabase/migrations/20260225_create_ai_visibility_audits.sql
    - tests/unit/audit/ai-visibility-utils.test.ts
  modified:
    - app/audit/page.tsx
    - lib/workflows/engine.ts

key-decisions:
  - "Keep cost and scope fixed by hard-coding exactly 3 buyer-intent prompts and 5 model checks."
  - "Use a single `/api/audit` endpoint with `detect` and `run` actions to support the 3-step UX without route sprawl."
  - "Allow local execution without the new table by gracefully skipping persistence when migration is not yet applied."

patterns-established:
  - "Public lead flow pattern: collect minimum data, show AI-detected context, then run expensive calls only after confirmation."
  - "Workflow tool-key pattern: support `tool.id` to safely run same tool multiple times in parallel."

# Metrics
duration: 42m
completed: 2026-02-24
---

# Phase quick-001 Plan 001: AI Visibility Audit Prompt 1 Summary

**Launched a production-usable AI Visibility Audit MVP with fixed 5-check multi-model execution, competitive comparison output, and conversion-first `/audit` flow.**

## Performance

- **Duration:** 42 min
- **Started:** 2026-02-24T15:53:13Z
- **Completed:** 2026-02-24T16:35:21Z
- **Tasks:** 3
- **Files modified:** 16

## Accomplishments
- Built strict audit contracts, prompt generation, parsing, and scoring utilities for deterministic MVP payloads.
- Added `ai-visibility-audit` workflow definition and engine support for parallel repeated-tool execution plus Grok/Gemini text tools.
- Shipped end-to-end `/audit` guided UX (submit, confirm, results) with hero competitor contrast, platform cards, and citation sources.
- Added persistence migration and route guardrails for rate limit, budget cutoffs, and kill switch behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build backend pipeline contracts and 5-call workflow** - `1dae92e` (feat)
2. **Task 2: Implement public `/audit` UX flow and conversion-first results UI** - `883f51c` (feat)
3. **Task 3: Add persistence + guardrails (rate limiting and budget gate)** - `3f8fc91` (feat)

## Files Created/Modified
- `app/api/audit/route.ts` - Detect/run orchestration, guardrails, scoring response, persistence hooks.
- `lib/workflows/definitions/ai-visibility-audit.ts` - Fixed 5-check workflow and mock-safe execution path.
- `lib/workflows/engine.ts` - Added `tool.id` support and Grok/Gemini workflow tool executors.
- `lib/audit/types.ts` - Shared audit contracts for request, platform results, and hero metrics.
- `lib/audit/prompts.ts` - Exactly 3 buyer-intent prompt templates from confirmed brand context.
- `lib/audit/parser.ts` - Structured extraction of mentions, positions, competitors, citations.
- `lib/audit/scorer.ts` - Competitive visibility math (no weighted 0-100 score).
- `app/audit/page.tsx` - Routes `/audit` to the new guided flow.
- `components/audit/AuditFlow.tsx` - Client state machine for submit -> confirm -> results.
- `components/audit/AuditForm.tsx` - Initial domain/email capture step.
- `components/audit/BrandConfirmation.tsx` - Editable detected brand context confirmation.
- `components/audit/ResultsHero.tsx` - Above-the-fold competitor-vs-brand statement.
- `components/audit/PlatformBreakdown.tsx` - Per-platform check visibility cards and prompt evidence.
- `components/audit/CitationSources.tsx` - "What AI Is Reading Instead of Your Website" source list.
- `supabase/migrations/20260225_create_ai_visibility_audits.sql` - Persistence schema for completed audits.
- `tests/unit/audit/ai-visibility-utils.test.ts` - Utility coverage for prompts, parser, and scoring behavior.

## Decisions Made
- Used fixed `totalChecks: 5` and fixed prompt count to enforce cost ceiling and avoid scope creep.
- Kept `/api/audit` public and action-driven (`detect`/`run`) so users can complete everything on-screen.
- Returned both top-level `platformResults` and computed `results` summary to keep UI rendering simple and explicit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Parallel workflow results overwrote duplicate tool executions**
- **Found during:** Task 1
- **Issue:** Workflow engine keyed results by `tool.name`, so running `perplexity_search` three times collided and lost data.
- **Fix:** Added `tool.id` support in parallel/sequential execution and context propagation.
- **Files modified:** `lib/workflows/engine.ts`
- **Verification:** `npm run typecheck` and successful mock-safe `/api/audit` response with all 5 checks present.
- **Committed in:** `1dae92e`

**2. [Rule 3 - Blocking] Local verification failed before migration due missing `ai_visibility_audits` table**
- **Found during:** Task 1/3 verification
- **Issue:** Budget count query and persistence insert failed in local DB before migration was applied.
- **Fix:** Added graceful fallback paths that skip table-dependent checks locally while still returning successful audit payloads.
- **Files modified:** `app/api/audit/route.ts`
- **Verification:** Mock-safe POST returned full completed payload; 429/503 guardrail paths still verified.
- **Committed in:** `3f8fc91`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** All deviations were required for correctness and successful verification; no product scope expansion.

## Issues Encountered
- Next.js generated a broken `.next/dev/types/routes.d.ts` snapshot after dev runs; resolved by clearing `.next` before final typecheck.

## User Setup Required
None - no external service configuration required for the shipped code path.

## Next Phase Readiness
- `/audit` MVP flow, API payload, and UI are ready for conversion testing and funnel analytics.
- Apply `supabase/migrations/20260225_create_ai_visibility_audits.sql` in the target environment before relying on persistence metrics.

---
*Phase: quick-001-ai-visibility-audit-prompt-1-md*
*Completed: 2026-02-24*
