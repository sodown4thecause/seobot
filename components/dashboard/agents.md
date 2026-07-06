# Dashboard UI

This directory contains the dashboard shell, sidebar, navigation, and analytics widgets.

For project architecture, component patterns, and conventions, see:
- [AGENTS.md](../../AGENTS.md) — Main project knowledge base
- [components/AGENTS.md](../AGENTS.md) — React UI component overview
- [app/dashboard/agents.md](../../app/dashboard/agents.md) — Dashboard routes

## Key components

- `sidebar.tsx` — Dashboard navigation (links to `/dashboard/workspace`)
- Analytics widgets and paywall gates

## Patterns

- Sidebar links: Workspace → `/dashboard/workspace`
- Uses `CHAT_MODE_ACCENT_CLASSES` for mode-aware styling
- Framer Motion for animations; Recharts for charts
