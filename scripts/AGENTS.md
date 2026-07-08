# scripts — Build, Deploy & Utility Scripts

See [AGENTS.md](../AGENTS.md) for the main project knowledge base.

## Purpose

One-off scripts, seeders, migrations, and deployment helpers.

## Key Scripts

- `apply-migration.ts` / `apply-geo-tracking-migration.ts` — Database migration runners
- `backfill-costs.ts` — Cost data backfill
- `create-test-user.*` — Test user creation (cjs, mjs, ps1)
- `discover-rytr-use-cases*.ts` — Research scripts
- `deploy/` — Deployment automation

## Conventions

- Scripts are **not** part of the app runtime — run them manually or via CI.
- Keep scripts typed (TypeScript) when possible.
- Prefer `npm run <script>` aliases for common operations.
