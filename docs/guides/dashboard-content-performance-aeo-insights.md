# Content Performance and AEO Insights Dashboards

This guide covers the new dashboards at:

- `/dashboard/content-performance`
- `/dashboard/aeo-insights`

## What changed

- Sidebar navigation now opens both pages inside the existing dashboard shell.
- The sidebar and header stay visible during page transitions.
- Both pages share a common analytics workspace frame:
  - toolbar (save view, export)
  - KPI strip
  - module tabs
  - action queue
  - history

## Data flow

- Core analytics are DataForSEO-first.
- Enrichment adds auxiliary evidence from Firecrawl, Jina, and Perplexity.
- Snapshot and refresh endpoints are available for both workspaces.

## API endpoints

- Content Performance:
  - `GET /api/dashboard/content-performance/snapshot`
  - `POST /api/dashboard/content-performance/refresh`
  - `POST /api/dashboard/content-performance/actions/:action`
- AEO:
  - `GET /api/dashboard/aeo/snapshot`
  - `POST /api/dashboard/aeo/refresh`
  - `POST /api/dashboard/aeo/actions/:action`

## Actions

Supported action names:

- `generate-brief`
- `launch-rewrite`
- `track-query-set`

Each action route returns a queued job payload with trace metadata.

## UI constraints

- The dashboards follow a black/grey/white palette only.
- No non-grayscale accent palette is used in these workspace surfaces.
