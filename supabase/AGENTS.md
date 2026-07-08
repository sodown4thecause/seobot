# supabase — Supabase Configuration & Legacy Migrations

See [AGENTS.md](../AGENTS.md) for the main project knowledge base.

## Purpose

Supabase project configuration, legacy SQL migrations, and edge function templates.

## Status

- **Supabase is being phased out** in favor of Drizzle ORM + Neon.
- See `drizzle/` for current migrations.
- Keep this directory for reference until full migration is complete.

## Notes

- Do not add new Supabase-specific logic here.
- Migrate any remaining functions to `lib/` or `app/api/` routes.
