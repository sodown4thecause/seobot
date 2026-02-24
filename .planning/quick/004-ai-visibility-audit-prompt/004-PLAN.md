---
phase: quick-004-ai-visibility-audit-prompt
plan: 004
type: execute
wave: 1
depends_on:
  - quick-001-ai-visibility-audit-prompt-1-md
  - quick-002-complete-ai-visibility-audit-prompt-md
  - quick-003-ai-visibility-audit-prompt-md-finish-it
files_modified:
  - app/api/audit/route.ts
  - app/api/audit/convert/route.ts
  - lib/audit/types.ts
  - components/audit/AuditFlow.tsx
  - components/audit/UpsellGate.tsx
  - tests/unit/audit/conversion-tracking.test.ts
autonomous: true
must_haves:
  truths:
    - "Completed audit sessions expose a stable audit identifier that the client can reuse for follow-up conversion events."
    - "Clicking a post-results CTA records conversion intent for that audit without blocking user navigation."
    - "Conversion tracking failures never hide or break the existing results and upsell flow."
  artifacts:
    - path: "app/api/audit/route.ts"
      provides: "completed run response includes auditId from persistence path"
      exports: ["POST"]
    - path: "app/api/audit/convert/route.ts"
      provides: "public conversion-intent endpoint that marks audits converted"
      exports: ["POST"]
    - path: "components/audit/UpsellGate.tsx"
      provides: "CTA click handlers that send non-blocking conversion events"
    - path: "components/audit/AuditFlow.tsx"
      provides: "passes auditId from API completion payload into upsell section"
  key_links:
    - from: "app/api/audit/route.ts"
      to: "components/audit/AuditFlow.tsx"
      via: "completed payload field"
      pattern: "auditId"
    - from: "components/audit/UpsellGate.tsx"
      to: "app/api/audit/convert/route.ts"
      via: "CTA click tracking request"
      pattern: "fetch\(.*?/api/audit/convert"
    - from: "app/api/audit/convert/route.ts"
      to: "ai_visibility_audits"
      via: "update converted flag"
      pattern: "UPDATE ai_visibility_audits"
---

<objective>
Close the lead-magnet attribution loop by wiring CTA conversion tracking to stored audit records.

Purpose: The current flow proves visibility gaps, but there is no reliable linkage between completed audits and monetization intent clicks.
Output: Completed `/audit` runs return `auditId`, and post-results CTA clicks update that record via a dedicated conversion endpoint.
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
@.planning/quick/003-ai-visibility-audit-prompt-md-finish-it/003-SUMMARY.md
@app/api/audit/route.ts
@components/audit/AuditFlow.tsx
@components/audit/UpsellGate.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Return auditId on completed runs and add conversion tracking endpoint</name>
  <files>app/api/audit/route.ts, app/api/audit/convert/route.ts, lib/audit/types.ts</files>
  <action>Update the run persistence path to return inserted audit ID (using `RETURNING id`) and include `auditId` in the successful completed payload contract. Add `POST /api/audit/convert` that accepts `{ auditId, event }`, validates shape, and updates `ai_visibility_audits.converted = true` for strategy-call intent events. Keep endpoint tolerant: invalid/missing IDs return 400/404 JSON errors, while repeated calls remain idempotent and return success without creating duplicates.</action>
  <verify>Run `npm run typecheck`; POST `/api/audit` with `action: "run"` and confirm response includes `auditId`; POST `/api/audit/convert` with that ID and confirm `ok: true` response.</verify>
  <done>Completed audit responses provide a reusable `auditId`, and conversion endpoint can mark the corresponding audit row as converted.</done>
</task>

<task type="auto">
  <name>Task 2: Wire non-blocking CTA attribution from results upsell</name>
  <files>components/audit/AuditFlow.tsx, components/audit/UpsellGate.tsx, lib/audit/types.ts</files>
  <action>Store `auditId` in audit flow state after successful run and pass it into `UpsellGate`. Add CTA click handlers for "Book Strategy Call" and "Get Full Audit" that send a best-effort `fetch('/api/audit/convert', { keepalive: true, ... })` before navigation. Do not block navigation, do not show user-facing errors for tracking failures, and keep current CTA destinations and visual hierarchy unchanged.</action>
  <verify>Run `npm run typecheck`; complete a local `/audit` run, click each CTA, and confirm network calls fire to `/api/audit/convert` while links still navigate immediately.</verify>
  <done>Upsell CTA interactions are attributed to the originating audit record without regressing the conversion UX.</done>
</task>

<task type="auto">
  <name>Task 3: Add targeted tests for conversion payload and endpoint behavior</name>
  <files>tests/unit/audit/conversion-tracking.test.ts, app/api/audit/convert/route.ts, lib/audit/types.ts</files>
  <action>Add focused tests covering: payload validation rejects malformed bodies, unknown `auditId` returns not-found response, and repeated valid conversion requests stay successful/idempotent. Keep tests mock-safe and scoped to conversion tracking behavior only; avoid broad end-to-end rewrites.</action>
  <verify>Run `npm run test -- tests/unit/audit/conversion-tracking.test.ts` and confirm all new cases pass.</verify>
  <done>Conversion tracking has automated guardrails for validation, not-found handling, and idempotency.</done>
</task>

</tasks>

<verification>
Run `npm run typecheck` and `npm run test -- tests/unit/audit/conversion-tracking.test.ts`; then perform one manual `/audit` completion and CTA click to confirm conversion endpoint fires without blocking navigation.
</verification>

<success_criteria>
- Completed audit API payload includes `auditId` when persistence succeeds.
- CTA clicks from the upsell section send conversion-intent events linked to that `auditId`.
- `ai_visibility_audits.converted` can be flipped through the endpoint without creating user-facing failures.
- Existing hero -> platform -> citations -> upsell rendering order remains unchanged.
</success_criteria>

<output>
After completion, create `.planning/quick/004-ai-visibility-audit-prompt/004-SUMMARY.md`
</output>
