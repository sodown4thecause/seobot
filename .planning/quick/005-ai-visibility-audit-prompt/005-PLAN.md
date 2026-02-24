---
phase: quick-005-ai-visibility-audit-prompt
plan: 005
type: execute
wave: 1
depends_on:
  - quick-001-ai-visibility-audit-prompt-1-md
  - quick-003-ai-visibility-audit-prompt-md-finish-it
  - quick-004-ai-visibility-audit-prompt
files_modified:
  - app/api/audit/results/[id]/route.ts
  - app/audit/results/[id]/page.tsx
  - app/api/audit/route.ts
  - lib/audit/report-email.ts
  - lib/audit/types.ts
  - tests/unit/audit/report-delivery.test.ts
autonomous: true
must_haves:
  truths:
    - "A completed audit can be reopened from a stable URL after the user leaves the live flow."
    - "Follow-up email contains a direct report link that matches the completed audit shown on-screen."
    - "Email/report delivery failures never block the completed `/api/audit` response for the lead magnet flow."
  artifacts:
    - path: "app/api/audit/results/[id]/route.ts"
      provides: "read endpoint for persisted audit payload by id"
      exports: ["GET"]
    - path: "app/audit/results/[id]/page.tsx"
      provides: "rendered standalone report view for completed audits"
    - path: "lib/audit/report-email.ts"
      provides: "recap email content including canonical report URL"
    - path: "app/api/audit/route.ts"
      provides: "completed run triggers best-effort report delivery metadata"
      exports: ["POST"]
  key_links:
    - from: "app/api/audit/route.ts"
      to: "lib/audit/report-email.ts"
      via: "post-completion async send"
      pattern: "send.*report"
    - from: "lib/audit/report-email.ts"
      to: "app/audit/results/[id]/page.tsx"
      via: "report URL in email body"
      pattern: "audit/results"
    - from: "app/audit/results/[id]/page.tsx"
      to: "app/api/audit/results/[id]/route.ts"
      via: "fetch completed audit data"
      pattern: "/api/audit/results/"
---

<objective>
Add durable report delivery for AI Visibility Audit so users can revisit findings from email after leaving the live session.

Purpose: The flow currently delivers results in-session, but post-session re-entry is weak without a stable results URL tied to each completed audit.
Output: A persisted-audit results endpoint + report page, and recap emails that deep-link to that report without blocking run completion.
</objective>

<execution_context>
@~/.config/opencode/get-shit-done/workflows/execute-plan.md
@~/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@ai-visibility-audit-prompt.md
@.planning/STATE.md
@.planning/quick/003-ai-visibility-audit-prompt-md-finish-it/003-SUMMARY.md
@.planning/quick/004-ai-visibility-audit-prompt/004-SUMMARY.md
@app/api/audit/route.ts
@lib/audit/report-email.ts
@components/audit/ResultsHero.tsx
@components/audit/PlatformBreakdown.tsx
@components/audit/CitationSources.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add persisted audit results retrieval endpoint</name>
  <files>app/api/audit/results/[id]/route.ts, lib/audit/types.ts, app/api/audit/route.ts</files>
  <action>Create `GET /api/audit/results/[id]` that validates UUID input, reads the completed audit row from `ai_visibility_audits`, and returns the normalized report payload required by existing result components (hero metrics, platform breakdown, citation section, execution metadata). Reuse current audit response contracts where possible instead of inventing a parallel shape. Return explicit 400 for invalid IDs and 404 when the audit is missing. Keep endpoint public/read-only and do not expose raw PII fields beyond what report rendering needs.</action>
  <verify>Run `npm run typecheck`; call `GET /api/audit/results/{valid-or-mocked-id}` and confirm 200 payload shape; call with malformed and unknown IDs to confirm 400/404 behavior.</verify>
  <done>Persisted audits are retrievable through a stable API contract consumable by a standalone results view.</done>
</task>

<task type="auto">
  <name>Task 2: Build standalone report page using existing audit result components</name>
  <files>app/audit/results/[id]/page.tsx, components/audit/ResultsHero.tsx, components/audit/PlatformBreakdown.tsx, components/audit/CitationSources.tsx</files>
  <action>Add `/audit/results/[id]` page that fetches `GET /api/audit/results/[id]` and renders the same trust-building order already established in the live flow: hero comparison first, platform evidence second, citations third, optional upsell block last. Reuse existing components and visual language (do not fork alternate report UI). Include resilient empty/error states for invalid or unavailable IDs so shared links fail gracefully.</action>
  <verify>Run `npm run typecheck`; open `/audit/results/{id}` and confirm sections render in correct order; verify invalid/missing IDs show non-crashing error state.</verify>
  <done>Users can open a direct link and review completed audit findings outside the interactive run flow.</done>
</task>

<task type="auto">
  <name>Task 3: Deep-link recap email to report URL with non-blocking delivery tests</name>
  <files>lib/audit/report-email.ts, app/api/audit/route.ts, tests/unit/audit/report-delivery.test.ts</files>
  <action>Update recap email composition to include canonical report URL (`/audit/results/{auditId}`) and core hero findings. Trigger send only when a persisted `auditId` exists, and keep send path fire-and-forget so run completion latency and success are unaffected by email provider/report-link issues. Add targeted unit tests proving link generation correctness and that send failures are swallowed/logged without mutating the completed API response contract.</action>
  <verify>Run `npm run test -- --run tests/unit/audit/report-delivery.test.ts` and `npm run typecheck`.</verify>
  <done>Email follow-up reliably points users back to their specific audit report while preserving non-blocking completion behavior.</done>
</task>

</tasks>

<verification>
Run `npm run typecheck` and `npm run test -- --run tests/unit/audit/report-delivery.test.ts`; manually confirm one completed audit can be opened via `/audit/results/{auditId}` and matches email-linked report URL.
</verification>

<success_criteria>
- Completed audits are accessible via `GET /api/audit/results/[id]` with stable response shape and explicit 400/404 handling.
- `/audit/results/[id]` renders reusable evidence sections in the established conversion-safe order.
- Recap email includes audit-specific deep link and never blocks or fails the completed `/api/audit` response.
</success_criteria>

<output>
After completion, create `.planning/quick/005-ai-visibility-audit-prompt/005-SUMMARY.md`
</output>
