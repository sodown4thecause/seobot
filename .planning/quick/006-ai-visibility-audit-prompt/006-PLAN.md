---
phase: quick-006-ai-visibility-audit-prompt
plan: 006
type: execute
wave: 1
depends_on:
  - quick-001-ai-visibility-audit-prompt-1-md
  - quick-004-ai-visibility-audit-prompt
  - quick-005-ai-visibility-audit-prompt
files_modified:
  - components/audit/AuditFlow.tsx
  - app/audit/results/[id]/page.tsx
  - lib/analytics/audit-tracker.ts
  - app/api/analytics/audit/route.ts
  - tests/unit/audit/audit-analytics.test.ts
autonomous: true
must_haves:
  truths:
    - "Audit funnel steps are tracked from start to completion without blocking the user flow."
    - "Re-opened report views are recorded separately from live in-session results so re-engagement is measurable."
    - "CTA intent and conversion context can be tied back to a stable audit session or auditId for attribution analysis."
  artifacts:
    - path: "components/audit/AuditFlow.tsx"
      provides: "live audit funnel emits start, detect, complete, and failure analytics events"
    - path: "app/audit/results/[id]/page.tsx"
      provides: "report re-open page emits results-viewed analytics event"
    - path: "lib/analytics/audit-tracker.ts"
      provides: "typed, non-blocking analytics helpers for audit events and payload enrichment"
    - path: "app/api/analytics/audit/route.ts"
      provides: "analytics ingestion accepts/normalizes audit event payloads for funnel reporting"
      exports: ["POST", "GET"]
    - path: "tests/unit/audit/audit-analytics.test.ts"
      provides: "coverage for event payload shape and non-blocking tracking behavior"
  key_links:
    - from: "components/audit/AuditFlow.tsx"
      to: "lib/analytics/audit-tracker.ts"
      via: "stage transitions call tracker helpers"
      pattern: "trackAudit"
    - from: "app/audit/results/[id]/page.tsx"
      to: "/api/analytics/audit"
      via: "results viewed event on successful load"
      pattern: "results_viewed"
    - from: "lib/analytics/audit-tracker.ts"
      to: "app/api/analytics/audit/route.ts"
      via: "POST event payload"
      pattern: "eventType"
---

<objective>
Instrument the AI Visibility Audit funnel so launch decisions can be driven by real step-level conversion and re-engagement data.

Purpose: The audit flow now converts and reopens correctly, but optimization is blocked without reliable event telemetry across live runs, shared report re-entry, and CTA intent.
Output: End-to-end analytics events for audit lifecycle steps plus focused test coverage proving payload integrity and non-blocking behavior.
</objective>

<execution_context>
@~/.config/opencode/get-shit-done/workflows/execute-plan.md
@~/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@ai-visibility-audit-prompt.md
@.planning/STATE.md
@.planning/quick/004-ai-visibility-audit-prompt/004-SUMMARY.md
@.planning/quick/005-ai-visibility-audit-prompt/005-SUMMARY.md
@components/audit/AuditFlow.tsx
@app/audit/results/[id]/page.tsx
@lib/analytics/audit-tracker.ts
@app/api/analytics/audit/route.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Wire live audit funnel analytics in the client flow</name>
  <files>components/audit/AuditFlow.tsx, lib/analytics/audit-tracker.ts</files>
  <action>Introduce a stable `sessionId` for each audit attempt and emit non-blocking events for `audit_started`, `email_captured`, `audit_completed`, and `audit_failed` from the existing detect/run transitions. Include key context in event properties (`domain`, detected `brand/category`, `visibilityRate`, `topCompetitor`, `auditId` when available) while keeping all tracking best-effort so API or tracker failures never alter stage progression or error handling in the UX.</action>
  <verify>Run `npm run typecheck`; run a local `/audit` happy-path and a forced error-path request, then confirm analytics calls are attempted without interrupting navigation or results rendering.</verify>
  <done>Live audit sessions consistently emit actionable funnel events with enough metadata to segment completion and failure drivers.</done>
</task>

<task type="auto">
  <name>Task 2: Track durable report re-entry and normalize analytics ingestion</name>
  <files>app/audit/results/[id]/page.tsx, lib/analytics/audit-tracker.ts, app/api/analytics/audit/route.ts</files>
  <action>Emit `results_viewed` when `/audit/results/[id]` successfully loads, tagged with `source: reopened-report` and `auditId`. Update analytics tracker and API ingestion validation/normalization so event payloads from both live flow and re-opened reports are accepted consistently (including optional metadata in `properties`) without requiring schema changes. Preserve explicit 400 handling for malformed payloads and keep the endpoint response contract unchanged for valid events.</action>
  <verify>Run `npm run typecheck`; send sample POST payloads for `audit_completed` and `results_viewed` to `/api/analytics/audit` and confirm success; verify malformed payload still returns 400.</verify>
  <done>Re-engagement traffic is measurable and comparable to live-session outcomes through one normalized analytics pipeline.</done>
</task>

<task type="auto">
  <name>Task 3: Add focused tests for analytics payload safety and reliability</name>
  <files>tests/unit/audit/audit-analytics.test.ts, lib/analytics/audit-tracker.ts, app/api/analytics/audit/route.ts</files>
  <action>Add unit tests that cover: valid event payload serialization, optional metadata passthrough, malformed payload rejection, and non-blocking behavior when analytics POST fails. Keep tests scoped to audit analytics contracts (do not add broad integration harnesses) so regressions in event wiring are caught quickly during future conversion experiments.</action>
  <verify>Run `npm run test -- --run tests/unit/audit/audit-analytics.test.ts` and `npm run typecheck`.</verify>
  <done>Analytics instrumentation changes are guarded by deterministic tests for both correctness and failure isolation.</done>
</task>

</tasks>

<verification>
Run `npm run test -- --run tests/unit/audit/audit-analytics.test.ts` and `npm run typecheck`; manually verify one `/audit` completion and one `/audit/results/{auditId}` load both trigger non-blocking analytics events.
</verification>

<success_criteria>
- `/audit` emits lifecycle events that distinguish started, completed, and failed runs without affecting user-visible flow.
- `/audit/results/[id]` emits a dedicated re-opened report view event tied to the same audit identity model used for attribution.
- `/api/analytics/audit` reliably accepts normalized audit telemetry payloads and continues rejecting malformed requests with explicit 400 responses.
</success_criteria>

<output>
After completion, create `.planning/quick/006-ai-visibility-audit-prompt/006-SUMMARY.md`
</output>
