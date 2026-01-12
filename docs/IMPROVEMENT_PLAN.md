# SEOBOT Improvement Plan

**Created:** 2026-01-12  
**Branch:** `feat/improvement-plan-2026`  
**Status:** Phase 1 In Progress

## Executive Summary

This plan addresses critical architectural issues in the SEOBOT codebase, focusing on:
1. **Critical Fixes (P0)** - Import violations, type safety, consistency
2. **Architecture Refactor (P1)** - Extract services, centralize tool registry
3. **Testing (P1)** - Add test coverage to core agents
4. **Quality Improvements (P2)** - Observability, caching, error handling

---

## Core Architecture (Reference)

| Component | Location | Lines | Purpose |
|-----------|----------|-------|---------|
| RAGWriterOrchestrator | `lib/agents/rag-writer-orchestrator.ts` | ~1143 | Content generation with EEAT feedback loop |
| SEOAEOAgent | `lib/agents/seo-aeo-agent.ts` | ~251 | SEO/AEO strategy generation |
| AgentRouter | `lib/agents/agent-router.ts` | ~650 | Routes queries to agents (onboarding, seo-aeo, content, general) |
| AgentRegistry | `lib/agents/registry.ts` | ~817 | Agent configs with AVAILABLE_TOOLS |
| Chat API Route | `app/api/chat/route.ts` | ~700+ | Main streaming endpoint (God Object) |
| MCP Wrappers | `lib/mcp/` | 79 files | Wrap auto-generated `mcps/` bindings |

### MCP Architecture

```
mcps/                          # Auto-generated via mcp-to-ai-sdk (NEVER EDIT)
  ├── mcp.dataforseo.com/      # 69 DataForSEO tools
  ├── mcp.jina.ai/             # 17 Jina tools
  └── mcp.firecrawl.dev/       # 9 Firecrawl tools

lib/mcp/                       # Wrappers (USE THESE)
  ├── dataforseo/              # Auth, errors, caching
  ├── jina/                    # Clean API wrappers
  └── firecrawl/               # Typed interfaces
```

**Rule**: NEVER import from `mcps/` directly. Always use `lib/mcp/` wrappers.

---

## Issues Found

### Critical (P0)

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| P0-1 | **MCP Import Violation** | `enhanced-research-agent.ts` line 9 | Bypasses auth/error handling wrappers |
| P0-2 | **Agent ID Mismatch** | Router uses `'seo-aeo'`, Registry uses `'seo_manager'` | Routing failures possible |
| P0-3 | **Inline Tool Results Untyped** | `chat/route.ts` ~line 450 | `as any` suppresses type errors |
| P0-4 | **Inconsistent Abort Signal Handling** | Multiple agents | Incomplete cleanup on abort |

### High (P1)

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| P1-1 | **Chat Route God Object** | `app/api/chat/route.ts` | 700+ lines handling everything |
| P1-2 | **Tool Definition Duplication** | `registry.ts`, `agent-router.ts`, `tools.ts`, `chat/route.ts` | 4 places defining same tools |
| P1-3 | **Zero Test Coverage** | Core agents | No regression protection |
| P1-4 | **MCP Tool Loading Scattered** | Multiple files | No central loader service |

### Medium (P2)

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| P2-1 | Telemetry split between Langfuse/LangWatch | Multiple | Observability fragmentation |
| P2-2 | Error handling inconsistent | Agents | No standard error types |
| P2-3 | Missing rate limiting | API routes | Potential abuse |
| P2-4 | No caching layer for MCP calls | `lib/mcp/` | Redundant API calls |

---

## Phase 1: Critical Fixes (P0) - Week 1-2

### 1.1 Fix MCP Import Violation
**Status:** COMPLETED

**File:** `lib/agents/enhanced-research-agent.ts`

**Change:**
```diff
- import { mcpFirecrawlTools } from '@/mcps/mcp.firecrawl.dev/fc-9b271ecf3a944c3faf93489565547fc8/v2/mcp/index'
+ import { mcpFirecrawlTools } from '@/lib/mcp/firecrawl/index'
```

### 1.2 Standardize Agent IDs
**Status:** PENDING

**Problem:** Router and Registry use different IDs for the same agents.

**Files:**
- `lib/agents/agent-router.ts` - Uses `'seo-aeo'`
- `lib/agents/registry.ts` - Uses `'seo_manager'`

**Solution:**
1. Create `lib/agents/constants.ts`:
```typescript
export const AGENT_IDS = {
  ONBOARDING: 'onboarding',
  SEO_AEO: 'seo-aeo',
  CONTENT: 'content',
  GENERAL: 'general',
} as const

export type AgentId = typeof AGENT_IDS[keyof typeof AGENT_IDS]
```

2. Update both files to import from constants

### 1.3 Add Type Safety to Inline Tool Results
**Status:** PENDING

**File:** `app/api/chat/route.ts`

**Problem:** Tool results cast with `as any` losing type safety.

**Solution:** Create proper types:
```typescript
interface InlineToolResult {
  toolCallId: string
  toolName: string
  result: unknown
  isError?: boolean
}

interface InlineDataResult {
  type: 'tool-result'
  data: InlineToolResult
}
```

### 1.4 Consistent Abort Signal Handling
**Status:** PENDING

**Files:**
- `lib/agents/rag-writer-orchestrator.ts`
- `lib/agents/enhanced-research-agent.ts`
- `lib/agents/seo-aeo-agent.ts`

**Solution:** Create `lib/agents/utils/abort-handler.ts`:
```typescript
export function checkAborted(signal?: AbortSignal, context?: string): void {
  if (signal?.aborted) {
    throw new DOMException(`Operation aborted${context ? `: ${context}` : ''}`, 'AbortError')
  }
}

export function withAbortCleanup<T>(
  signal: AbortSignal | undefined,
  cleanup: () => void,
  operation: () => Promise<T>
): Promise<T> {
  // Implementation with proper cleanup
}
```

---

## Phase 2: Architecture Refactor (P1) - Week 2-4

### 2.1 Extract ChatOrchestrator Service
**Status:** PENDING

**Current:** `app/api/chat/route.ts` is a 700+ line God Object handling:
- Authentication
- Agent routing
- Tool loading
- Message history
- Streaming
- Persistence
- Error handling

**Target Architecture:**
```
lib/chat/
├── orchestrator.ts        # Main orchestration logic
├── tool-loader.ts         # MCP tool loading
├── message-handler.ts     # History & persistence
├── stream-handler.ts      # Streaming response handling
└── types.ts               # Shared types

app/api/chat/route.ts      # Thin wrapper (~100 lines)
```

### 2.2 Centralize Tool Registry
**Status:** PENDING

**Problem:** Tools defined in 4 different locations.

**Solution:** Single source of truth in `lib/agents/tools/`:
```
lib/agents/tools/
├── index.ts               # Central registry export
├── definitions/           # Tool schemas (zod)
├── executors/             # Tool implementations
└── types.ts               # Tool types
```

### 2.3 Create ToolLoader Service
**Status:** PENDING

**Purpose:** Centralize MCP tool loading with:
- Caching
- Error handling
- Rate limiting
- Telemetry

```typescript
// lib/mcp/tool-loader.ts
export class ToolLoader {
  async loadTools(provider: 'dataforseo' | 'jina' | 'firecrawl'): Promise<Tool[]>
  async loadToolsForAgent(agentId: AgentId): Promise<Tool[]>
}
```

---

## Phase 3: Testing (P1) - Week 3-5

### 3.1 AgentRouter Unit Tests
**Status:** PENDING

**File:** `tests/unit/agents/agent-router.test.ts`

**Coverage:**
- Intent classification
- Agent selection
- Tool resolution
- Edge cases (ambiguous queries, fallback)

### 3.2 RAGWriterOrchestrator Integration Tests
**Status:** PENDING

**File:** `tests/integration/agents/rag-writer-orchestrator.test.ts`

**Coverage:**
- Full content generation flow
- EEAT feedback loop
- Quality scoring
- Error recovery

### 3.3 MCP Wrapper Tests
**Status:** PENDING

**Directory:** `tests/unit/mcp/`

**Coverage:**
- Auth handling
- Error wrapping
- Rate limiting
- Caching behavior

### 3.4 Chat API E2E Tests
**Status:** PENDING

**File:** `tests/e2e/chat-api.test.ts`

**Coverage:**
- Full request/response cycle
- Streaming behavior
- Tool execution
- Error handling

---

## Phase 4: Quality Improvements (P2) - Ongoing

### 4.1 Telemetry Consolidation
- Standardize on Langfuse
- Create tracing utilities
- Add cost tracking

### 4.2 Error Standardization
- Create `lib/errors/` with typed errors
- Implement graceful degradation
- Add retry logic

### 4.3 Caching Layer
- Add Redis/in-memory cache for MCP calls
- Implement cache invalidation
- Add cache metrics

### 4.4 Rate Limiting
- Add per-user rate limits
- Implement circuit breakers
- Add abuse detection

---

## Progress Tracking

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1.1 | COMPLETED | 100% |
| Phase 1.2 | PENDING | 0% |
| Phase 1.3 | PENDING | 0% |
| Phase 1.4 | PENDING | 0% |
| Phase 2 | NOT STARTED | 0% |
| Phase 3 | NOT STARTED | 0% |
| Phase 4 | NOT STARTED | 0% |

---

## Related Documents

- [Pending Improvements](./pending-improvements.md) - Previously completed bug fixes
- [Code Quality Improvements](./code-quality-improvements.md) - Additional quality issues
- [Abort Error Handling](./abort-error-handling.md) - Abort signal patterns

---

## Implementation Notes

### Anti-Patterns to Avoid

- **NEVER** use `as any` or `@ts-ignore`
- **NEVER** import from `mcps/` directly
- **NEVER** define tools in multiple places
- **NEVER** suppress type errors

### Best Practices

- Always use `lib/mcp/` wrappers for MCP tools
- Use shared constants for agent IDs
- Add telemetry spans to new code
- Write tests for new functionality
