# Prove It — Closed-Loop AI Visibility (Scan → Fix → Verify)

**Status:** Draft for implementation
**Date:** 2026-07-24
**Owner:** liam
**Depends on:** `lib/geo/brand-tracker.ts`, `lib/geo/fix-generator.ts`, `geo_runs` / `geo_prompts` schema, Vercel crons

## 1. One-line promise

> FlowIntent doesn't just tell you ChatGPT ignores your brand — it tells you *why*, generates the fix, then re-scans and **proves the fix moved the needle** with a shareable before/after report card.

Every competitor (Profound, Otterly, Peec, SEMrush AI toolkit) stops at monitoring. FlowIntent already owns all three primitives — live multi-engine scan (`geo_brand_scan`), evidence-based fix generation (`geo_generate_fix`), and persisted run history (`geo_runs`). This spec wires them into one production-ready loop and makes that loop the hero feature for the Product Hunt launch.

## 2. The loop

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌──────────────┐
│ 1. SCAN    │ ──▶ │ 2. FIX     │ ──▶ │ 3. SHIP    │ ──▶ │ 4. VERIFY    │
│ baseline   │     │ plan +     │     │ (user      │     │ scheduled    │
│ geo_runs   │     │ content    │     │  publishes)│     │ re-scans +   │
│ snapshot   │     │ package    │     │            │     │ delta report │
└────────────┘     └────────────┘     └────────────┘     └──────┬───────┘
      ▲                                                         │
      └────────────────── citation delta report card ◀──────────┘
```

1. **Scan** — user asks "Why doesn't ChatGPT recommend {brand} for {query}?" `geo_brand_scan` probes engines, persists a `geo_runs` baseline, and shows exactly which sources each engine cites and which competitors win instead.
2. **Fix** — `geo_generate_fix` proposes a fix plan (comparison page, FAQ block, third-party validation, schema, llms.txt/crawlability) targeting the *actually cited* source types. Content Mode can generate the deliverable immediately.
3. **Ship** — user marks the fix as shipped (URL of published fix, optional). This starts the verification clock.
4. **Verify** — scheduled re-scans of the same prompt/engines. When mentions/citations change, the user gets a **before/after citation delta report card**: baseline vs current mention rate, sentiment, citation list, competitor co-mentions, and whether the shipped URL is now cited.

## 3. Scope

### In scope (this spec)

- New `geo_fix_cycles` table linking baseline scan → fix plan → shipped URL → verification runs.
- Scheduled verification re-scans via Vercel cron (extend existing `vercel.json` crons; no new infra).
- "Citation Delta" report card artifact (live artifact type + tool UI renderer) with a public shareable variant.
- Chat tools: `geo_start_fix_cycle`, `geo_mark_fix_shipped`, `geo_fix_cycle_status`.
- Reddit-gap → loop bridge: convert an audit gap into a tracked prompt in one click.
- Production hardening of the three primitives (error paths, rate limits, empty-result UX).
- Credibility cleanup shipped alongside the launch (see §9).

### Out of scope

- Elmo/geomode VPS dependency — the loop must work **fully self-contained** in the Next.js app using `geo_runs`. Elmo remains an optional deepening layer.
- Slack/email push alerts (post-launch; in-app + digest only).
- Multi-user projects/permissions.
- The planned artifact backlog (heatmaps, share-of-voice dashboards) except where §9 hides them.

## 4. Data model (Drizzle, Neon)

New table `geo_fix_cycles`:

```ts
export const geoFixCycles = pgTable('geo_fix_cycles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  geoPromptId: uuid('geo_prompt_id').references(() => geoPrompts.id, { onDelete: 'set null' }),
  brand: text('brand').notNull(),
  query: text('query').notNull(),
  engines: text('engines').array().notNull(),            // subset of GeoEngine
  baselineRunIds: uuid('baseline_run_ids').array().notNull(), // geo_runs at scan time
  fixPlan: jsonb('fix_plan').$type<GeoFixPlan>(),         // from fix-generator
  fixType: text('fix_type'),                              // GeoFixType
  shippedUrl: text('shipped_url'),
  shippedAt: timestamp('shipped_at'),
  status: text('status').notNull().default('scanning'),
  // scanning | fix_proposed | shipped | verifying | improved | no_change | regressed | archived
  verifySchedule: text('verify_schedule').notNull().default('every_3_days'),
  nextVerifyAt: timestamp('next_verify_at'),
  lastVerifiedAt: timestamp('last_verified_at'),
  latestDelta: jsonb('latest_delta').$type<GeoCitationDelta>(),
  shareToken: text('share_token').unique(),               // nullable until shared
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

Verification runs are ordinary `geo_runs` rows tagged by a new nullable column `geo_runs.fixCycleId` (`uuid`, FK → `geo_fix_cycles`, indexed). Baseline vs verification is distinguished by `baselineRunIds` membership. No duplication of scan data.

`GeoCitationDelta` (computed, stored on the cycle for cheap rendering):

```ts
interface GeoCitationDelta {
  perEngine: Array<{
    engine: GeoEngine
    baseline: { mentioned: boolean; sentiment: string | null; brandPosition: number | null; citedDomains: string[] }
    current:  { mentioned: boolean; sentiment: string | null; brandPosition: number | null; citedDomains: string[] }
    shippedUrlCited: boolean
  }>
  mentionRateBefore: number   // engines mentioning brand / engines scanned
  mentionRateAfter: number
  newCitations: string[]      // domains gained
  lostCitations: string[]
  verdict: 'improved' | 'no_change' | 'regressed' | 'pending'
  runsCompared: { baselineAt: string; currentAt: string; verificationCount: number }
}
```

Migration: one new table + one new column, generated via `drizzle-kit`.

## 5. Server logic

New module `lib/geo/fix-cycle.ts`:

- `startFixCycle(params)` — runs `geo_brand_scan` (reusing `brand-tracker.ts`), persists baseline run IDs, calls `deriveRecommendedFixes` + `fix-generator` for the plan, creates the cycle row (`status: fix_proposed`), upserts a `geo_prompts` row (`active: true`) so the prompt is durable.
- `markShipped(cycleId, shippedUrl?)` — sets `shipped`, `shippedAt`, `nextVerifyAt = now + 24h` (first verification fast, then per `verifySchedule`).
- `runVerification(cycleId)` — re-scans same query/engines via `brand-tracker`, writes `geo_runs` rows with `fixCycleId`, computes `GeoCitationDelta` (pure function in `lib/geo/citation-delta.ts`, unit-tested), updates `status` from the verdict. Verdict rules: `improved` if mention rate rose OR shipped URL/domain newly cited OR sentiment moved negative→neutral/positive on any engine; `regressed` if mention rate fell; else `no_change` (require 2 consecutive identical verdicts before flipping status away from `verifying`, to absorb engine nondeterminism).
- Nondeterminism guard: each verification scans each engine **twice** and treats the brand as mentioned if either probe mentions it; store both runs. This is the cheapest defensible answer to "AI answers vary per request" and must be stated in the report card footnote.

### Cron

Add to `vercel.json`:

```json
{ "path": "/api/cron/geo-verify", "schedule": "0 6 * * *" }
```

`/api/cron/geo-verify` (protected by `CRON_SECRET` header like existing crons): selects cycles where `status IN ('shipped','verifying') AND nextVerifyAt <= now()`, caps per-invocation batch (default 25 cycles) and per-user concurrency, runs `runVerification`, advances `nextVerifyAt`. Failures set `nextVerifyAt = now + 6h` and are logged to Sentry/Langfuse; a cycle failing 5 consecutive verifications is set `status: archived` with a visible reason.

**Do not** use `lib/workflows/scheduler.ts` (in-memory/file-based, explicitly non-production). The cron path above is the production mechanism.

### Rate/cost guards

- Per-plan cap on active cycles (e.g. Starter 3, Pro 15) enforced in `startFixCycle` via `subscription-guard`.
- Engine probes go through existing AIsa/DataForSEO adapters; reuse `lib/redis/rate-limit.ts` buckets for the cron path.

## 6. Chat tools & artifacts (GEO mode)

New tools registered through `agent-router`/tool assembler for `geo` mode (and fix-cycle status also in SEO mode):

| Tool | Behavior |
|------|----------|
| `geo_start_fix_cycle` | Scan + fix plan + cycle creation in one call. Returns baseline scan result + fix plan + cycle ID. |
| `geo_mark_fix_shipped` | Marks shipped with optional URL; confirms verification schedule. |
| `geo_fix_cycle_status` | Lists user's cycles with latest deltas; single-cycle detail view. |

Artifacts (all **live** in `lib/artifacts/registry.ts`, renderers in `components/chat/tool-ui/`):

1. **Fix Cycle** — combines the existing brand-scan and fix-plan renderers with a status timeline (Scanned → Fix proposed → Shipped → Verifying → Verdict).
2. **Citation Delta report card** — the hero. Per-engine before/after rows (mentioned ✓/✗, sentiment, citations gained/lost, "your published fix is now cited by Perplexity" callout), headline mention-rate delta, verdict badge, methodology footnote (probe count, dates). Save-to-Workspace like other artifacts.

### Shareable report card

- `POST /api/geo/fix-cycles/[id]/share` generates `shareToken`; public route `/proof/[token]` renders a read-only, FlowIntent-branded report card (OG image included — this is the PH growth loop: every proof shared is an ad).
- No auth required to view; token is unguessable; owner can revoke.

### Dashboard surface

`/dashboard/geo/proof` (linked from sidebar as **Proof**): table of cycles with status, latest verdict, next verification time, and "share" action. Deep-links into chat for scan details. Keep it thin — chat remains the primary surface.

## 7. Reddit-gap bridge

On the full (post-email-gate) reddit-gap report, each gap gets a **"Win this in AI search"** CTA → signup → deep-link `/dashboard?mode=geo&query={gap question}&autostart=fix_cycle`. GEO mode pre-fills `geo_start_fix_cycle` with the gap question as the prompt. This turns the lead magnet into the top of the exact funnel the paid product monetizes: *the questions your buyers ask on Reddit, answered by ChatGPT with your brand cited.*

## 8. Production hardening of existing primitives (P0)

These block launch; the loop is only as credible as its weakest probe.

- **`geo_brand_scan`**: explicit per-engine error states (timeout, adapter failure, empty answer) rendered distinctly from "not mentioned" — never conflate a failed probe with invisibility. Retry once per engine. Baseline requires ≥2 engines succeeding or the cycle isn't created.
- **`geo_generate_fix`**: `estimatedImpact` copy must be labeled as heuristic, not measured (credibility). Fix plan must always reference the observed citation evidence (cited domains/types) that motivated it.
- **Engines**: launch claim stays ChatGPT, Perplexity, Google AI Overviews (per `DEFAULT_GEO_ENGINES`); Claude/Gemini remain available via config but out of marketing until probe reliability is measured.
- **Determinism disclosure**: report card footnote explains double-probe methodology and answer variance.
- Unit tests: `citation-delta.ts` (pure), verdict state machine, cron selection query. Integration test: full cycle with mocked adapters.

## 9. Credibility cleanup (ship with launch)

PH visitors will poke everything. Cheap, high-impact fixes:

- Hide all **planned** artifacts from user-visible surfaces — no "Coming soon" panels (`lib/artifacts/registry.ts` gains a `visible` flag; renderer skips planned types).
- Give SERP results a real table renderer (drop the raw-JSON fallback) or route SERP output through the existing `serp-table.tsx`.
- Decide Social mode: keep it (it's fully wired) and add it to the pitch, or remove it from the mode picker. Recommendation: keep, reposition as "demand discovery" feeding the loop.
- Remove/feature-flag dead surfaces: `/dashboard/workflow-analytics` (Coming Soon page), legacy `/api/aeo/*` mocked endpoints, `competitorAgentTool` hardcoded output.
- Quick Start grid: fix mismatched workflow IDs or remove entries that don't resolve.

## 10. Rollout plan

| Phase | Deliverable | Definition of done |
|-------|-------------|--------------------|
| **P0 — Primitives** | Hardened scan/fix, error UX, tests | Scan never shows false "invisible"; fix plans always cite evidence |
| **P1 — Loop core** | `geo_fix_cycles` + tools + cron verification + delta computation | Full cycle runs end-to-end in prod against a real brand; verdicts stable across 3 verification rounds |
| **P2 — Report card** | Citation Delta artifact + `/proof/[token]` share page + Proof dashboard | Shareable card renders with OG image; save-to-Workspace works |
| **P3 — Funnel + cleanup** | Reddit-gap CTA bridge + §9 cleanup | Gap → signup → autostarted cycle works; no Coming-soon surfaces reachable |
| **Launch** | PH assets | 60-second demo: scan a brand live → show fix → show a *pre-baked* real before/after proof card from beta users |

PH prep note: verification takes days, so seed 5–10 real beta cycles weeks before launch to have genuine before/after cards on launch day. The share page is the demo.

## 11. Risks

- **Engine nondeterminism** → double-probe + 2-consecutive-verdict rule + honest methodology footnote. Never overclaim single-run deltas.
- **Fix didn't work** (`no_change`/`regressed`) → this is a feature, not a failure: surface it honestly and auto-suggest the next fix type from `deriveRecommendedFixes`. Honesty is the differentiator.
- **Probe cost** → plan caps + batch limits; verification cadence defaults to every 3 days, not daily.
- **Attribution overclaim** → report card says "after you shipped X, this changed", never "X caused this". Copy review required before launch.
