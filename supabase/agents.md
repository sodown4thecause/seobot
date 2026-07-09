# Supabase

This directory contains Supabase-related configuration and migrations.

For project architecture, database schema, and conventions, see:
- [AGENTS.md](../AGENTS.md) — Main project knowledge base
- [lib/AGENTS.md](../lib/AGENTS.md) — Core business logic and database patterns
- [drizzle/agents.md](../drizzle/agents.md) — Drizzle ORM migrations

## Key directories

- `supabase/migrations/` — Supabase-specific migrations (if any)

## Note

Primary database is Neon with Drizzle ORM. Supabase is used for select features (e.g., auth, storage).
