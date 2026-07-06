# Workspace UI

This directory contains the Workspace browser components (saved library at `/dashboard/workspace`).

For project architecture, component patterns, and conventions, see:
- [AGENTS.md](../../AGENTS.md) — Main project knowledge base
- [components/AGENTS.md](../AGENTS.md) — React UI component overview
- [app/dashboard/agents.md](../../app/dashboard/agents.md) — Dashboard routes

## Key components

- Workspace browser, saved content grids, and library navigation
- Route: `/dashboard/workspace` (canonical)
- Legacy alias: `/dashboard/content-zone`

## Patterns

- User-facing label: **Workspace** (never Content Zone)
- Integrates with `app/api/library/` for CRUD operations
