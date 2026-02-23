# Architecture

**Analysis Date:** 2026-02-24

## Pattern Overview

**Overall:** Multi-Agent AI Platform with Workflow Orchestration

**Key Characteristics:**
- Next.js 16 App Router with Server Components
- Multi-agent routing system with intent classification
- Workflow engine for multi-step SEO/AEO processes
- MCP (Model Context Protocol) integration for external tools
- Serverless-first architecture with Neon PostgreSQL
- Real-time streaming chat with AI SDK v6

## Layers

### Presentation Layer
- **Purpose:** UI components and pages
- **Location:** `app/`, `components/`
- **Contains:** React Server Components, Client Components, UI primitives
- **Depends on:** API routes for data fetching
- **Used by:** End users via browser

**Key Patterns:**
- Server Components for data fetching and SEO
- Client Components for interactive features (chat, forms)
- shadcn/ui primitives in `components/ui/`

### API Layer
- **Purpose:** HTTP endpoints for data and streaming
- **Location:** `app/api/`
- **Contains:** Route handlers for chat, content, workflows, admin
- **Depends on:** lib/chat, lib/agents, lib/workflows
- **Used by:** Frontend pages, external integrations

**Key Files:**
- `app/api/chat/route.ts` - Main chat streaming endpoint
- `app/api/workflows/execute/route.ts` - Workflow execution
- `app/api/content/*/route.ts` - Content generation APIs
- `app/api/admin/*/route.ts` - Admin endpoints

### Agent Orchestration Layer
- **Purpose:** Route queries to specialized AI agents
- **Location:** `lib/agents/`, `lib/chat/`
- **Contains:** Agent router, intent classifier, tool assembly
- **Depends on:** MCP clients, external APIs
- **Used by:** Chat API, workflow engine

**Key Abstractions:**
- **AgentRouter** (`lib/agents/agent-router.ts`): Keyword-based routing to 5 agent types
- **IntentToolRouter** (`lib/agents/intent-tool-router.ts`): LLM-based classification
- **AgentRegistry** (`lib/agents/registry.ts`): Agent configurations and capabilities

### Workflow Engine Layer
- **Purpose:** Execute multi-step SEO workflows
- **Location:** `lib/workflows/`
- **Contains:** Workflow definitions, executor, orchestrator, engine
- **Depends on:** Agent orchestration, MCP tools
- **Used by:** Dashboard workflows API

**Key Abstractions:**
- **WorkflowEngine** (`lib/workflows/engine.ts`): Step execution with parallel/sequential support
- **WorkflowRegistry** (`lib/workflows/registry.ts`): 12 registered workflows
- **orchestratedWorkflows** (`lib/workflows/orchestrator.ts`): High-level workflow API

### MCP Integration Layer
- **Purpose:** External tool access via Model Context Protocol
- **Location:** `lib/mcp/`, `mcps/`
- **Contains:** DataForSEO, Jina, Firecrawl, Winston clients
- **Depends on:** `@ai-sdk/mcp`, external API keys
- **Used by:** Agent orchestration, workflow engine

**Architecture Pattern:**
- Auto-generated bindings in `mcps/` (never import directly)
- Wrapper clients in `lib/mcp/` that handle auth, errors, caching
- 70+ DataForSEO tools for SEO analytics
- 10+ Jina tools for web scraping and search
- 7+ Firecrawl tools for web crawling

### Data Layer
- **Purpose:** Persistent storage with vector search
- **Location:** `lib/db/`, `supabase/migrations/`
- **Contains:** Drizzle ORM schema, queries, vector search
- **Depends on:** Neon PostgreSQL, pgvector extension
- **Used by:** All business logic layers

**Key Tables:**
- `users` - Clerk user sync
- `conversations/messages` - Chat persistence
- `writing_frameworks/agent_documents` - RAG with 1536-dim embeddings
- `business_profiles/competitors/keywords/content` - Core business data
- `workflow_executions` - Workflow state persistence

## Data Flow

### Chat Message Flow:

1. **Request Entry** → `app/api/chat/route.ts`
2. **Rate Limiting** → Upstash Redis middleware
3. **Intent Classification** → `lib/chat/intent-classifier.ts`
   - LLM-based via IntentToolRouter
   - Keyword fallback via AgentRouter
4. **Agent Routing** → Returns agent type + confidence
5. **Tool Assembly** → `lib/chat/tool-assembler.ts`
   - Loads MCP tools for agent type
6. **Streaming Response** → `lib/chat/stream-builder.ts`
   - AI SDK streamText with tools
7. **Persistence** → Messages saved to Neon

### Workflow Execution Flow:

1. **Trigger** → Workflow ID + parameters
2. **Registry Lookup** → `lib/workflows/registry.ts`
3. **Engine Initialization** → `lib/workflows/engine.ts`
4. **Step Execution** → Parallel or sequential tool calls
5. **Checkpointing** → State saved for recovery
6. **Result Aggregation** → Combined output

### RAG Retrieval Flow:

1. **Query Embedding** → OpenAI text-embedding-3-small
2. **Vector Search** → `lib/db/vector-search.ts`
3. **Framework/Documents** → Matched by similarity
4. **Context Injection** → Added to agent system prompt

## Key Abstractions

### Agent System
- **Purpose:** Route queries to specialized agents
- **Files:** `lib/agents/agent-router.ts`, `lib/agents/registry.ts`
- **Pattern:** Registry + Router with keyword/LLM hybrid classification
- **Agents:** onboarding, seo-aeo, content, image, general

### Workflow System
- **Purpose:** Multi-step SEO campaign execution
- **Files:** `lib/workflows/definitions/*.ts`, `lib/workflows/engine.ts`
- **Pattern:** Declarative step definitions with dependency graph
- **Example Workflows:** competitor-analysis, rank-on-chatgpt, technical-seo-audit

### MCP Tool System
- **Purpose:** External API integration via standardized protocol
- **Files:** `lib/mcp/*/client.ts`
- **Pattern:** Generated bindings + wrapper clients with caching

### RAG System
- **Purpose:** Ground agent responses in knowledge base
- **Files:** `lib/db/vector-search.ts`, `lib/ai/content-rag.ts`
- **Pattern:** pgvector similarity search + context injection

## Entry Points

### Main Application Entry
- **Location:** `app/layout.tsx`
- **Responsibilities:** Clerk auth, AI state provider, font loading

### API Entry Points
- **Chat:** `app/api/chat/route.ts` - Primary chat interface
- **Workflows:** `app/api/workflows/execute/route.ts` - Campaign execution
- **Webhooks:** `app/api/webhooks/*` - Clerk, Polar

### Background Processing
- **Cron:** `app/api/cron/aggregate-learnings/route.ts` - Learning aggregation

## Error Handling

**Strategy:** Layered with graceful degradation

**Patterns:**
- API routes use `handleApiError` from `lib/errors/handlers.ts`
- Workflow engine has checkpoint recovery
- MCP clients have retry logic with circuit breaker
- Agent router has LLM → keyword fallback

**Recovery Mechanisms:**
- Workflow checkpoints in `workflowPersistence`
- Tool execution cache for idempotent calls
- Langfuse tracing for debugging

## Cross-Cutting Concerns

### Authentication
- **Approach:** Clerk with middleware.ts for route protection
- **Pattern:** `getCurrentUser()` in API routes
- **Admin Check:** `isAdmin()` function for admin routes

### Rate Limiting
- **Approach:** Upstash Redis sliding window
- **Files:** `lib/redis/rate-limit.ts`, `lib/middleware/rate-limit.ts`
- **Patterns:** Per-user and per-IP limits

### Observability
- **Logging:** Console with structured prefixes
- **Tracing:** Langfuse with OpenTelemetry
- **Analytics:** Workflow and tool execution metrics

### Caching
- **Approach:** In-memory Map for tool results (per-request)
- **Pattern:** Cache key = `toolName:params`

---

*Architecture analysis: 2026-02-24*
