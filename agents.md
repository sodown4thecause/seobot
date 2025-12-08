# Agent Instructions

## ⚠️ CRITICAL: MCP Tools Usage (ALWAYS FOLLOW)

**These instructions MUST be followed for every task:**

### Augment Context Engine MCP
- **ALWAYS use `augment-context-engine_codebase-retrieval`** when searching through the codebase
- Use for semantic code search - it's more efficient than traditional search methods
- Example: "Where is the function that handles user authentication?"

### mgrep MCP
- **ALWAYS use `mgrep`** instead of normal grep/rg for file content searches
- Speeds up operations significantly and uses fewer tokens
- Example: `mgrep -m 10 "How are quality thresholds defined?"`

### Ref MCP
- **Use `Ref_ref_search_documentation`** for latest docs (AI SDK 6, Langfuse, etc.)
- Can also use Exa search through this MCP
- Always check latest docs before implementing features

### Supabase MCP
- **Use `supabase_apply_migration`** for DDL operations (schema changes)
- **Use `supabase_execute_sql`** for DML operations (data queries)
- **Use `supabase_list_tables`** to explore database schema

---

## Build, Lint, Test Commands

```bash
# Development
npm run dev                    # Start dev server (port 3000)
npm run build                  # Production build
npm run typecheck              # TypeScript check without emit

# Linting
npm run lint                   # Run ESLint
npm run lint:fix               # Auto-fix ESLint issues

# Testing
npm run test                   # Run all tests (watch mode)
npm run test:unit              # Run unit tests only
npm run test:integration       # Run integration tests only
npm run test:coverage          # Generate coverage report
vitest run path/to/test.test.ts  # Run single test file

# Database
npm run seed:frameworks        # Seed framework data
npm run seed:files            # Seed from files
```

---

## Code Style Guidelines

### Imports
- Use `@/` path alias for all imports: `import { foo } from '@/lib/utils'`
- Group imports: external → internal → types → styles
- Use named imports over default imports where possible

### Formatting
- **Strict TypeScript** (`strict: true`)
- Use **semicolons**, **single quotes** for strings
- 2-space indentation
- Use `const` over `let`, avoid `var`
- Prefer arrow functions for inline callbacks

### Types & Interfaces
- Define interfaces/types in dedicated files or at top of file
- Use `interface` for objects, `type` for unions/intersections
- Export types that cross file boundaries
- Use Zod schemas for runtime validation (`lib/types/`)

### Naming Conventions
- **Files**: kebab-case (`enhanced-research-agent.ts`)
- **Components**: PascalCase (`DataTable.tsx`)
- **Functions**: camelCase (`retrieveAgentDocuments()`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRIES`)
- **Interfaces/Types**: PascalCase (`EnhancedResearchParams`)

### Error Handling
- Use custom error classes from `lib/errors/types.ts`:
  - `AppError` - base error with metadata
  - `ProviderError` - external API failures
  - `ValidationError` - input validation
  - `RateLimitError` - rate limit exceeded
- Always include try/catch in async operations
- Log errors with context: `console.error('[Agent Name] Error:', error)`
- Use `isRetryable(error)` to determine retry logic

### Comments
- Use JSDoc for functions and classes
- Inline comments for complex logic only
- Include file-level comment explaining purpose

---

## Project Overview

**AI-Powered SEO Platform** with multi-agent architecture, RAG-enhanced content generation, and real-time SEO data integration.

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS, shadcn/ui
- **AI**: Vercel AI SDK 6 (multi-step tools), Gemini 2.0 Flash, GPT-4, Claude Sonnet 4, Perplexity
- **Database**: Supabase (PostgreSQL + pgvector for RAG)
- **Observability**: Langfuse (AI evaluation), Axiom (logging)
- **External APIs**: DataForSEO (40+ SEO tools), Firecrawl, Jina AI, Winston AI, Rytr

### Key Features
- **Multi-Agent System**: 5 specialized agents (Research, Writer, Scoring, QA, Orchestrator)
- **RAG Pipeline**: Cross-user learning with pgvector embeddings (1536-dim)
- **Quality Assurance**: EEAT compliance, automated scoring, revision loops
- **MCP Tools**: Static AI SDK tools via `mcp-to-ai-sdk` (located in `mcps/` folder)
- **Lead Magnet**: `/audit` tool for SEO audits

### Architecture
```
lib/agents/           # AI agents (research, writer, scoring, QA, orchestrator)
lib/ai/              # AI utilities (RAG, embeddings, tools)
lib/mcp/             # MCP client implementations
mcps/                # Generated MCP tools (DataForSEO, Jina, Firecrawl)
lib/errors/          # Error handling (types, handlers, retry logic)
app/api/             # API routes (chat, content, competitors, admin)
components/          # React components (organized by feature)
supabase/migrations/ # Database migrations
```

### Critical Files
- **Orchestrator**: `lib/agents/rag-writer-orchestrator.ts` - Main content pipeline
- **Quality Thresholds**: `lib/config/quality-thresholds.ts` - Scoring criteria
- **Error Types**: `lib/errors/types.ts` - Standardized errors
- **RAG System**: `lib/ai/content-rag.ts` - Vector search & retrieval
- **PRD**: `PRD.md` - Complete product requirements

### Database Schema (Key Tables)
- `content` - Generated articles with metadata
- `agent_documents` - RAG knowledge base (pgvector)
- `content_learnings` - Cross-user performance tracking
- `content_quality_reviews` - Quality assessment records
- `business_profiles` - User company information
