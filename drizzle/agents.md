# Drizzle

This directory contains Drizzle ORM SQL migrations and metadata for the Neon database.

For project architecture, database schema, and conventions, see:
- [AGENTS.md](../AGENTS.md) — Main project knowledge base
- [lib/AGENTS.md](../lib/AGENTS.md) — Core business logic and schema references

## Key files

- `drizzle.config.ts` — Drizzle Kit configuration (at project root)
- `drizzle/meta/` — Migration metadata
- `drizzle/0000_*.sql` — Individual migration files

## Note

Schema source of truth is `lib/db/schema.ts`. Generate migrations with `drizzle-kit`.
