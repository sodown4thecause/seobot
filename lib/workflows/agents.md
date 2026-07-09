# Workflows

This directory contains the multi-step workflow engine and definitions.

For project architecture, workflow patterns, and conventions, see:
- [AGENTS.md](../../AGENTS.md) — Main project knowledge base
- [lib/AGENTS.md](../AGENTS.md) — Core business logic overview

## Key files

- `lib/workflows/executor.ts` — Workflow execution engine
- `lib/workflows/definitions/` — Workflow definitions

## Patterns

- Workflows are executed via `app/api/workflows/` endpoints
- Definitions declare steps, dependencies, and agent assignments
