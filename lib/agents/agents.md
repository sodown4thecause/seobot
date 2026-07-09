# Agents

This directory contains AI agent orchestration logic.

For project architecture, agent patterns, and conventions, see:
- [AGENTS.md](../../AGENTS.md) — Main project knowledge base
- [lib/AGENTS.md](../AGENTS.md) — Core business logic overview

## Key files

- `lib/agents/agent-router.ts` — Central agent router (mode → agent + tools + RAG)
- `lib/agents/registry.ts` — Agent registry
- `lib/agents/tools.ts` — Shared tool definitions
- `lib/agents/constants.ts` — Agent constants
- `lib/agents/utils/` — Agent utilities (abort handling, etc.)

## Patterns

- Mode selects agent + tools + RAG filter (`agent_documents.mode`)
- Never bypass agent-router for tool execution
- Never import from `mcps/` directly — use `lib/mcp/` wrappers
