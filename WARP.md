# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

AI-powered SEO and content creation platform that combines competitive analysis, keyword research, and AI-powered writing to help businesses create optimized content. Built with conversational AI onboarding and real-time streaming chat interface.

**Tech Stack:**
- **Frontend:** Next.js 16 (App Router), React 19, TailwindCSS, shadcn/ui, Framer Motion
- **Backend:** Next.js API Routes with Edge Runtime
- **Database:** Supabase (PostgreSQL + Auth + Storage + pgvector)
- **AI:** Gemini 2.0 (via Google AI SDK), Vercel AI SDK for streaming
- **External APIs:** DataForSEO (SEO data), Perplexity (research), Jina (content extraction), Apify (social scraping)
- **RAG System:** pgvector + OpenAI embeddings (text-embedding-3-small)

**Development Status:** 75% complete (15/20 phases). Core services operational, onboarding fully wired, content creation live.

## Common Development Commands

### Development Server
```bash
npm run dev          # Start development server on port 3000
npm run build        # Build production bundle
npm run start        # Start production server
```

### Code Quality
```bash
npm run lint         # Run ESLint on codebase
npm run lint:fix     # Auto-fix ESLint errors
npm run typecheck    # Run TypeScript type checking (tsc --noEmit)
```

### Database Seeding
```bash
npm run seed:frameworks   # Seed writing frameworks with embeddings (requires OPENAI_API_KEY)
npm run seed:files        # Seed from file sources
```

**Note:** This project does not have automated tests configured yet. No Vitest, Jest, or Playwright setup exists.

### Database Management
Supabase migrations are located in `supabase/migrations/`. Apply them via Supabase CLI or dashboard:
```bash
# If using Supabase CLI locally:
supabase db push          # Apply migrations to remote
supabase migration new <name>  # Create new migration
```

## High-Level Architecture

### Request Flow

```
User → Next.js 16 App Router → Edge Runtime API Routes
                              ↓
                    ┌─────────┴──────────┐
                    ↓                     ↓
              Vercel AI SDK          External APIs
              (Streaming)            (DataForSEO, etc.)
                    ↓                     ↓
              Gemini 2.0 Flash     Supabase PostgreSQL
              (Function Calling)    + pgvector (RAG)
```

### Core Systems

#### 1. **AI Chat System with RAG**
- **Location:** `app/api/chat/route.ts`
- **Streaming:** Vercel AI SDK's `GoogleGenerativeAIStream` for real-time responses
- **Model:** `gemini-2.0-flash-exp` with function calling tools
- **RAG Integration:** 
  - Intent detection (`detectFrameworkIntent`) triggers framework retrieval
  - `lib/ai/rag-service.ts` uses pgvector similarity search
  - Hybrid re-ranking: semantic similarity + keyword matching + popularity boost
  - LRU cache (200 items, 10min TTL) prevents redundant DB queries

#### 2. **RAG System (Writing Frameworks)**
- **Storage:** `writing_frameworks` table with pgvector extension
- **Embeddings:** OpenAI `text-embedding-3-small` (1536 dimensions)
- **Retrieval:**
  1. Generate query embedding
  2. Call `match_frameworks` RPC function (cosine similarity)
  3. Fetch 2.5x desired results for re-ranking
  4. Apply hybrid scoring:
     - Semantic similarity (0.7+ threshold)
     - Keyword boost (exact/partial name match)
     - Popularity boost (usage_count)
     - Category preference bonus
  5. Return top N results
- **Seeding:** `scripts/seed-frameworks.ts` - populates with 50+ frameworks from `lib/ai/framework-seeds.ts`

#### 3. **Edge Runtime Design**
All API routes use `export const runtime = 'edge'` for:
- Low latency globally
- No Node.js APIs (uses Web APIs: fetch, ReadableStream, crypto)
- Compatible with Vercel Edge Functions
- Cache implementation uses `lru-cache` (Edge-compatible)

#### 4. **External API Integrations**
**Services in `lib/api/`:**
- `dataforseo-service.ts` - SEO data (keywords, SERP, competitors, backlinks)
  - 15+ endpoints including AI Optimization APIs
  - Function calling integration for chat AI tools
- `perplexity-service.ts` - Real-time research with citations
- `jina-service.ts` - Clean content extraction from URLs
- `apify-service.ts` - Social media scraping (Twitter, LinkedIn, Instagram)

**Pattern:** All return `ApiResult<T>` type with `{ success: boolean, data?: T, error?: ApiError }`

#### 5. **Conversational Onboarding (6 Steps)**
**Location:** `app/onboarding/page.tsx`, `components/onboarding/`

1. **Business Profile** - URL analysis (Jina → Gemini), goals, location
2. **Brand Voice** - Social media extraction (Apify → Gemini) or manual input
3. **Competitor Discovery** - Auto-find competitors (DataForSEO) or manual
4. **Goals & Targeting** - Content types, frequency, topics
5. **CMS Integration** - WordPress/Webflow/Shopify connection
6. **Completion** - Summary + initial opportunities

**Persistence:** Progress saved to `business_profiles`, `brand_voices`, `competitors`, `keywords` tables via Supabase.

### Database Schema (14 Core Tables)

**User & Business:**
- `users` (Supabase Auth)
- `business_profiles` - Website, industry, goals, locations
- `brand_voices` - Tone, style, embeddings (pgvector)
- `social_connections` - OAuth tokens for social platforms

**SEO Data:**
- `competitors` - Tracked competitors with metrics
- `keywords` - Opportunities with search volume, difficulty, priority

**Content:**
- `content` - Generated articles with SEO scores
- `content_versions` - Revision history

**RAG:**
- `writing_frameworks` - Templates with embeddings (pgvector indexed)

**Future:**
- `cms_integrations`, `link_opportunities`, `outreach_campaigns`, `analytics_snapshots`, `notifications`

**Key Indexes:**
- pgvector cosine distance index on `writing_frameworks.embedding`
- RLS policies on all user-scoped tables

## Key Architectural Patterns

### 1. RAG Retrieval with Hybrid Re-Ranking
```typescript
// lib/ai/rag-service.ts
export async function findRelevantFrameworks(query: string, options?: RetrievalOptions)
```
- Generates embedding for query
- Vector similarity search (pgvector cosine)
- Fetches 2.5x results, applies:
  - Keyword boost (+0.15 exact name, +0.08 partial, +0.05 per tag)
  - Popularity boost (log scale, max +0.05)
  - Category preference (+0.05)
- Returns top N sorted by final score
- Caches results (LRU, 10min TTL)

### 2. Streaming Chat with Function Calling
```typescript
// app/api/chat/route.ts
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  tools: [{ functionDeclarations: dataForSEOFunctions }]
})
```
- Chat sends message to Gemini
- If function call detected, execute DataForSEO API
- Send result back to model
- Stream final response to client via `GoogleGenerativeAIStream`

### 3. Edge-Compatible Caching
```typescript
// lib/ai/rag-service.ts
import { LRUCache } from 'lru-cache'

const retrievalCache = new LRUCache<string, CacheEntry>({
  max: 200,
  ttl: 10 * 60 * 1000,  // 10 minutes
})
```
- No Node.js `Map` or `redis` needed
- Cache keys: `${query}:${category}:${maxResults}`

### 4. Environment Validation (Fail-Fast)
```typescript
// lib/config/env.ts
import { z } from 'zod'

export const serverEnv = serverEnvSchema.parse(process.env)
export const clientEnv = clientEnvSchema.parse(process.env)
```
- Server boots with validated env or fails with helpful errors
- Type-safe env access throughout codebase

## Important File Locations

### Configuration
- `next.config.ts` - Next.js 16 config (minimal)
- `tsconfig.json` - TypeScript with `@/*` path alias
- `tailwind.config.js` - Tailwind with shadcn/ui presets
- `lib/config/env.ts` - Zod-validated environment variables

### API Routes (Edge Runtime)
- `app/api/chat/route.ts` - Main chat endpoint with RAG + streaming
- `app/api/analyze-website/route.ts` - Jina + Gemini website analysis
- `app/api/keywords/research/route.ts` - DataForSEO keyword research
- `app/api/competitors/discover/route.ts` - Auto-discover competitors
- `app/api/brand-voice/extract/route.ts` - Apify + Gemini voice extraction
- `app/api/content/generate/route.ts` - Content creation with Perplexity + Gemini

### AI & RAG System
- `lib/ai/rag-service.ts` - Main RAG retrieval with caching
- `lib/ai/embedding.ts` - OpenAI embeddings with retry logic
- `lib/ai/framework-seeds.ts` - 50+ writing frameworks data
- `lib/ai/dataforseo-tools.ts` - Function calling tools for chat AI

### External Integrations
- `lib/api/dataforseo-service.ts` - 15+ DataForSEO endpoints
- `lib/api/perplexity-service.ts` - Research with citations
- `lib/api/jina-service.ts` - Content extraction
- `lib/api/apify-service.ts` - Social scraping

### Database
- `supabase/migrations/` - SQL migrations (5 files)
  - `001_initial_schema.sql` - Core tables
  - `003_framework_policies.sql` - pgvector + RLS
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server client with SSR
- `lib/supabase/types.ts` - Generated types

### Components
- `components/chat/ai-chat-interface.tsx` - Main chat UI (Vercel AI SDK)
- `components/onboarding/conversational-onboarding.tsx` - 6-step flow
- `components/onboarding/progress-bar.tsx` - Animated progress
- `components/ui/*` - shadcn/ui components

### Scripts
- `scripts/seed-frameworks.ts` - Seed writing frameworks with embeddings
- `scripts/seed-from-files.ts` - Alternative seeding from files

### Utilities
- `lib/utils/cache.ts` - Caching utilities
- `lib/utils/http.ts` - HTTP retry logic (planned)
- `lib/middleware/rate-limit.ts` - Rate limiting (planned)

## Environment Variables

### Required (Supabase)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # For scripts/migrations
```

### Required (AI Models)
```env
GOOGLE_API_KEY=AIza...            # Gemini 2.0 API key
OPENAI_API_KEY=sk-...             # For embeddings in seed script
```

### Required (External APIs)
```env
DATAFORSEO_LOGIN=your-email       # DataForSEO credentials
DATAFORSEO_PASSWORD=your-password
PERPLEXITY_API_KEY=pplx-...       # Perplexity research
JINA_API_KEY=jina_...             # Content extraction
```

### Optional
```env
APIFY_API_KEY=apify_...           # Social scraping (onboarding Step 2)
```

### Defaults
- Location: US (code 2840) if not specified
- Language: English (`en`) if not specified
- Model: `gemini-2.0-flash-exp` (hardcoded in chat route)

## Database Seeding

### Seed Writing Frameworks
```bash
npm run seed:frameworks
```

**Requirements:**
- `SUPABASE_SERVICE_ROLE_KEY` must be set (bypasses RLS)
- `OPENAI_API_KEY` must be set (generates embeddings)
- Migration `003_framework_policies.sql` must be applied

**Process:**
1. Loads 50+ frameworks from `lib/ai/framework-seeds.ts`
2. Generates 1536-dim embeddings via OpenAI
3. Upserts to `writing_frameworks` table (idempotent by name + category)
4. Concurrent embedding generation (5 at a time)
5. Batch upserts (10 frameworks per batch)

**Tables Populated:**
- `writing_frameworks` - Name, description, structure, example, category, tags, embedding

**Note:** Seed script is idempotent - safe to re-run. Existing frameworks are updated, not duplicated.

## Development Notes

### Type Safety
- 95%+ type coverage
- All services return typed `ApiResult<T>`
- Generated Supabase types in `lib/supabase/types.ts`
- 1 remaining TypeScript error in `white-label-service.ts` (non-blocking)

### Code Quality
- ESLint: 273 issues (103 errors, 170 warnings) - mostly in component files
- Most warnings are React hooks dependencies and unused vars (non-blocking)

### Deployment Readiness
**Production Ready:**
- ✅ Environment validation
- ✅ Type-safe services
- ✅ Error handling in API routes
- ✅ Edge runtime support
- ✅ Streaming responses

**Not Yet Production Ready:**
- ⏳ Rate limiting (middleware not implemented)
- ⏳ Comprehensive caching layer
- ⏳ Error tracking (Sentry integration)
- ⏳ Test coverage (no tests exist)
- ⏳ CI/CD pipeline

### Next Priorities
1. **Competitor Monitoring** - Background jobs for tracking competitor changes
2. **Error Handling** - Retry logic, circuit breakers, request ID tracking
3. **Testing** - Unit, integration, and E2E test setup
4. **Production Hardening** - Rate limiting, caching, monitoring

## Development Workflow

### Starting Development
1. Ensure `.env.local` has all required environment variables
2. Apply Supabase migrations if needed
3. Run `npm run seed:frameworks` on first setup
4. Start dev server: `npm run dev`

### Making Database Changes
1. Create migration in `supabase/migrations/`
2. Apply via Supabase CLI or dashboard
3. Regenerate types if schema changed: `supabase gen types typescript`

### Adding New Writing Frameworks
1. Edit `lib/ai/framework-seeds.ts`
2. Add to `FRAMEWORK_SEEDS` array
3. Run `npm run seed:frameworks`

### Debugging RAG Issues
- Check cache with `getCacheStats()` in `lib/ai/rag-service.ts`
- Clear cache: `clearRetrievalCache()`
- Enable verbose logging: Look for `[RAG]` prefixed console logs
- Check pgvector index: Query `writing_frameworks` table directly

### Debugging Chat Issues
- Check `[Chat]` prefixed console logs
- Verify function calling: Look for Gemini function call logs
- Test DataForSEO integration separately in `lib/api/dataforseo-service.ts`
- Check streaming: Verify `GoogleGenerativeAIStream` is working

## Project References

- **PRD:** `seo-platform-prd.md` - Full product requirements (20 phases)
- **Implementation Status:** `IMPLEMENTATION_STATUS.md` - Progress tracking (15/20 phases complete)
- **DataForSEO Integration:** `DATAFORSEO_INTEGRATION.md` - API details
- **RAG Implementation:** `RAG_IMPLEMENTATION.md` - RAG system design

## Additional Context

This codebase emphasizes conversational UX over traditional forms. The onboarding flow, chat interface, and content creation all use natural language interactions powered by Gemini 2.0.

Key design decisions:
- **Edge-first:** All API routes use Edge runtime for global low latency
- **RAG over fine-tuning:** Writing frameworks stored in DB, not model weights
- **Streaming everything:** Real-time responses via Vercel AI SDK streaming
- **Type safety:** Zod validation, TypeScript strict mode, ApiResult pattern
- **Supabase native:** Auth, DB, Storage, and pgvector all from Supabase

The platform is 75% complete and production-ready for core features (onboarding, chat, content creation). Missing pieces are monitoring, testing, and advanced features (competitor alerts, CMS publishing, link building).
