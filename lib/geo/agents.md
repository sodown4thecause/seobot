# GEO

This directory contains GEO/AEO analysis tools and the Elmo client integration.

For project architecture, GEO patterns, and conventions, see:
- [AGENTS.md](../../AGENTS.md) — Main project knowledge base
- [lib/AGENTS.md](../AGENTS.md) — Core business logic overview

## Key files

- `lib/geo/elmo-client.ts` — Elmo (GEO tracking) client
- `lib/geo/brand-tracker.ts` — Brand tracking logic
- `lib/geo/digest-service.ts` — GEO digest generation

## Patterns

- GEO and AEO share one lane in chat modes
- Supported engines: ChatGPT, Perplexity, Google AI Overviews
- Geomode stack on Ubuntu VPS; spec in `docs/specs/2026-06-12-geomode-geo-tracking-design.md`
- Served at geo.flowintent.com
