# types — Shared TypeScript Types

See [AGENTS.md](../AGENTS.md) for the main project knowledge base.

## Purpose

Shared TypeScript type definitions used across the application.

## Conventions

- Prefer types defined in `lib/` (co-located with logic) when possible.
- Use this directory for cross-cutting types (e.g., API contracts, shared enums, global types).
- Avoid duplicating types from `lib/db/schema.ts` — import from Drizzle types instead.
