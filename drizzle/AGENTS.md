# drizzle — Database Migrations & Schema

See [AGENTS.md](../AGENTS.md) for the main project knowledge base.

## Purpose

Drizzle ORM SQL migrations for Neon PostgreSQL.

## Structure

```
drizzle/
├── *.sql              # Migration files
├── meta/              # Migration metadata
└── *.ts               # Migration config / helpers
```

## Conventions

- Schema source of truth: `lib/db/schema.ts`
- Generate migrations: `npm run db:generate`
- Apply migrations: `npm run db:migrate`
- Do not edit `*.sql` files directly after generation.
