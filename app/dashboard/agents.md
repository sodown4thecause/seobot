# Dashboard

This directory contains the paywalled dashboard pages and layouts.

For project architecture, routing, and UI conventions, see:
- [AGENTS.md](../../AGENTS.md) — Main project knowledge base
- [app/AGENTS.md](../AGENTS.md) — Next.js App Router overview
- [components/AGENTS.md](../../components/AGENTS.md) — React UI component patterns

## Key routes

- `app/dashboard/page.tsx` — Mode-aware chat (default dashboard view)
- `app/dashboard/workspace/` — Workspace browser (saved library)
- `app/dashboard/content-zone/` — Legacy workspace alias
- `app/dashboard/content/` — Content routes + brief builder

## Patterns

- Deep-link chat mode: `/dashboard?mode=seo|geo|content`
- Protected routes (auth + paywall required)
- Workspace is the canonical saved-content destination
