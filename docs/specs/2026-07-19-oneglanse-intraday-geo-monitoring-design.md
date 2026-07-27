# OneGlanse Intraday GEO Monitoring

**Date:** 2026-07-19

**Status:** Proposed; architecture selected, implementation not started

**Product:** FlowIntent GEO / AEO mode

**Supersedes:** The geomode/Elmo collection-engine decision in `2026-06-12-geomode-geo-tracking-design.md`. The companion, digest, Neon sync, and evidence-first ideas remain useful.

## Summary

FlowIntent will use OneGlanse as its canonical real-UI GEO measurement engine. OneGlanse will run as a private Docker stack on the Hermes Ubuntu VPS and will use authenticated ChatGPT, Claude, Gemini, Perplexity, and Google AI Overview sessions. Browser traffic will leave through a ThorData residential proxy using a sticky session for the duration of each provider run.

FlowIntent remains the product and control plane. It owns business profiles, prompt-set versions, cadence, run state, insight batches, tactics, billing limits, and the GEO chat experience in Neon/Vercel. OneGlanse owns browser execution, provider session persistence, raw UI capture, citation extraction, and its local operational stores.

New customers receive an activation burst: one immediate wave after their business profile is complete, followed by four staggered waves in their local day. Each wave repeats a small sentinel set and runs one rotating prompt cohort. This produces five fresh insight opportunities while covering the complete canonical prompt set once per day. After seven days, the default drops to two waves per day unless the plan or an active investigation justifies more.

Prompts and tactics are durable records, not regenerated on every run. Prompt wording is frozen within a version. Results are compared only against the same prompt, provider, locale, and version. Tactics are upserted by a stable key and change only when new evidence is materially different.

## Why this design

### Selected: FlowIntent control plane plus a private OneGlanse execution plane

This gives FlowIntent control over the customer experience and measurement policy while reusing OneGlanse's purpose-built browser stack.

- FlowIntent can deliver immediate onboarding value, plan-aware limits, prompt versioning, and persistent tactics.
- OneGlanse already provides Camoufox, Playwright, BullMQ, Redis, PostgreSQL, ClickHouse, provider authentication, real-UI extraction, and response analysis.
- Browser jobs do not occupy a Vercel request or depend on a serverless execution timeout.
- Raw provider sessions remain on infrastructure we control.
- The bridge is a narrow integration boundary that can tolerate upstream OneGlanse changes.

### Rejected: five complete OneGlanse sweeps per day

Five full all-prompt/all-provider sweeps create little additional product value compared with five staggered waves. They multiply browser volume, provider-account pressure, proxy traffic, analysis cost, and repeated recommendations. OneGlanse currently schedules the selected prompt set at workspace level, so native five-times-daily scheduling would execute the entire selected set each time.

### Rejected: Cloudflare Worker or Cloudflare Browser Rendering as the browser host

OneGlanse depends on its own Camoufox runtime, persistent authenticated profiles, BullMQ workers, Redis, PostgreSQL, and ClickHouse. A Cloudflare Worker is not a host for that stack. Cloudflare may still provide Tunnel and Access around the private administration surface, but it is not the execution runtime.

### Rejected: Vercel Sandbox as the long-lived browser host

The browser identities and provider sessions need durable disk, stable service processes, and controlled outbound proxy routing. An ephemeral sandbox is useful for isolated code execution, not for these long-lived browser profiles.

## Verified upstream assumptions

The design was checked against OneGlanse upstream commit `f40b3360b7afe491d9473ba2290e395d3f94954b` on 2026-07-19.

- [OneGlanse](https://github.com/aryamantodkar/oneglanse) is MIT licensed and explicitly supports real-UI collection for ChatGPT, Claude, Gemini, Perplexity, and Google AI Overview.
- Its self-hosted stack contains a Next.js web app, a Camoufox/Playwright worker, BullMQ/Redis, PostgreSQL, and ClickHouse.
- Provider browser sessions are captured locally and uploaded to the VPS as portable auth bundles; persistent runtime profiles are stored on the execution host.
- OneGlanse recommends a residential proxy for VPS operation and documents `THORDATA_PROXY_API_URL`.
- ThorData documents sticky residential sessions for up to 90 minutes. A sticky session must cover a complete provider run; locale and country must remain consistent for a measurement series.
- OneGlanse's current scheduler stores one cron expression and one selected prompt set per workspace. A small subset-run extension is therefore required for FlowIntent's five cohorts.
- OneGlanse does not currently publish versioned GitHub releases. Production deployment must pin a reviewed commit or image digest rather than tracking `main` automatically.

Sources:

- [OneGlanse repository and architecture](https://github.com/aryamantodkar/oneglanse)
- [OneGlanse self-host documentation](https://docs.oneglanse.com/self-hosted-setup)
- [ThorData session control](https://doc.thordata.com/doc/proxies/residential-proxies/session-control)

## System boundary

```text
FlowIntent / Vercel                    Hermes VPS / private Docker network
----------------------------------     --------------------------------------
Business profile                       OneGlanse web and internal API
Prompt sets and versions               OneGlanse PostgreSQL
Activation/cadence policy              OneGlanse ClickHouse
Run manifests and idempotency          OneGlanse Redis/BullMQ
Normalized geo_runs               <--- FlowIntent bridge
Insight batches                        Camoufox provider workers
Durable tactics                        Persistent provider profiles
GEO chat and artifacts                 ThorData sticky residential egress
             |                                      |
             +----- signed HTTPS, outbound only ----+
                                                    |
                                ChatGPT / Claude / Gemini /
                                Perplexity / Google AI Overview
```

### Network model

- No PostgreSQL, ClickHouse, Redis, Camoufox, or worker port is exposed publicly.
- The bridge makes outbound HTTPS calls to FlowIntent to claim work and submit results.
- OneGlanse administration is reachable only through Tailscale or Cloudflare Tunnel plus Access.
- Provider-auth upload uses Tailscale or a tightly protected Access route. Port `3333` is not opened to the public internet.
- Secrets live in the VPS secret environment and Vercel environment, never in repository files or run payload logs.

## Responsibility split

### FlowIntent owns

- Customer and business-profile identity.
- The canonical prompt-set definition and version history.
- Cohort assignment, sentinel flags, locale, target region, and enabled providers.
- Activation and steady-state cadence.
- Run idempotency, entitlements, quotas, and manual refresh requests.
- Normalized result history in `geo_runs`.
- Evidence diffs, insight batches, tactic lifecycle, and GEO chat presentation.
- Canonical versus control-measurement labeling.

### OneGlanse owns

- Browser automation and provider-specific selectors.
- Auth bundle import and persistent runtime profiles.
- ThorData proxy use inside provider sessions.
- Provider run serialization and retries.
- Raw response text, rendered citations, provider timestamps, and execution diagnostics.
- Its local operational PostgreSQL, ClickHouse, and Redis data.

### The FlowIntent bridge owns

- Mapping a FlowIntent user to one OneGlanse workspace.
- Synchronizing active prompt versions into that workspace.
- Submitting an explicit prompt subset for each wave.
- Watching OneGlanse job completion without holding a Vercel request open.
- Reading completed raw and analyzed rows locally.
- Normalizing and signing result batches sent to FlowIntent.
- Recording provider/session health and reporting degraded runs.

The existing `services/geomode-companion` concepts should be retained, but the service should become provider-neutral before production. It should expose a source adapter interface and use a OneGlanse adapter as the canonical implementation. Renaming the package is optional in the first pilot and required before the old geomode terminology becomes user-facing or operationally confusing.

## Narrow OneGlanse extension

OneGlanse's native `submitAgentJobGroup()` loads either all workspace prompts or the workspace's persisted `selectedPromptIds`. FlowIntent needs to submit a different cohort without mutating shared selection state.

Maintain one small patch in a FlowIntent fork:

1. Add optional `promptIds` to the internal `runPrompts` input.
2. Pass `promptIds` to `submitAgentJobGroup()`.
3. Filter the already loaded workspace prompts by that explicit list for this job only.
4. Preserve existing behavior when `promptIds` is absent.
5. Include a caller-supplied FlowIntent run ID in job metadata for idempotent result correlation.

This patch must have contract tests and should be proposed upstream. Do not make FlowIntent depend directly on private BullMQ job payloads or mutate `selectedPromptIds` immediately before a run; both approaches are more brittle and introduce races.

## Activation and cadence

### Activation trigger

There is no onboarding gate. Monitoring bootstraps when all of the following become true:

- the user is authenticated;
- the business profile has a normalized brand name and website;
- the monitoring entitlement is active;
- no active prompt set exists for the current profile fingerprint.

The trigger may occur after the business-profile form is saved or when GEO chat first has enough information. It must be idempotent.

### Seven-day activation burst

For the first seven calendar days after activation:

- Wave 0 runs immediately.
- Waves 1–4 run in five user-local windows, with per-user jitter to avoid a queue stampede.
- Suggested windows are 07:30, 10:30, 13:30, 16:30, and 19:30 local time.
- If activation happens mid-day, the immediate wave replaces the next scheduled window; remaining cohorts are distributed across the next available windows.
- Missed waves are not all replayed at once. At most one catch-up wave is queued, and the next day continues normally.

### Steady state

After day seven:

- Default to two waves per day: morning and late afternoon in the user's locale.
- Retain the same sentinel prompts.
- Rotate cohorts so the complete prompt inventory remains covered at least daily or according to plan entitlement.
- Temporarily raise cadence when the user starts an investigation, changes positioning, adds a competitor, or marks a tactic implemented.

### Wave composition

The launch default is intentionally small:

- Two sentinel prompts in every wave.
- Two or three cohort prompts in each wave.
- Five cohorts, assigned deterministically by stable prompt key.
- Up to five providers when authenticated and entitled.
- A maximum of five prompts per provider per wave during the trial.

This means a maximum of 25 UI captures per wave and 125 captures per user per activation day when all five providers are enabled. Global provider concurrency remains one per provider in the initial deployment. Plan limits and a global daily safety ceiling must be enforced before enqueueing.

## Prompt lifecycle

### Generate once, measure repeatedly

The first prompt set is generated from:

- brand name, domain, aliases, industry, products, locations, and audience;
- the user's confirmed competitors;
- website language and positioning extracted from the canonical site;
- high-value category and comparison intents;
- user locale and target market.

Firecrawl or Jina may enrich the website context used to create or refresh prompts. They do not replace OneGlanse for real AI-interface measurement.

The initial inventory should cover:

- category discovery;
- best-of and shortlist questions;
- competitor comparisons;
- alternatives and switching questions;
- problem/solution questions;
- trust, pricing, and suitability questions;
- branded factual or hallucination-risk questions.

### Stability rules

- Prompt text is immutable within an active prompt-set version.
- Every prompt has a stable semantic key and a SHA-256 content hash.
- Prompt edits create a new prompt record in a new set version.
- Historical runs retain their original prompt ID, text, version, locale, and provider.
- A profile fingerprint prevents unnecessary regeneration.
- Prompt discovery runs weekly at most and creates a draft candidate set; it does not silently replace the active set.
- Material profile, locale, competitor, or product changes may create a new candidate version immediately.
- Activation requires an explicit system rule or user action; old and new versions must not be mixed in a comparison.

### Sentinel selection

Sentinels are the two highest-value, broadest buyer questions. They repeat every wave and provide true intraday comparability. Cohort prompts provide breadth without repeating the entire inventory.

## Data model

The exact migration may be adjusted to existing Drizzle conventions, but these concepts are required.

### `geo_prompt_sets`

- `id`, `user_id`, `version`
- `status`: `draft`, `active`, `superseded`, `archived`
- `profile_fingerprint`
- `generation_reason`
- `locale`, `target_region`, `timezone`
- `activated_at`, `superseded_at`, `created_at`
- unique `(user_id, version)` and at most one active set per user

### Extend `geo_prompts`

- `prompt_set_id`
- `stable_key`
- `prompt_hash`
- `cohort`: `0..4`
- `is_sentinel`
- `locale`, `target_region`
- keep `intent`, `topic`, `engines`, and `active`
- unique `(prompt_set_id, stable_key)`

### `geo_run_jobs`

- `id`, `user_id`, `prompt_set_id`
- `wave_index`, `run_kind`: `activation`, `scheduled`, `manual`, `verification`
- `scheduled_for`, `started_at`, `completed_at`
- `status`: `queued`, `claimed`, `running`, `partial`, `completed`, `failed`, `cancelled`
- `idempotency_key`
- `oneglanse_workspace_id`, `oneglanse_job_id`
- `attempt_count`, `last_error`, health metadata
- unique `idempotency_key`

### Extend `geo_runs`

- `geo_run_job_id`
- `prompt_hash`, `prompt_set_version`
- `locale`, `target_region`
- provider model or surface metadata when observable
- `canonical_source`: `oneglanse_ui`
- unique `(geo_run_job_id, geo_prompt_id, engine)`

The raw payload may retain OneGlanse details, but chat-facing code uses normalized columns and validated JSON contracts.

### `geo_insight_batches`

- one row per completed or partial wave;
- deterministic metric changes and a short evidence-grounded summary;
- provider health and missing coverage;
- references to new or updated tactic IDs;
- delivery status: `ready`, `seen`, `dismissed`.

### `geo_tactics`

- `id`, `user_id`, `tactic_key`
- `status`: `open`, `in_progress`, `done`, `dismissed`, `superseded`
- `category`, `priority`, `title`, `recommendation`
- `evidence_fingerprint`, `evidence_json`
- `first_seen_at`, `last_seen_at`, `cooldown_until`
- `source_prompt_id`, `source_run_id`, `superseded_by`
- unique `(user_id, tactic_key)`

### `geo_tactic_events`

Append-only audit events for creation, evidence refresh, priority change, dismissal, completion, reopening, and supersession. This preserves user decisions even when later runs disagree.

## Result ingestion and idempotency

1. FlowIntent creates a `geo_run_jobs` row with a unique idempotency key derived from user, prompt-set version, local date, and wave index.
2. The VPS bridge claims the job through a signed FlowIntent endpoint.
3. The bridge ensures the corresponding OneGlanse workspace and prompt records exist.
4. The bridge submits only that wave's sentinel and cohort prompt IDs.
5. OneGlanse executes providers independently and persists raw responses locally.
6. The bridge waits locally, then reads completed results and analysis.
7. The bridge posts a signed normalized batch containing the FlowIntent run ID.
8. FlowIntent upserts `geo_runs` and marks the job `completed` or `partial`.
9. Duplicate result submissions are harmless because of the run/prompt/provider uniqueness constraint.
10. Insight and tactic processing runs only after the result transaction commits.

The bridge may retry result submission without rerunning the browser. Storage failure must never cause a second UI prompt automatically.

## Evidence and tactic lifecycle

### Deterministic comparison first

For every canonical result, compare it with the most recent result having the same:

- user;
- prompt stable key and prompt-set version;
- provider;
- locale and target region.

Calculate deterministic events before asking an LLM to summarize anything:

- brand mention gained or lost;
- absolute rank or recommendation tier changed;
- visibility or sentiment crossed a configured threshold;
- cited domains or URLs changed;
- a new competitor appeared or overtook the brand;
- a factual claim or hallucination signature appeared or disappeared;
- provider coverage failed or recovered.

### Materiality gate

Do not call the tactic generator for ordinary wording drift. Generate or update tactics only when:

- a categorical event occurs, such as a mention loss;
- a score change exceeds its threshold;
- the same weaker signal appears in two consecutive comparable runs;
- the user explicitly requests analysis of a run.

### Stable tactic identity

Build `tactic_key` from the user, intent/stable prompt key, provider or cross-provider scope, gap type, and relevant citation/source entity. The LLM supplies explanation and recommendation copy; it does not choose identity.

When the key already exists:

- preserve status and user notes;
- update `last_seen_at`, evidence, and confidence;
- avoid a new chat card during the cooldown unless severity increases;
- append a tactic event instead of creating a duplicate.

When evidence resolves:

- do not delete the tactic;
- mark it resolved only after the defined verification rule, normally two confirming comparable runs;
- retain the history so GEO chat can explain what changed.

## GEO chat integration

### Existing tool roles

- `geo_brand_scan` remains an on-demand AIsa/DataForSEO API measurement and must be labeled a control probe, not canonical UI evidence.
- `geo_setup_tracking` becomes the idempotent FlowIntent/OneGlanse provisioning tool.
- `geo_tracked_prompts` reads and manages FlowIntent's versioned prompt set, then synchronizes changes through the bridge.
- `geo_daily_digest` should evolve into `geo_latest_insights`; keep the old name temporarily as a compatibility alias.
- `geo_visibility_report` becomes asynchronous. It queues a verification run and returns status/artifact metadata rather than holding the chat request open for browser completion.

### Chat behavior

- On GEO chat entry, load the latest unseen `geo_insight_batches` row into mode context.
- Lead with what materially changed, not a complete run dump.
- Every claim links to provider, prompt, captured time, and evidence snippet.
- Show degraded coverage explicitly; never represent a missing provider as a negative brand result.
- Present no more than three priority tactics at once.
- Let users inspect the raw captured response and citations in an artifact.
- A manual refresh queues work and shows progress. Chat must not block for the browser result.
- When a user marks a tactic implemented, queue a verification wave at the next safe window instead of immediately hammering every provider.

### Canonical and control evidence

OneGlanse UI captures are canonical for UI visibility trends. DataForSEO/AIsa, Perplexity API, and AI Gateway probes remain useful controls. If OneGlanse is degraded, controls may be displayed separately but must not be written into the canonical UI time series or silently substituted.

## Scheduling and capacity controls

- Use the OneGlanse local BullMQ provider workers for browser execution.
- Use FlowIntent/Inngest or a database scheduler only to create due run manifests; do not execute Camoufox there.
- Add deterministic user jitter within each local window.
- Enforce one active wave per OneGlanse workspace.
- Keep OneGlanse's initial global concurrency of one per provider.
- Set a maximum queue age; stale activation waves become skipped rather than executing in a burst.
- Add per-user, per-plan, per-provider, and global daily ceilings.
- Stop scheduling a provider after repeated auth failures and surface reconnection status.
- Do not rotate residential IP inside a provider run. Use the same country and locale for comparable runs.
- Prefer a separate provider-account/proxy pool before raising worker concurrency.

## Failure behavior

- One provider fails: mark the job `partial`, ingest successful providers, and expose the missing provider.
- Provider session expires: pause that provider, preserve other providers, and request operator re-authentication.
- Proxy failure: retry the connection within the run policy; do not change geography silently.
- OneGlanse analysis fails after capture: ingest raw evidence as `analysis_pending` and retry analysis without rerunning the UI prompt.
- FlowIntent ingestion fails: retry the signed batch; do not rerun OneGlanse.
- Duplicate schedule event: idempotency constraint returns the existing job.
- Backlog exceeds safe age: skip lower-priority cohort work but retain sentinels and manual verification jobs.
- Upstream OneGlanse update breaks the bridge: remain on the pinned version and fail closed until contract tests pass.

## Security and compliance

- Use dedicated provider accounts for monitoring, not a founder's everyday accounts.
- Review provider terms and acceptable-use constraints before production use.
- Encrypt provider auth bundles and persistent-volume backups.
- Redact cookies, proxy credentials, prompts containing secrets, and response tokens from logs.
- Sign bridge requests with a rotating service secret and timestamp; reject replays.
- Scope bridge endpoints to claim, heartbeat, complete, and fail operations.
- Keep OneGlanse and its stores private; expose only the authenticated operator surface.
- Add a retention policy for raw UI responses and screenshots.
- Disable or explicitly approve optional upstream telemetry before production deployment.

## Rollout

### Phase 0: ThorData and OneGlanse trial

- Confirm Hermes has at least the recommended 8 GB RAM and sufficient disk for ClickHouse.
- Deploy a pinned OneGlanse commit privately on the VPS.
- Configure ThorData for one supported target country with sticky sessions.
- Capture and upload dedicated provider auth bundles.
- Run a five-provider smoke matrix with one harmless prompt.
- Record success rate, median duration, proxy traffic, session stability, and analysis cost.

Exit gate: at least four providers complete reliably across repeated runs; failures are diagnosable and no secret is publicly exposed.

### Phase 1: Canonical prompt sets and one wave

- Add prompt-set, run-job, and result-correlation schema.
- Generate and persist the first versioned prompt set.
- Implement the narrow OneGlanse subset-run patch and bridge contract.
- Execute one manual wave and ingest normalized evidence.
- Expose latest canonical evidence in GEO chat.

### Phase 2: Activation burst

- Add idempotent business-profile activation.
- Add five cohorts, sentinels, local-time windows, and jitter.
- Add plan/global safety ceilings and provider health pauses.
- Deliver five insight batches during the first seven days.

### Phase 3: Durable tactics

- Add deterministic diff events and materiality thresholds.
- Add tactic identity, lifecycle, audit events, cooldowns, and verification.
- Connect tactics to GEO chat and content/action tools.

### Phase 4: Operational hardening

- Add dashboards and alerts for queue age, auth health, provider success rate, capture duration, proxy consumption, and ingestion lag.
- Add backups and raw-response retention.
- Add a second provider-account/proxy pool only when measured capacity requires it.
- Reduce activation users to steady-state cadence automatically.

## Success measures

- Time from complete business profile to first canonical insight: target under 20 minutes when queues are healthy.
- Five activation insight windows delivered per local day without five full prompt-set sweeps.
- Complete canonical prompt coverage at least once per activation day.
- At least 90% provider-run success after the ThorData/session trial is stable.
- No duplicate `geo_runs` after retries.
- Less than 20% of waves create a new tactic; ordinary drift updates evidence without notification.
- Every tactic shown in chat contains provider, prompt, timestamp, and evidence.
- Provider failure is never interpreted as brand absence.

## Explicit non-goals for the first release

- Per-customer provider accounts or proxy endpoints.
- Unlimited five-wave monitoring after the activation period.
- Firecrawl as a replacement for authenticated AI UI collection.
- Automatic publication of suggested content changes.
- Silent substitution of API/model output for UI measurements.
- Tracking OneGlanse `main` without a pinned and tested version.
- High browser concurrency before account and proxy capacity are measured.

## Implementation decision

Proceed with the hybrid architecture and the five-wave activation model. The first implementation milestone is Phase 0 only: deploy and validate the pinned OneGlanse/ThorData stack on Hermes before changing FlowIntent's production schema or chat behavior.
