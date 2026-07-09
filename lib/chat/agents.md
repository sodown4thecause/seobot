# Chat

This directory contains chat mode configuration, streaming logic, and persistence.

For project architecture, chat patterns, and conventions, see:
- [AGENTS.md](../../AGENTS.md) — Main project knowledge base
- [lib/AGENTS.md](../AGENTS.md) — Core business logic overview
- [components/chat/agents.md](../../components/chat/agents.md) — Chat UI components

## Key files

- `lib/chat/modes.ts` — Chat mode definitions, accents, deep links
- `lib/chat/stream-builder.ts` — Streaming response builder
- `lib/chat/tool-assembler.ts` — Tool assembly for agent execution
- `lib/chat/persistence.ts` — Chat history persistence

## Patterns

- Mode accents from `CHAT_MODE_ACCENT_CLASSES` — never hardcode per surface
- Three paywalled modes: SEO, GEO/AEO, Content
- `/reddit-gap` is the free lead magnet
