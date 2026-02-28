# Codebase Structure

**Analysis Date:** 2026-02-24

## Directory Layout

```
seobot/
├── app/                          # Next.js 16 App Router
│   ├── api/                      # API route handlers (~50 routes)
│   ├── dashboard/                # Main application pages
│   ├── admin/                    # Admin dashboard
│   ├── (marketing)/              # Public pages (blog, guides, etc.)
│   ├── (auth)/                   # Sign-in, sign-up, user-profile
│   ├── layout.tsx                # Root layout with Clerk, AI provider
│   └── globals.css               # Tailwind base styles
├── components/                   # React components
│   ├── ui/                       # shadcn/ui primitives (30+ components)
│   ├── chat/                     # Chat interface components
│   │   └── tool-ui/              # Tool result visualizations
│   ├── workflows/                # Workflow UI components
│   ├── dashboard/                # Dashboard widgets
│   ├── content-zone/             # Content creation UI
│   ├── onboarding/               # Onboarding flow components
│   └── providers/                # React context providers
├── lib/                          # Core business logic
│   ├── agents/                   # Agent orchestration (20 files)
│   ├── workflows/                # Workflow engine (20 files)
│   ├── chat/                     # Chat processing pipeline
│   ├── mcp/                      # MCP client wrappers
│   │   ├── dataforseo/           # 60+ SEO tools
│   │   ├── jina/                 # 15+ web tools
│   │   ├── firecrawl/            # 7 crawling tools
│   │   └── winston-client.ts     # Content quality
│   ├── db/                       # Drizzle ORM + schema
│   ├── external-apis/            # Direct API clients
│   ├── ai/                       # AI/RAG utilities
│   ├── onboarding/               # Onboarding logic
│   ├── seo/                      # SEO utilities
│   ├── utils/                    # Shared utilities
│   └── redis/                    # Redis clients
├── mcps/                         # Auto-generated MCP bindings
│   ├── mcp.dataforseo.com/       # DataForSEO bindings
│   ├── mcp.jina.ai/              # Jina AI bindings
│   └── mcp.firecrawl.dev/        # Firecrawl bindings
├── supabase/                     # Database migrations (24 files)
├── drizzle/                      # Drizzle kit output
├── sanity/                       # CMS schema and config
├── types/                        # Shared TypeScript types
├── tests/                        # Vitest tests
└── scripts/                      # Utility scripts
```

## Directory Purposes

### `app/`
- **Purpose:** Next.js 16 App Router pages and API routes
- **Contains:** Route handlers, page components, layouts
- **Key files:**
  - `app/api/chat/route.ts` - Main chat endpoint
  - `app/dashboard/page.tsx` - Main dashboard
  - `app/layout.tsx` - Root layout with providers

### `components/`
- **Purpose:** React components organized by feature
- **Contains:**
  - `ui/` - shadcn/ui base components (Button, Card, Dialog, etc.)
  - `chat/` - Chat interface and tool result displays
  - `workflows/` - Workflow cards, progress, selectors
  - `dashboard/` - Dashboard-specific widgets
  - `onboarding/` - Conversational onboarding UI

### `lib/`
- **Purpose:** Core business logic - not React components
- **Contains:**
  - `agents/` - Agent routing, registry, tools
  - `workflows/` - Workflow engine and definitions
  - `mcp/` - MCP client wrappers with auth/caching
  - `db/` - Database schema and queries (Drizzle)
  - `chat/` - Chat message handling, streaming, persistence

### `mcps/`
- **Purpose:** Auto-generated MCP bindings (DO NOT MODIFY)
- **Contains:** Generated TypeScript from `mcp-to-ai-sdk`
- **Anti-pattern:** Never import directly - use `lib/mcp/` wrappers

### `supabase/`
- **Purpose:** Database migrations
- **Contains:** 24 SQL migration files
- **Key files:**
  - `001_initial_schema.sql`
  - Files for RAG tables, workflow persistence, user progress

### `types/`
- **Purpose:** Shared TypeScript type definitions
- **Contains:**
  - `actions.ts` - Server action types
  - `chat.ts` - Chat message types
  - `images.ts` - Image generation types
  - `user-mode.ts` - User mode system types

## Key File Locations

### Entry Points
- `app/layout.tsx` - Application root
- `app/api/chat/route.ts` - Primary chat API
- `app/page.tsx` - Landing page
- `app/dashboard/page.tsx` - Main app dashboard

### Configuration
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript paths (@/* mapping)
- `drizzle.config.ts` - Drizzle ORM configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `vitest.config.ts` - Test configuration

### Core Logic
- `lib/agents/agent-router.ts` - Query routing to agents
- `lib/agents/registry.ts` - Agent registry with 5 agents
- `lib/workflows/registry.ts` - 12 workflow definitions
- `lib/workflows/engine.ts` - Workflow execution engine
- `lib/db/schema.ts` - 30+ Drizzle table definitions

### MCP Clients
- `lib/mcp/dataforseo-client.ts` - DataForSEO tools
- `lib/mcp/jina-client.ts` - Jina AI tools
- `lib/mcp/firecrawl-client.ts` - Firecrawl tools

### Chat Pipeline
- `lib/chat/intent-classifier.ts` - LLM + keyword routing
- `lib/chat/tool-assembler.ts` - Tool loading for agents
- `lib/chat/stream-builder.ts` - AI SDK streaming
- `lib/chat/storage.ts` - Message persistence

## Naming Conventions

### Files
- **Components:** PascalCase (e.g., `workflow-card.tsx`)
- **Utilities:** camelCase (e.g., `intent-classifier.ts`)
- **API Routes:** `route.ts` in folder named for endpoint
- **Tests:** `*.test.ts` or `*.spec.ts`

### Directories
- **Feature folders:** kebab-case (e.g., `content-zone/`, `onboarding/`)
- **API routes:** Match URL path (e.g., `api/chat/`)

### Path Aliases
- `@/*` maps to project root
- Use `@/lib/agents/registry` not `../../../lib/agents/registry`

## Where to Add New Code

### New API Route
- Create folder in `app/api/{feature}/`
- Add `route.ts` with Route Handler
- Export methods: GET, POST, PUT, DELETE

### New Agent
- Create file in `lib/agents/{agent-name}-agent.ts`
- Add to `lib/agents/registry.ts`
- Define tools in `lib/agents/tools.ts` (if new tools needed)
- Add routing keywords to `lib/agents/agent-router.ts`

### New Workflow
- Create definition in `lib/workflows/definitions/{workflow-name}.ts`
- Register in `lib/workflows/registry.ts`
- Add UI component in `components/workflows/`

### New MCP Integration
- Generate bindings: `npm run mcp:generate:{provider}`
- Create wrapper in `lib/mcp/{provider}-client.ts`
- Export tool loader function

### New Database Table
- Add schema to `lib/db/schema.ts`
- Generate migration: `npx drizzle-kit generate`
- Add queries to `lib/db/queries.ts`

### New Component
- Feature-specific: `components/{feature}/{name}.tsx`
- UI primitive: `components/ui/{name}.tsx` (also register with shadcn)
- Always co-locate tests: `components/{feature}/{name}.test.tsx`

## Special Directories

### `app/api/`
- **Purpose:** All backend API endpoints
- **Count:** ~50 route handlers
- **Pattern:** Route Handler functions, not pages

### `components/chat/tool-ui/`
- **Purpose:** Visualizations for tool results
- **Examples:** `serp-table.tsx`, `keyword-suggestions-table.tsx`
- **Pattern:** Each tool has optional UI component

### `lib/workflows/definitions/`
- **Purpose:** Workflow step definitions
- **Count:** 12 workflows
- **Pattern:** Export Workflow interface implementation

### `mcps/`
- **Purpose:** Generated code only
- **Generated:** Yes (via mcp-to-ai-sdk)
- **Committed:** Yes (for reproducibility)
- **Modifications:** Never edit directly

### `supabase/migrations/`
- **Purpose:** Database schema evolution
- **Count:** 24 migrations
- **Pattern:** Timestamped SQL files

---

*Structure analysis: 2026-02-24*
