# LIB - CORE BUSINESS LOGIC

Core business logic, AI agents, workflows, and external API integrations.

## KEY MODULES

| Module | Purpose | Key Files |
|--------|---------|-----------|
| `agents/` | AI agent orchestration | `registry.ts`, `agent-router.ts`, `tools.ts` |
| `ai/` | AI tooling, RAG | `content-rag.ts`, `domain-keyword-profiler.ts` |
| `mcp/` | MCP client wrappers | `dataforseo/`, `jina/`, `firecrawl/` |
| `workflows/` | Multi-step workflows | `executor.ts`, `definitions/` |
| `external-apis/` | Third-party APIs | `perplexity.ts`, `jina.ts`, `rytr.ts` |
| `analytics/` | Usage tracking | `usage-logger.ts`, `cost-estimator.ts` |
| `errors/` | Error handling | `retry.ts`, `graceful-degradation.ts` |

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new AI agent | `agents/` | Create file, register in `registry.ts` |
| Add agent tools | `agents/tools.ts` | Define tool schemas with zod |
| Add workflow | `workflows/definitions/` | Create definition, register in `registry.ts` |
| Add MCP wrapper | `mcp/{provider}/` | Wrap auto-generated mcps/ bindings |
| Add external API | `external-apis/` | Follow existing service pattern |
| RAG retrieval | `ai/content-rag.ts` | Document embedding & retrieval |

## PATTERNS

### Agent Registry Pattern
```typescript
// lib/agents/registry.ts
export const agentRegistry = {
  'content-writer': contentWriterAgent,
  'research': researchAgent,
  // Add new agents here
}
```

### Workflow Definition Pattern
```typescript
// lib/workflows/definitions/my-workflow.ts
export const myWorkflow: WorkflowDefinition = {
  id: 'my-workflow',
  name: 'My Workflow',
  steps: [...],
}
```

### MCP Wrapper Pattern
- Auto-generated bindings in `mcps/` - never import directly
- Create wrappers in `lib/mcp/{provider}/` that handle auth, errors, caching

## ANTI-PATTERNS

- **NEVER** import from `mcps/` directly - use `lib/mcp/` wrappers
- **NEVER** bypass agent-router for tool execution
- **NEVER** hardcode model names - use config
