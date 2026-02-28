---
phase: quick-003-ai-visibility-audit-prompt-md-finish-it
plan: 003
type: execute
wave: 1
depends_on: [quick-001-ai-visibility-audit-prompt-1-md, quick-002-complete-ai-visibility-audit-prompt-md]
files_modified:
  - app/api/audit/route.ts
  - app/api/audit/run/route.ts
  - lib/audit/extraction-agent.ts
  - lib/workflows/definitions/ai-visibility-audit.ts
  - lib/audit/types.ts
  - lib/audit/parser.ts
  - components/audit/AuditFlow.tsx
  - components/audit/ProgressStages.tsx
  - lib/audit/report-email.ts
  - tests/unit/audit/ai-visibility-utils.test.ts
autonomous: true
must_haves:
  truths:
    - "User sees real brand/category/ICP detection from their submitted homepage before expensive checks run."
    - "Audit execution still returns a 5-check result even when one model provider fails, with transparent fallback messaging."
    - "User gets immediate on-screen results and receives an async email summary/report link after completion."
  artifacts:
    - path: "app/api/audit/route.ts"
      provides: "detect + run orchestration with scrape/extraction and async follow-up trigger"
      exports: ["POST"]
    - path: "lib/audit/extraction-agent.ts"
      provides: "homepage scrape and Gemini extraction JSON for brand context"
    - path: "lib/workflows/definitions/ai-visibility-audit.ts"
      provides: "5-call execution with fallback strategy and normalized platform outputs"
    - path: "components/audit/AuditFlow.tsx"
      provides: "progressive run UX and completed-state rendering"
    - path: "lib/audit/report-email.ts"
      provides: "transactional email payload builder/sender for audit recap"
  key_links:
    - from: "app/api/audit/route.ts"
      to: "lib/audit/extraction-agent.ts"
      via: "detect action"
      pattern: "runExtraction|extract.*brand"
    - from: "app/api/audit/route.ts"
      to: "lib/workflows/definitions/ai-visibility-audit.ts"
      via: "run action"
      pattern: "executeAiVisibilityAuditWorkflow"
    - from: "app/api/audit/route.ts"
      to: "lib/audit/report-email.ts"
      via: "fire-and-forget completion follow-up"
      pattern: "send.*audit.*email"
---

<objective>
Finish the remaining high-impact requirements in `ai-visibility-audit-prompt.md` so the lead magnet behaves like a production conversion funnel, not a demo flow.

Purpose: Close the biggest value gaps (real detection, resilient execution, async follow-up) that directly affect trust, completion rate, and booked-call conversion.
Output: A completed `/audit` flow with real scrape/extraction, fallback-safe 5-check execution, and post-run email recap automation.
</objective>

<execution_context>
@~/.config/opencode/get-shit-done/workflows/execute-plan.md
@~/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@ai-visibility-audit-prompt.md
@.planning/STATE.md
@.planning/quick/001-ai-visibility-audit-prompt-1-md/001-SUMMARY.md
@.planning/quick/002-complete-ai-visibility-audit-prompt-md/002-SUMMARY.md
@app/api/audit/route.ts
@lib/workflows/definitions/ai-visibility-audit.ts
@components/audit/AuditFlow.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace placeholder detection with real scrape + extraction</name>
  <files>app/api/audit/route.ts, lib/audit/extraction-agent.ts, lib/audit/types.ts, tests/unit/audit/ai-visibility-utils.test.ts</files>
  <action>Wire detect action to a real homepage extraction path using existing Firecrawl/Jina integration plus Gemini JSON extraction, returning {brand, category, icp, competitors, vertical} from actual site content. Keep current inline-edit confirmation UX unchanged, but add safe fallback values only when extraction fails so API calls are not blocked. Do not introduce new endpoints; keep the single `/api/audit` action pattern to preserve existing client contract.</action>
  <verify>Run `npm run typecheck` and `npm run test -- tests/unit/audit/ai-visibility-utils.test.ts`; then POST `/api/audit` with `action: "detect"` for a real domain and confirm response includes non-placeholder detected fields or explicit fallback marker.</verify>
  <done>Detection no longer uses hardcoded SEO defaults as the primary path; detected context comes from scraped content and remains editable before run.</done>
</task>

<task type="auto">
  <name>Task 2: Make 5-check execution resilient with provider fallback transparency</name>
  <files>lib/workflows/definitions/ai-visibility-audit.ts, app/api/audit/route.ts, lib/audit/parser.ts, lib/audit/types.ts</files>
  <action>Implement prompt-required fallback behavior: when Perplexity fails, reroute those checks to Grok/Gemini and mark citation availability as degraded; when Grok fails, reroute comparison check to Gemini. Preserve fixed-cost intent (still target exactly 5 checks) and expose a response flag/message so UI can explain temporary citation limitations. Avoid expanding prompt count or adding weighted scoring.</action>
  <verify>Run `npm run typecheck`; execute mock/failure-path runs that force Perplexity and Grok failures and confirm API still returns `stage: "completed"` with 5 platform results plus fallback/degraded-citation indicator.</verify>
  <done>Audit completion is robust to single-provider outages and users still receive comparable visibility output with explicit transparency about missing citation depth.</done>
</task>

<task type="auto">
  <name>Task 3: Add progressive run feedback and async email recap trigger</name>
  <files>components/audit/AuditFlow.tsx, components/audit/ProgressStages.tsx, app/api/audit/route.ts, lib/audit/report-email.ts</files>
  <action>Upgrade run-stage UX to show clear progress states while checks execute (detect confirmed -> running checks -> scoring -> done) and keep current results ordering (hero -> platform -> citations -> upsell). After successful completion, trigger async transactional email with key hero stats and report link/summary payload using existing mail provider integration; do not gate on-screen results behind email success.</action>
  <verify>Run `npm run typecheck`; run local audit flow and confirm progress stage transitions appear during execution; verify completion response still renders results even if email send fails (log warning only).</verify>
  <done>Users get immediate visual execution feedback and a non-blocking follow-up email touchpoint after each completed audit.</done>
</task>

</tasks>

<verification>
Run `npm run typecheck` and a full happy-path `/audit` flow (detect -> confirm -> run) plus two failure simulations (Perplexity down, Grok down) to confirm resilient completion and messaging.
</verification>

<success_criteria>
- Detect stage uses real scraped homepage content for brand context extraction.
- Run stage returns completed results for all 5 checks even with one provider outage.
- Results page remains immediate and ungated, with progress feedback during execution.
- Async email recap is dispatched on successful completion without blocking UI response.
</success_criteria>

<output>
After completion, create `.planning/quick/003-ai-visibility-audit-prompt-md-finish-it/003-SUMMARY.md`
</output>
