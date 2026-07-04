# geomode companion service

Nightly GEO/AEO digest pipeline for the geomode VPS stack. See `docs/specs/2026-06-12-geomode-geo-tracking-design.md`.

## Modules

- `src/jobs/collector.ts` — DataForSEO SERP snapshots
- `src/jobs/digest-builder.ts` — joins geomode + SERP into `companion.daily_digest`
- `src/jobs/suggestions.ts` — LLM suggestions (Zod-validated, one retry)
- `src/jobs/neon-sync.ts` — upserts into Neon `geo_tracking` schema
- `src/api/server.ts` — read API (`/digest/latest`, `/digest/:date`, `/trends`, `/health`)

## Local setup

```bash
cd services/geomode-companion
cp .env.example .env
npm install
npm run dev
```

## Deploy

Use `scripts/deploy/geomode-companion-compose.override.yml` alongside the geomode/Elmo compose stack and `scripts/deploy/cloudflared-geo.example.yml` for tunnel ingress.

Apply FlowIntent-side Neon migration:

```bash
# from repo root, against Neon
psql "$DATABASE_URL" -f drizzle/0007_geo_tracking.sql
```

Customize `migrations/002_elmo_summary_views.sql` once Elmo table names are confirmed on the VPS.
