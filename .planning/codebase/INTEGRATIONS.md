# External Integrations

**Analysis Date:** 2026-02-24

## APIs & External Services

**AI/LLM Providers:**
- **OpenAI** - GPT models for content generation
  - SDK: `openai` package (6.9.1)
  - Env: `OPENAI_API_KEY`
  - Usage: Content writing, embeddings, chat

- **Anthropic** - Claude models
  - SDK: `@ai-sdk/anthropic` (3.0.23)
  - Usage: Agent reasoning, long-context tasks

- **Google/Gemini** - Gemini models
  - SDK: `@google/genai` (1.31.0), `@google/generative-ai` (0.24.1)
  - Via AI SDK: `@ai-sdk/google` (3.0.13)
  - Env: `GOOGLE_API_KEY`
  - Modes: Gateway or direct (`DIAGNOSTIC_GEMINI_MODE`)

- **DeepSeek** - DeepSeek models
  - SDK: `@ai-sdk/deepseek` (2.0.11)
  - Usage: Cost-effective inference

- **Perplexity** - Sonar models with citations
  - SDK: `@ai-sdk/perplexity` (3.0.11)
  - SDK: Custom `lib/external-apis/perplexity.ts`
  - Env: `PERPLEXITY_API_KEY`
  - Models: `DIAGNOSTIC_PERPLEXITY_MODEL=sonar`

- **xAI/Grok** - Grok models
  - Env: `XAI_API_KEY`
  - Models: `DIAGNOSTIC_GROK_MODEL=grok-2-latest`

**Vercel AI Gateway:**
- Service: AI Gateway for unified model access
  - SDK: `@ai-sdk/gateway` (3.0.22)
  - Env: `AI_GATEWAY_API_KEY`, `AI_GATEWAY_BASE_URL`
  - Purpose: Rate limiting, caching, unified API

**SEO Data Providers:**
- **DataForSEO** - Comprehensive SEO data API
  - Integration: MCP tools (50+ endpoints)
  - Location: `lib/mcp/dataforseo/`
  - Auth: `DATAFORSEO_USERNAME`, `DATAFORSEO_PASSWORD`
  - Tools: SERP, keywords, backlinks, content analysis, domain analytics
  - Generation: `npm run mcp:generate:dataforseo`

- **Jina AI** - Web search and content extraction
  - Integration: MCP tools
  - Location: `lib/mcp/jina/`
  - SDK: `lib/external-apis/jina.ts`
  - Env: `JINA_API_KEY`
  - Tools: Web search, URL reading, arXiv search, image search, deduplication

- **Firecrawl** - Web scraping and extraction
  - Integration: MCP tools
  - Location: `lib/mcp/firecrawl/`
  - Env: `FIRECRAWL_API_KEY`
  - Tools: Scrape, crawl, map, extract, agent

- **Winston AI** - AI content detection
  - SDK: `lib/external-apis/winston-ai.ts`
  - Location: `lib/mcp/winston-client.ts`
  - Purpose: Humanization scoring

**Content Generation:**
- **Rytr** - AI writing assistant
  - SDK: `lib/external-apis/rytr.ts`
  - Purpose: Alternative content generation

- **Humanization Service** - Content humanization
  - SDK: `lib/external-apis/humanization-service.ts`
  - Purpose: AI detection evasion

- **Gradio AI Detector** - AI detection via Gradio
  - SDK: `lib/external-apis/gradio-ai-detector.ts`
  - Dev dependency: `@gradio/client` (2.0.0)
  - Purpose: AI content scoring

## Data Storage

**Primary Database:**
- **Neon PostgreSQL** - Serverless Postgres
  - Driver: `@neondatabase/serverless` (1.0.2)
  - ORM: Drizzle ORM (0.45.1)
  - Connection: `DATABASE_URL` env var
  - Features: pgvector extension for embeddings
  - Schema: `lib/db/schema.ts` (527 lines, 20+ tables)

**Vector Storage:**
- Built into Neon PostgreSQL via pgvector
- Dimensions: 1536 (OpenAI embeddings)
- Tables: `brand_voices`, `writing_frameworks`, `agent_documents`, `content_learnings`

**File Storage:**
- **AWS S3** - Object storage
  - SDK: `@aws-sdk/client-s3` (3.958.0)
  - SDK: `@aws-sdk/s3-request-presigner` (3.958.0)
  - Purpose: File uploads, generated assets

**Caching:**
- **Upstash Redis** - Serverless Redis
  - SDK: `@upstash/redis` (1.35.6)
  - SDK: `@upstash/ratelimit` (2.0.6)
  - Purpose: Rate limiting, session cache

## Authentication & Identity

**Auth Provider:**
- **Clerk** - Authentication and user management
  - SDK: `@clerk/nextjs` (6.36.10)
  - Location: `app/api/webhooks/clerk/route.ts`
  - Sync: Clerk webhooks sync to `users` table
  - Features: Social auth, MFA, session management

**Webhook Handling:**
- **Clerk Webhooks** - User events
- **Polar Webhooks** - Subscription events
  - Location: `app/api/webhooks/polar/route.ts`
  - SDK: `svix` (1.84.1) for webhook verification

## CMS & Content

**Headless CMS:**
- **Sanity** - Content management
  - SDK: `sanity` (5.4.0)
  - Studio: `/studio` route
  - Config: `sanity.config.ts`
  - Env: `.env.sanity`
  - Purpose: Blog posts, guides, case studies

## Monitoring & Observability

**AI Observability:**
- **Langfuse** - LLM tracing and monitoring
  - SDK: `langfuse` (3.38.6)
  - SDK: `@langfuse/otel` (4.4.9)
  - SDK: `@langfuse/tracing` (4.4.9)
  - Integration: OpenTelemetry via `@vercel/otel`

**Telemetry:**
- **OpenTelemetry** - Distributed tracing
  - SDK: `@opentelemetry/api-logs`, `@opentelemetry/instrumentation`
  - SDK: `@vercel/otel` (2.1.0)
  - Config: Instrumentation hook enabled in Next.js

**Error Tracking:**
- **Stack** - Error monitoring
  - SDK: `@stackframe/stack` (2.8.56)

## Payments & Subscriptions

**Subscription Management:**
- **Polar.sh** - Subscription billing
  - SDK: `@polar-sh/sdk` (0.42.2)
  - Webhooks: `app/api/webhooks/polar/route.ts`
  - Purpose: Usage-based billing, subscription tiers

## CI/CD & Deployment

**Hosting:**
- **Vercel** - Primary hosting platform
  - Optimized for Next.js 16
  - Edge Runtime for API routes
  - Turbopack for dev builds

**Development Tools:**
- **Playwright** - E2E testing
- **k6** - Load testing (`tests/load/k6-rate-limit.js`)

## Environment Configuration

**Required Environment Variables:**
```
# Core AI/SEO APIs
DATAFORSEO_USERNAME      - DataForSEO auth
DATAFORSEO_PASSWORD      - DataForSEO auth
PERPLEXITY_API_KEY       - Perplexity access
JINA_API_KEY             - Jina AI access
FIRECRAWL_API_KEY        - Firecrawl access
XAI_API_KEY              - xAI/Grok access
GOOGLE_API_KEY           - Gemini access

# Database & Storage
DATABASE_URL             - Neon PostgreSQL
UPSTASH_REDIS_REST_URL   - Redis (implied)
UPSTASH_REDIS_REST_TOKEN - Redis (implied)

# Auth
CLERK_SECRET_KEY         - Clerk backend
CLERK_PUBLISHABLE_KEY    - Clerk frontend
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY - Public key

# Optional
AI_GATEWAY_API_KEY       - Vercel AI Gateway
AI_GATEWAY_BASE_URL      - Gateway endpoint
NEXT_PUBLIC_SITE_URL     - App URL

# Feature Tuning
DIAGNOSTIC_CACHE_TTL_MINUTES      - Cache config
DIAGNOSTIC_HTTP_TIMEOUT_MS        - Timeout config
DIAGNOSTIC_RETRY_ATTEMPTS         - Retry config
DIAGNOSTIC_KEYWORD_MIN_VOLUME     - Keyword filter
DIAGNOSTIC_GEMINI_MODE            - Gemini mode
DIAGNOSTIC_GEMINI_GATEWAY_MODEL   - Model config
DIAGNOSTIC_GEMINI_DIRECT_MODEL    - Model config
DIAGNOSTIC_PERPLEXITY_MODEL       - Model config
DIAGNOSTIC_GROK_MODEL             - Model config
```

**Secrets Location:**
- Production: Vercel environment variables
- Local: `.env.local` (gitignored)
- Template: `.env.example` (committed)

## MCP (Model Context Protocol) Integrations

**Generated MCP Bindings:**
- **Location:** `lib/mcp/{provider}/`
- **Generation Tool:** `mcp-to-ai-sdk`

**DataForSEO MCP:**
- 50+ SEO tools
- Categories: SERP, Keywords, Backlinks, Content Analysis, Domain Analytics, AI Optimization
- Endpoint patterns: `serp_*`, `keywords_data_*`, `dataforseo_labs_*`, `content_analysis_*`

**Jina MCP:**
- 14 tools for web intelligence
- Tools: `search_web`, `read_url`, `search_arxiv`, `search_images`, `deduplicate_strings`, etc.

**Firecrawl MCP:**
- 7 web scraping tools
- Tools: `firecrawl_scrape`, `firecrawl_crawl`, `firecrawl_map`, `firecrawl_extract`, `firecrawl_agent`

**MCP Client Pattern:**
```typescript
// lib/mcp/{provider}/client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
// Client initialization and tool binding
```

## Integration Patterns

**API Route Pattern:**
- Location: `app/api/*`
- Auth: Clerk middleware
- Rate limiting: Upstash Redis
- Error handling: Zod validation + custom errors

**Webhook Pattern:**
- Location: `app/api/webhooks/{provider}/`
- Verification: Svix for Polar, custom for Clerk
- Processing: Async, non-blocking

**External API Client Pattern:**
- Location: `lib/external-apis/{service}.ts`
- Features: Retry logic, error handling, caching
- Never import from `mcps/` directly - use wrappers

**Database Pattern:**
- ORM: Drizzle with Neon driver
- Schema: `lib/db/schema.ts`
- Queries: `lib/db/queries.ts`
- Vector search: `lib/db/vector-search.ts`

**AI SDK Pattern:**
- Use Vercel AI SDK for all LLM calls
- MCP tools for external data
- Langfuse for tracing

---

*Integration audit: 2026-02-24*
