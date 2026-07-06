# LIB - CORE BUSINESS LOGIC

> Part of the project docs — see the root [`AGENTS.md`](../AGENTS.md) for the architecture index, diagram, and code guidelines.

Core business logic, AI agents, workflows, and external API integrations.

## KEY MODULES

| Module | Purpose | Key Files |
|--------|---------|-----------|
| `agents/` | AI agent orchestration | `agent-router.ts`, `registry.ts`, `tools.ts` |
| `artifacts/` | Artifact registry + chat sync | `registry.ts`, `sync-from-messages.ts`, `artifact-store.ts` |
| `chat/` | Modes, streaming, persistence | `modes.ts`, `stream-builder.ts`, `tool-assembler.ts` |
| `geo/` | GEO/AEO analysis + Elmo | `elmo-client.ts`, `brand-tracker.ts`, `digest-service.ts` |
| `ai/` | RAG, embeddings, content tools | `content-rag.ts`, `embedding.ts` |
| `mcp/` | MCP client wrappers | `dataforseo/`, `jina/`, `firecrawl/` |
| `workflows/` | Multi-step workflows | `executor.ts`, `definitions/` |
| `billing/` | Polar paywall | `subscription-guard.ts` |
| `auth-config.ts` | Better Auth server config | — |

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new AI agent | `agents/` | Register in `registry.ts` |
| Route mode → agent | `agents/agent-router.ts` | Respects `ChatMode` |
| Add artifact type | `artifacts/registry.ts` | Map tool names → panel IDs |
| Add chat mode config | `chat/modes.ts` | `CHAT_MODE_UI`, accents |
| Add GEO tool | `geo/` | Wire in `agent-router.ts` |
| Add MCP wrapper | `mcp/{provider}/` | Never import `mcps/` directly |
| RAG retrieval | `ai/content-rag.ts` | Filter by `agent_documents.mode` |
| Product copy | `product/elevator-pitch.ts` | Single source for marketing |

## PATTERNS

### Mode-aware agent routing
```typescript
// lib/agents/agent-router.ts selects agent + tools from ChatMode
// RAG filters agent_documents.mode to match seo | geo | content
```

### Artifact registry
```typescript
// lib/artifacts/registry.ts — ARTIFACT_REGISTRY maps types → tools → panel IDs
// lib/artifacts/sync-from-messages.ts — hydrates artifact store from chat
```

### MCP Wrapper Pattern
- Auto-generated bindings in `mcps/` — never import directly
- Wrappers in `lib/mcp/{provider}/` handle auth, errors, caching

## ANTI-PATTERNS

- **NEVER** import from `mcps/` directly
- **NEVER** bypass agent-router for tool execution
- **NEVER** hardcode model names — use AI Gateway config
- **NEVER** mix RAG modes without explicit user intent
