# API Routes

This directory contains Next.js App Router API route handlers.

For project architecture, routing patterns, and auth conventions, see:
- [AGENTS.md](../../AGENTS.md) — Main project knowledge base
- [app/AGENTS.md](../AGENTS.md) — Next.js App Router overview
- [lib/AGENTS.md](../../lib/AGENTS.md) — Core business logic and agent patterns

## Key route groups

- `app/api/chat/` — Streaming chat endpoints (mode-aware)
- `app/api/geo/` — GEO digest, health, trends, runs
- `app/api/library/` — Workspace save/list operations
- `app/api/content-zone/` — Brief builder API
- `app/api/dataforseo/` — DataForSEO proxy endpoints
- `app/api/cron/` — Scheduled research jobs
- `app/api/workflows/` — Workflow execution endpoints

## Patterns

- Auth via Better Auth (`lib/auth-config.ts`)
- Rate limiting via Upstash Redis (`lib/redis/rate-limit.ts`)
- Streaming responses with `toUIMessageStreamResponse()`
