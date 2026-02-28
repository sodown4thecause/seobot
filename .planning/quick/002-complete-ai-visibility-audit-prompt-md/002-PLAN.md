---
phase: quick-002-complete-ai-visibility-audit-prompt-md
plan: 002
type: execute
wave: 1
depends_on:
  - quick-001-ai-visibility-audit-prompt-1-md/001
files_modified:
  - components/landing/landing-page-client.tsx
  - components/audit/AuditFlow.tsx
  - components/audit/UpsellGate.tsx
  - components/audit/ResultsHero.tsx
  - components/audit/PlatformBreakdown.tsx
  - components/audit/CitationSources.tsx
autonomous: true
must_haves:
  truths:
    - "Homepage clearly frames the AI Visibility Audit lead magnet and routes visitors into the audit flow"
    - "Audit results screen shows competitive contrast, platform-level findings, and citation evidence in one scannable flow"
    - "Lead magnet experience includes a visible conversion step to strategy-call/pricing actions without blocking free results"
  artifacts:
    - path: "components/landing/landing-page-client.tsx"
      provides: "Homepage lead magnet messaging and primary CTA placement"
    - path: "components/audit/AuditFlow.tsx"
      provides: "Ordered results composition and conversion handoff after completion"
    - path: "components/audit/UpsellGate.tsx"
      provides: "Blurred/gated upsell block with strategy call and full audit CTAs"
  key_links:
    - from: "components/landing/landing-page-client.tsx"
      to: "app/audit/page.tsx"
      via: "primary CTA links to /audit"
      pattern: "href=\"/audit\""
    - from: "components/audit/AuditFlow.tsx"
      to: "components/audit/UpsellGate.tsx"
      via: "results layout includes post-results upsell block"
      pattern: "UpsellGate"
    - from: "components/audit/AuditFlow.tsx"
      to: "components/audit/ResultsHero.tsx"
      via: "completed-state hero result rendering"
      pattern: "ResultsHero"
---

<objective>
Complete the remaining AI Visibility Audit prompt requirements by tightening the lead-magnet UX on the homepage and finishing the conversion-focused results experience.

Purpose: Increase top-of-funnel conversion from home page traffic to qualified strategy-call intent while keeping the free audit fast and credible.
Output: Updated home lead-magnet section plus finalized audit results composition with a visible, non-blocking upsell gate.
</objective>

<execution_context>
@~/.config/opencode/get-shit-done/workflows/execute-plan.md
@~/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@ai-visibility-audit-prompt.md
@.planning/quick/001-ai-visibility-audit-prompt-1-md/001-SUMMARY.md
@components/landing/landing-page-client.tsx
@components/audit/AuditFlow.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Upgrade homepage lead-magnet section for AI Visibility Audit conversion</name>
  <files>components/landing/landing-page-client.tsx</files>
  <action>Refactor the homepage hero/lead section copy and supporting proof points to match the AI Visibility Audit positioning from the prompt ("Is AI Recommending Your Competitors Instead of You?"). Keep existing visual language, but make `/audit` the unmistakable primary action above the fold, add concise "how it works" framing, and ensure mobile CTA visibility without excessive scrolling. Do not introduce new routing or auth requirements.</action>
  <verify>Run `npm run dev`, open `/`, and confirm the primary hero message, supporting copy, and main CTA all align to AI visibility audit intent on desktop and mobile widths.</verify>
  <done>Homepage communicates one clear lead-magnet story and funnels visitors directly into `/audit` with high-clarity messaging.</done>
</task>

<task type="auto">
  <name>Task 2: Finalize audit results UX with conversion gate and stronger decision framing</name>
  <files>components/audit/AuditFlow.tsx, components/audit/UpsellGate.tsx, components/audit/ResultsHero.tsx, components/audit/PlatformBreakdown.tsx, components/audit/CitationSources.tsx</files>
  <action>Complete the post-run results experience by adding a dedicated `UpsellGate` component and wiring it into the completed state after core free insights. Ensure hero contrast statement, platform cards, and citation-source section remain visible and ungated; place blurred/gated "next step" content underneath with strategy-call and full-audit CTAs. Keep result rendering progressive-friendly and avoid gating or delaying core free findings.</action>
  <verify>Execute one full `/audit` run and confirm the completed view shows, in order: hero contrast, platform breakdown, citation sources, then the blurred upsell gate with both CTAs present.</verify>
  <done>Audit users get immediate value plus a clear monetization handoff, matching the prompt's conversion strategy without harming trust.</done>
</task>

</tasks>

<verification>
Run `npm run typecheck` and manually verify `/` and `/audit` end-to-end in a browser session with one sample audit.
</verification>

<success_criteria>
- Homepage lead magnet positioning is explicitly AI Visibility Audit and drives users to `/audit`.
- Audit results preserve immediate free insights (hero + platforms + citations) before any gated upsell content.
- Conversion gate presents clear strategy-call/full-audit next actions in the completed flow.
</success_criteria>

<output>
After completion, create `.planning/quick/002-complete-ai-visibility-audit-prompt-md/002-SUMMARY.md`
</output>
