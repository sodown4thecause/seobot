# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An AI-powered SEO and content creation platform that combines competitive analysis, keyword research, and AI-powered writing. The platform uses a conversational AI interface powered by Vercel AI SDK with an advanced workflow system for orchestrating complex SEO operations.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, TailwindCSS, Supabase (PostgreSQL), Vercel AI SDK 6, OpenAI GPT-4o-mini

## Development Commands

### Build & Run
```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Production build
npm start                # Production server
```

### Code Quality
```bash
npm run typecheck        # Run TypeScript type checking (tsc --noEmit)
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint errors
```

### Database
```bash
# Migrations are in supabase/migrations/
# Apply migrations manually in Supabase dashboard
```

### Data Seeding
```bash
npm run seed:frameworks  # Seed writing frameworks for RAG
npm run seed:files       # Seed data from files
```

## Architecture

### Core AI System

**AI SDK 6 with ToolLoopAgent:**
- Main chat interface uses `ToolLoopAgent` with OpenAI GPT-4o-mini (better tool calling than Gemini)
- Streaming responses via `createAgentUIStreamResponse`
- MCP integration for DataForSEO tools (40+ SEO functions)
- RAG system for writing frameworks using embeddings
- Rate limiting via Upstash Redis

**Key AI Files:**
- `app/api/chat/route.ts` - Main chat endpoint with ToolLoopAgent
- `lib/ai/dataforseo-tools.ts` - DataForSEO tool call handler
- `lib/ai/rag-service.ts` - RAG for writing frameworks
- `lib/mcp/dataforseo-client.ts` - MCP client for DataForSEO server

### Workflow System

**Production-ready workflow orchestration** for complex SEO tasks (see `WORKFLOW_SYSTEM_COMPLETE.md`):

**Key Workflow Files:**
- `lib/workflows/engine.ts` - Executes steps with parallel/sequential support
- `lib/workflows/executor.ts` - High-level API with parameter substitution
- `lib/workflows/registry.ts` - Workflow definitions registry
- `lib/workflows/detector.ts` - Detects workflow triggers in queries
- `lib/workflows/definitions/` - Individual workflow definitions

**Workflow Execution:**
1. User triggers workflow (button or chat query)
2. Detector extracts parameters from query (keywords, domains, etc.)
3. Executor substitutes parameters into workflow steps
4. Engine runs steps (supports parallel tool execution via `Promise.all()`)
5. Results cached in Redis, formatted for generative UI components
6. Components render actionable insights in chat

**Example Workflow:** "How to Rank on ChatGPT" workflow executes 5 phases:
- Research (parallel DataForSEO calls)
- Content analysis (parallel Jina scraping)
- Citation research (Perplexity)
- Strategy generation (AI analysis)
- Citation recommendations (formatted output)

### External API Integrations

**DataForSEO (via MCP):**
- MCP server at `https://mcp.dataforseo.com/http`
- 40+ SEO tools accessed via `getDataForSEOTools()`
- Requires Basic Auth with DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD
- Simplified filter schema for LLM compatibility
- Edge runtime compatible (uses Web APIs, not Node.js)

**Jina AI Reader:**
- Clean text extraction from URLs (returns markdown)
- Implementation: `lib/external-apis/jina.ts`
- Used for competitor content analysis

**Perplexity AI:**
- Citation-based research with authoritative sources
- Implementation: `lib/external-apis/perplexity.ts`
- Used for EEAT signal research

**Apify:**
- Social media scraping (Twitter, LinkedIn, Instagram)
- Implementation: `lib/api/apify.ts`
- Used for brand voice extraction

### Database Architecture

**Supabase Tables (see `supabase/migrations/`):**
- `business_profiles` - User business information
- `brand_voices` - Voice analysis with embeddings
- `competitors` - Tracked competitors with metrics
- `keywords` - Keyword opportunities
- `content` + `content_versions` - Generated content library
- `conversations` + `chat_messages` - Chat history
- `writing_frameworks` - RAG knowledge base (seed with `npm run seed:frameworks`)
- `notifications` - User alerts

**Key Patterns:**
- All tables have user_id foreign key to auth.users
- RLS policies enforce user isolation
- Embeddings stored as `vector(1536)` for OpenAI ada-002
- Timestamps: created_at, updated_at

### Component Structure

**Generative UI Components (`components/chat/generative-ui/`):**
- Components rendered dynamically based on workflow results
- Examples: `ai-platform-metrics.tsx`, `content-strategy.tsx`, `citation-recommendations.tsx`
- Use shadcn/ui components (Card, Badge, Button, etc.)
- Display complex SEO data in actionable formats

**Workflow UI (`components/workflows/`):**
- `workflow-selector.tsx` - Grid of workflow cards
- `workflow-progress.tsx` - Real-time step progress
- Displayed above chat interface in dashboard

**UI Library:** shadcn/ui components in `components/ui/`
- Uses Radix UI primitives + TailwindCSS
- Import path alias: `@/components/ui/*`

### Onboarding System

**Conversational onboarding** via multi-step chat flow:

**Steps (`lib/onboarding/state.ts`):**
1. Website analysis (Jina + Gemini)
2. Brand voice extraction (Apify + Gemini)
3. Competitor discovery (DataForSEO)
4. Keyword research (DataForSEO)

**Key Files:**
- `app/onboarding/page.tsx` - Main onboarding UI
- `lib/onboarding/prompts.ts` - Step-specific system prompts
- `app/api/onboarding/analyze-website/route.ts` - Website analysis endpoint

### Environment Configuration

**Required Environment Variables:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# AI Providers
GOOGLE_API_KEY                    # For Gemini models
OPENAI_API_KEY                    # For GPT models (chat uses this)

# SEO APIs
DATAFORSEO_LOGIN                  # Email
DATAFORSEO_PASSWORD               # Password
DATAFORSEO_MCP_URL                # MCP server URL (default: https://mcp.dataforseo.com/http)
DATAFORSEO_BASIC_AUTH             # Optional: Pre-encoded Basic auth

# External APIs
PERPLEXITY_API_KEY               # Citation research
JINA_API_KEY                     # Web scraping
APIFY_API_KEY                    # Social media scraping (optional)

# Cache & Rate Limiting
UPSTASH_REDIS_REST_URL           # Upstash Redis for caching/rate limiting
UPSTASH_REDIS_REST_TOKEN
```

**Validation:** Environment is validated on boot via `lib/config/env.ts` (Zod schemas). Server fails fast with helpful error messages if required vars are missing.

## Common Development Tasks

### Adding a New Workflow

1. Create workflow definition in `lib/workflows/definitions/my-workflow.ts`
2. Define steps with tools and parameters
3. Register in `lib/workflows/registry.ts`
4. Add trigger patterns in `lib/workflows/detector.ts`
5. Create generative UI component in `components/chat/generative-ui/` if needed

### Adding a New API Endpoint

1. Create route in `app/api/[name]/route.ts`
2. Use `export const runtime = 'edge'` for Edge Runtime
3. Import types from `lib/types/`
4. Use `createClient()` from `@/lib/supabase/server` for auth
5. Implement rate limiting via `rateLimitMiddleware`
6. Return typed `ApiResult<T>` or `ApiError`

### Working with DataForSEO MCP Tools

```typescript
import { getDataForSEOTools } from '@/lib/mcp/dataforseo-client'

// Get tools for AI SDK
const tools = await getDataForSEOTools()

// Use in ToolLoopAgent
const agent = new ToolLoopAgent({
  model: openai(CHAT_MODEL_ID),
  tools,
  // ...
})
```

### Testing Chat/Workflows

1. Start dev server: `npm run dev`
2. Navigate to `/dashboard`
3. Use workflow selector or type queries in chat
4. Check browser console for detailed logs
5. Monitor Redis for cache hits (if configured)

## Import Path Aliases

Use `@/*` for all imports:
```typescript
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { executeWorkflow } from '@/lib/workflows/executor'
```

## Edge Runtime Compatibility

**Chat API and workflows run on Edge Runtime:**
- Use Web APIs (fetch, btoa, TextEncoder) instead of Node.js APIs
- No `fs`, `path`, `Buffer` - use alternatives
- DataForSEO MCP client is Edge-compatible
- Redis client uses REST API (Upstash)

## Current Implementation Status

**Completed (75%):**
- Landing page, onboarding UI, chat interface
- All external API integrations (DataForSEO, Perplexity, Jina, Apify)
- Workflow system (production-ready)
- RAG for writing frameworks
- Database schema and migrations
- Type-safe services and API routes

**In Progress:**
- Competitor monitoring dashboard
- Analytics snapshots

**Planned:**
- CMS integrations (WordPress, Webflow)
- Link building automation
- Testing (unit, integration, E2E)

See `IMPLEMENTATION_STATUS.md` for detailed progress tracking.

## Performance Optimizations

**Workflow System:**
- Parallel tool execution reduces response time by 70%
- Smart caching with Redis (60-80% cache hit rate expected)
- Tiered caching: tool results → step results → workflow results

**AI SDK 6 Features:**
- `stopWhen` configuration prevents infinite loops
- Streaming errors handled via `onError` callback
- Message metadata tracked in `onFinish`
- Tool approval system for expensive operations

## Debugging

**Enable detailed logging:**
```typescript
// Check browser console for workflow execution logs
console.log('[Workflow Engine] ...')
console.log('[MCP] ...')
console.log('[Chat API] ...')
```

**Check rate limits:**
- Rate limit errors return 429 with retry-after header
- Check Upstash Redis dashboard for limit status

**TypeScript errors:**
```bash
npm run typecheck
# Currently ~1 error remaining (non-blocking)
```

## Key Technical Decisions

1. **OpenAI over Gemini for chat:** Better tool calling support, especially with MCP
2. **Edge Runtime:** Faster cold starts, global distribution, better for streaming
3. **MCP for DataForSEO:** Standardized protocol, auto-generated tool schemas, easier maintenance
4. **Workflow system over ad-hoc agents:** Predictable costs, faster execution, better UX
5. **Upstash Redis over in-memory:** Persistent cache across deployments, rate limiting support
