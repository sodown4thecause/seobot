---
phase: quick-001-ai-visibility-audit-prompt-1-md
plan: 001
type: execute
wave: 1
depends_on: []
files_modified:
  - app/audit/page.tsx
  - app/api/audit/route.ts
  - lib/workflows/definitions/ai-visibility-audit.ts
  - lib/audit/types.ts
  - lib/audit/prompts.ts
  - lib/audit/parser.ts
  - lib/audit/scorer.ts
  - components/audit/AuditForm.tsx
  - components/audit/BrandConfirmation.tsx
  - components/audit/ResultsHero.tsx
  - components/audit/PlatformBreakdown.tsx
  - components/audit/CitationSources.tsx
  - supabase/migrations/20260225_create_ai_visibility_audits.sql
autonomous: true
must_haves:
  truths:
    - "Visitor can submit domain + email and start audit immediately"
    - "Visitor sees detected brand/category/ICP/competitors and can confirm or edit before expensive calls"
    - "System runs exactly 5 checks (3 Perplexity, 1 Grok, 1 Gemini) and returns competitor-vs-brand visibility output"
    - "Results show citation URLs and clearly call out competitor advantage"
    - "Audit request is rate-limited and persisted for lead follow-up"
  artifacts:
    - path: "app/audit/page.tsx"
      provides: "Public audit flow container"
    - path: "app/api/audit/route.ts"
      provides: "Main audit orchestration endpoint"
      exports: ["POST"]
    - path: "lib/workflows/definitions/ai-visibility-audit.ts"
      provides: "Parallel execution plan for 5 model calls"
    - path: "lib/audit/scorer.ts"
      provides: "Visibility metrics + competitor contrast computation"
    - path: "supabase/migrations/20260225_create_ai_visibility_audits.sql"
      provides: "ai_visibility_audits persistence schema"
  key_links:
    - from: "components/audit/AuditForm.tsx"
      to: "app/api/audit/route.ts"
      via: "POST audit request"
      pattern: "fetch\(.*?/api/audit"
    - from: "app/api/audit/route.ts"
      to: "lib/workflows/definitions/ai-visibility-audit.ts"
      via: "workflow execution"
      pattern: "ai-visibility-audit"
    - from: "app/api/audit/route.ts"
      to: "lib/audit/scorer.ts"
      via: "compute hero metrics"
      pattern: "compute|score|visibility"
    - from: "app/api/audit/route.ts"
      to: "ai_visibility_audits"
      via: "insert final audit record"
      pattern: "insert|ai_visibility_audits"
---

<objective>
Ship a production-usable MVP of the public AI Visibility Audit lead magnet for FlowIntent with the full 6-step flow reduced to the highest-leverage core: submit -> detect -> confirm -> run 5 checks -> show competitive result -> store lead.

Purpose: Launch a fast, low-cost conversion tool that proves value in under 60 seconds and feeds strategy-call pipeline.
Output: Working `/audit` experience, orchestration API + workflow, parsed/scored result model, and persisted audit records.
</objective>

<execution_context>
@~/.config/opencode/get-shit-done/workflows/execute-plan.md
@~/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@ai-visibility-audit-prompt (1).md
@lib/workflows/engine.ts
@lib/external-apis/perplexity.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build backend pipeline contracts and 5-call workflow</name>
  <files>lib/audit/types.ts, lib/audit/prompts.ts, lib/audit/parser.ts, lib/audit/scorer.ts, lib/workflows/definitions/ai-visibility-audit.ts, app/api/audit/route.ts</files>
  <action>Implement the end-to-end server pipeline for one audit request. Define strict TypeScript interfaces for detection payload, PlatformResult, and AuditResults; generate exactly 3 buyer-intent prompts from confirmed brand data; run exactly 5 model checks (3 Perplexity prompts + Prompt 1 on Grok + Prompt 1 on Gemini) in parallel through the workflow engine; parse each model response into structured mention/position/citation fields; compute hero metrics without a weighted 0-100 score (brandFoundCount, topCompetitorFoundCount, visibilityRate, competitorAdvantage). Keep prompt count fixed at 5 to preserve cost ceiling and avoid scope creep.</action>
  <verify>`npm run typecheck` passes and `curl -X POST /api/audit` with mock-safe payload returns JSON containing `brandFoundCount`, `totalChecks: 5`, `platformResults`, and `citationUrls`.</verify>
  <done>API returns deterministic MVP result shape with 5-check execution evidence and competitive comparison fields ready for UI rendering.</done>
</task>

<task type="auto">
  <name>Task 2: Implement public `/audit` UX flow and conversion-first results UI</name>
  <files>app/audit/page.tsx, components/audit/AuditForm.tsx, components/audit/BrandConfirmation.tsx, components/audit/ResultsHero.tsx, components/audit/PlatformBreakdown.tsx, components/audit/CitationSources.tsx</files>
  <action>Create the audit page as a single guided flow: (1) domain + email capture, (2) detection confirmation/edit step, (3) results view with hero comparison statement above the fold, platform breakdown cards, and citation source list labeled "What AI Is Reading Instead of Your Website". Use existing shadcn/ui primitives and existing visual patterns in this repo; avoid introducing unrelated design system changes. Ensure users see progress quickly and can reach results without waiting on email delivery or PDF generation.</action>
  <verify>Run `npm run dev`, submit a sample domain/email, confirm or edit detected data, and observe all three result sections rendered from live API response.</verify>
  <done>Visitor can complete the full on-screen audit journey from input to actionable competitive output in one session.</done>
</task>

<task type="auto">
  <name>Task 3: Add persistence + guardrails (rate limiting and budget gate)</name>
  <files>supabase/migrations/20260225_create_ai_visibility_audits.sql, app/api/audit/route.ts</files>
  <action>Create migration for `ai_visibility_audits` table matching MVP data needs (lead fields, extracted brand context, computed results, raw platform payload, citation URLs, timestamps, conversion flag). In the API route, enforce IP-level rate limiting (2/day), enforce daily budget cutoff and kill-switch env gates before expensive calls, and insert completed audit records for analysis and follow-up. Return clear user-safe error messages when guardrails block execution.</action>
  <verify>Apply migration in local DB, call API beyond limit to confirm 429 behavior, and toggle budget/kill-switch env values to confirm guarded early exit response.</verify>
  <done>System stores every successful audit and safely caps abuse/spend without crashing the user flow.</done>
</task>

</tasks>

<verification>
Run `npm run typecheck` and `npm run test:unit` for touched audit utilities. Manually verify one happy-path audit and one blocked-path request (rate or budget guard) from `/audit`.
</verification>

<success_criteria>
- `/audit` is publicly usable and returns an on-screen result in a single flow.
- Result payload always reports exactly 5 checks and includes competitor comparison plus citation evidence.
- Audit data persists in `ai_visibility_audits` for every successful run.
- Rate-limit and budget guardrails prevent runaway usage while preserving clear UX messaging.
</success_criteria>

<output>
After completion, create `.planning/quick/001-ai-visibility-audit-prompt-1-md/001-SUMMARY.md`
</output>
