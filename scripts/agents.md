# Scripts

This directory contains utility scripts, seeders, validators, and one-off tooling.

For project architecture, conventions, and agent patterns, see:
- [AGENTS.md](../AGENTS.md) — Main project knowledge base
- [lib/AGENTS.md](../lib/AGENTS.md) — Core business logic and MCP integrations

## Common scripts

- `validate-env.ts` — Environment variable validation (run as `prebuild`)
- `seed-rag-documents.ts` — Seed RAG documents for chat modes
- `seed-frameworks.ts` — Seed framework data into the database
- `evaluate-chatbot.ts` — Chatbot evaluation harness
