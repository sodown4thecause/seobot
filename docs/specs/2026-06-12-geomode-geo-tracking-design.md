# geomode GEO/AEO Tracking Engine + Daily TUI Report — Design

**Date:** 2026-06-12
**Status:** Implemented in seobot (FlowIntent consumer + companion/TUI packages); VPS bring-up still required
**Repo under design:** [sodown4thecause/geomode](https://github.com/sodown4thecause/geomode) (fork of [Elmo](https://github.com/elmohq/elmo)) — companion service and TUI live there; this doc lives in seobot because FlowIntent is a consumer.

## Summary

geomode (an Elmo fork — open-source AI visibility tracking) runs on the existing Ubuntu VPS as the GEO/AEO data-collection engine. A single **companion service** in the same Docker Compose stack adds DataForSEO SERP collection, a nightly digest, LLM-generated suggestions, a sync to Neon (pgvector), and a small read API. Cloudflare Tunnel + Access expose the geomode web UI, the Elmo API (already consumed by FlowIntent's `lib/geo/elmo-client.ts` for live capture), and the read API. An Ink-based **TUI dashboard** runs on any PC and renders the daily report: past-day SEO/GEO data, prioritized AI suggestions, and long-term citation-source links to pursue.

## Decisions made

| Decision | Choice |
|---|---|
| geomode ↔ FlowIntent relationship | Data engine: geomode collects on the VPS; FlowIntent consumes |
| Database topology | Local VPS Postgres for geomode + companion; nightly sync of summaries/embeddings to Neon |
| DataForSEO collection | Sidecar collector in the companion service (not a fork modification) |
| Daily report form | Interactive TUI dashboard (Ink), runnable from any machine |
| AI suggestions | LLM call inside the VPS nightly job; structured output stored with digest |
| Access path | Cloudflare Tunnel + Access exposes web UI, Elmo API, and read API; TUI uses a service token |
| Build approach | One companion service container in the Compose stack; geomode fork stays untouched |

## Architecture

```
                         ┌─────────────────────────── VPS (Docker Compose) ──────────────────────────┐
                         │                                                                            │
  AI engines             │  ┌──────────────┐      ┌────────────────┐      ┌──────────────────────┐   │
  (ChatGPT, Perplexity,  │  │   geomode    │      │  local         │      │  companion service   │   │
  Gemini, AI Overviews,  │◄─┤  (Elmo fork, │─────►│  Postgres      │◄────►│  - DataForSEO collector  │
  Claude)                │  │  untouched)  │      │  (geomode +    │      │  - daily digest job  │   │
                         │  └──────────────┘      │  companion     │      │  - LLM suggestions   │   │
  DataForSEO API ────────┼──────────────────────► │  schemas)      │      │  - Neon sync         │   │
                         │                        └────────────────┘      │  - read API (HTTP)   │   │
                         │                                                └──────────┬───────────┘   │
                         │                ┌── cloudflared (tunnel) ───────────────────┤              │
                         └────────────────┼────────────────────────────────────────────┼─────────────┘
                                          │                                            │
                              Cloudflare Access (auth)                          nightly sync
                                          │                                            │
                  ┌───────────────────────┴────────────────────┐                       ▼
                  │ geomode web UI + Elmo API     read API     │             Neon (pgvector)
                  │ geo.<domain>                  geo-api.<domain>           geo_tracking schema
                  └────────┬──────────────────────────┬────────┘                       │
                           │                          │                                ▼
                FlowIntent live GEO capture       TUI on any PC            FlowIntent (Vercel, AI SDK)
                (lib/geo/elmo-client.ts)                                   reads synced daily data
```

Key properties:

- **geomode stays a clean fork.** No code changes; `git pull upstream` keeps working. It does Elmo's job: prompt tracking and citation analysis across ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews, with its own web dashboard.
- **One companion container** holds everything new, in `companion/` in the fork repo. It shares the local Postgres but owns a `companion` schema and reads geomode's tables read-only.
- **Nothing on the VPS is publicly exposed.** Only cloudflared makes outbound connections. Inbound traffic flows through Cloudflare Access.
- **Two consumption paths for FlowIntent:** live capture through the tunneled Elmo API (existing `lib/geo/elmo-client.ts`, gated by `GEO_ELMO_ENABLED`), and daily aggregates from the synced `geo_tracking` schema in Neon.

## Components

### 1. geomode (Elmo fork) — untouched
Deployed with its Docker Compose setup (`@elmohq/cli` or compose files directly). Configured with AI engine API keys. Tech stack per upstream: TypeScript, TanStack Start, PostgreSQL, pg-boss.

### 2. Companion service (`companion/`)
TypeScript/Node, single container, four modules:

- **DataForSEO collector** — pg-boss-scheduled daily. Pulls keyword rankings, SERP snapshots, and search volume for tracked domains/keywords into `companion.serp_*` tables. Credentials via `DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD` (same as seobot). Supports `--dry-run`.
- **Digest builder** — joins the past 24h of geomode data (mentions, citations, sentiment, share-of-voice deltas) with DataForSEO data (rank movements, SERP feature changes) into one `companion.daily_digest` row: a JSON document with a stable shape consumed by both the LLM and the TUI.
- **AI suggestion engine** — sends the digest to one env-configured LLM (Vercel AI Gateway or OpenRouter). Output contract (Zod-validated, one retry on invalid):
  - max **5 prioritized actions**, each citing specific evidence from the digest;
  - **long-term links to pursue**: citation sources that AI engines trust in the niche but don't yet cite the tracked brand from (derived from Elmo citation data);
  - quality bar: few high-evidence items, never generic advice.
- **Neon sync** — pushes digest, suggestions, and embeddings (one per digest section, for FlowIntent RAG) to the `geo_tracking` schema in Neon. Idempotent upserts keyed on digest date.

### 3. Read API
HTTP server in the companion container. Read-only endpoints:

- `GET /digest/latest`
- `GET /digest/:date`
- `GET /trends?days=30`
- `GET /health` — last-run status per job

Auth is delegated to Cloudflare Access (service token); the API itself stays simple.

### 4. cloudflared
Tunnel routes:
- `geo.<domain>` → geomode web UI + Elmo API (Cloudflare Access: user login; service token for FlowIntent's server-side calls)
- `geo-api.<domain>` → companion read API (Cloudflare Access service token)

### 5. TUI (`tui/` at the fork repo root)
Ink (React for terminals). Its own package so it can be installed via `npx`/global install without pulling in companion server dependencies. Reads `~/.config/geo-tui/config.json` (API base URL + Cloudflare Access service token). Views: daily digest overview, per-engine mentions/citations, keyword rank movers, AI suggestions, long-term links. Shows a warning banner when the digest is partial/degraded.

## Nightly pipeline (UTC)

| Time | Step |
|---|---|
| (Elmo's own schedule) | geomode prompt tracking runs |
| 03:00 | DataForSEO collection |
| 03:30 | Digest build |
| 03:45 | LLM suggestions |
| 04:00 | Neon sync |

Every step records status in `companion.job_runs` and retries with backoff via pg-boss.

## Error handling

- Source failure ⇒ digest still builds with that section marked **degraded**; the TUI shows a partial report with a warning banner — never a silent gap.
- LLM output failing Zod validation ⇒ one retry, then digest ships without suggestions (marked degraded).
- Neon sync is idempotent; reruns are safe.
- `/health` exposes per-job last-run status for monitoring.

## Environment variables (VPS `.env`)

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Local Postgres (shared with geomode stack) |
| `NEON_DATABASE_URL` | Neon sync target (`geo_tracking` schema) |
| `DATAFORSEO_USERNAME` / `DATAFORSEO_PASSWORD` | SERP collection (FlowIntent uses `DATAFORSEO_USERNAME`; Elmo template uses `DATAFORSEO_LOGIN`) |
| `AI_GATEWAY_API_KEY` (or `OPENROUTER_API_KEY`) + `SUGGESTIONS_MODEL` | Nightly suggestions |
| AI engine keys | Per Elmo's own configuration |

FlowIntent side (add to seobot env when geomode is live): `ELMO_API_URL`, `ELMO_API_KEY`. Optional feature flag: `GEO_ELMO_ENABLED=true`.

## Testing

- Unit tests for the digest builder against fixture data (highest-risk logic).
- Zod contract tests for the LLM suggestion output, including the retry path.
- TUI render tests with a fixture digest (normal + degraded).
- Collector `--dry-run` for verifying DataForSEO calls without writes.

## Out of scope (YAGNI)

- Modifying the geomode/Elmo fork internals.
- Multi-tenant support — single brand/site to start.
- Push notifications (Slack/email) — the TUI and FlowIntent are the surfaces; revisit later.
- Realtime sync to Neon — daily is the contract.

## Next step

Implementation plan via the writing-plans process, with phases roughly: (1) VPS stack bring-up (geomode + Postgres + cloudflared), (2) companion service skeleton + DataForSEO collector, (3) digest + LLM suggestions, (4) Neon sync + FlowIntent schema, (5) read API + TUI.
