# SEOBOT PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-10
**Commit:** d4152cd
**Branch:** feat/seo-chat-agent-improvements

## OVERVIEW

AI-powered SEO & content creation platform combining competitor analysis, keyword research, and AI-powered writing. Next.js 16 + React 19 + Vercel AI SDK + multiple MCP integrations (DataForSEO, Jina, Firecrawl).

## STRUCTURE

```
seobot/
├── app/                    # Next.js 16 App Router (API routes + pages)
├── components/             # React components (shadcn/ui base)
├── lib/                    # Core business logic, agents, workflows
│   ├── agents/             # AI agent orchestration (18 files)
│   ├── ai/                 # AI tooling, RAG, domain profiling
│   ├── mcp/                # MCP client wrappers (dataforseo, jina, firecrawl)
│   ├── workflows/          # Multi-step workflow engine
│   └── external-apis/      # Third-party API services
├── mcps/                   # Auto-generated MCP bindings (mcp-to-ai-sdk)
├── supabase/               # Database migrations (24 files)
├── sanity/                 # CMS schema types
├── scripts/                # Seed scripts, env validation
└── tests/                  # Vitest unit tests
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new AI agent | `lib/agents/` | Register in `registry.ts`, follow existing pattern |
| Add API route | `app/api/` | Route handlers use Edge Runtime |
| Add MCP integration | `mcps/` + `lib/mcp/` | Generate with `npm run mcp:generate:*` |
| Add workflow | `lib/workflows/definitions/` | Register in `registry.ts` |
| Add UI component | `components/` | Use shadcn/ui primitives from `ui/` |
| Database schema | `supabase/migrations/` | Drizzle ORM, Neon serverless |
| Chat interface | `components/chat/` | Tool UIs in `tool-ui/` |
| Onboarding flow | `lib/onboarding/` + `components/onboarding/` | Conversational setup |

## CONVENTIONS

### Path Aliases
- `@/*` maps to project root (e.g., `@/lib/agents/registry`)

### AI SDK Usage
- Using Vercel AI SDK v6 beta (`ai@6.0.0-beta.109`)
- MCP integration via `@ai-sdk/mcp@1.0.0-beta.15`
- Models: Gemini 2.0, Anthropic, Perplexity, DeepSeek

### API Route Patterns
- All routes in `app/api/` use Route Handlers
- Auth via Clerk (`@clerk/nextjs`)
- Rate limiting via Upstash Redis

### Component Patterns
- shadcn/ui components in `components/ui/`
- Radix UI primitives for accessibility
- Tailwind CSS for styling

### Agent Pattern
- Agents in `lib/agents/` follow orchestrator pattern
- Central router in `agent-router.ts`
- Tool definitions in `tools.ts`

## ANTI-PATTERNS

- **NEVER** use `as any` or `@ts-ignore`
- **NEVER** import from `node_modules` MCP bindings directly - use `lib/mcp/` wrappers
- **NEVER** hardcode API keys - use environment variables
- **NEVER** skip auth checks in API routes

## COMMANDS

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build            # Production build (runs env validation)
npm run typecheck        # TypeScript check

# Testing
npm run test             # Run all tests
npm run test:unit        # Unit tests only
npm run test:coverage    # With coverage

# Database
npm run seed:frameworks  # Seed framework data
npm run seed:rag-documents # Seed RAG documents

# MCP Generation
npm run mcp:generate:jina       # Generate Jina MCP bindings
npm run mcp:generate:dataforseo # Generate DataForSEO bindings
```

## DEPENDENCIES (Key)

| Package | Purpose |
|---------|---------|
| `ai@6.0.0-beta` | Vercel AI SDK core |
| `@ai-sdk/mcp` | MCP protocol integration |
| `@clerk/nextjs` | Authentication |
| `drizzle-orm` | Database ORM (Neon) |
| `langfuse` | Observability/tracing |
| `sanity` | CMS integration |
| `zod` | Schema validation |

## NOTES

- Next.js 16 with Turbopack (experimental)
- React 19 with Server Components
- OpenTelemetry instrumentation via `@vercel/otel`
- Langfuse for AI observability
- Tests exclude patterns: `**/*.test.ts`, `test-*.ts` in tsconfig
