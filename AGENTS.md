# SEOBOT PROJECT KNOWLEDGE BASE + AUGGIE CONTEXT ENGINE

**Generated:** 2026-01-10
**Commit:** d4152cd
**Branch:** feat/seo-chat-agent-improvements

## LLM REMINDER

Use the Auggie MCP as a context engine for every MCP-compatible agent.

Augment's industry-leading semantic search brings deep codebase context to MCP-compatible agents. In benchmarks, adding Context Engine improved agent performance by 70%+ across Claude Code, Cursor, and Codex. Whether you use these or another MCP-compatible agent, this context helps produce better code faster and with fewer tokens.

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

## DEPLOYMENT (Vercel)

**Critical:** Always sync local main before assuming production is up to date.

```bash
# After merging PRs on GitHub, sync local main
git checkout main
git pull origin main

# If production hasn't deployed, trigger it with empty commit
git commit --allow-empty -m "chore: trigger production deployment"
git push origin main
```

**Vercel Settings:**
- Production deploys from `main` branch only
- Preview deploys from all other branches/PRs
- Dashboard: https://vercel.com/dashboard

## DEPENDENCIES (Key)

| Package | Purpose |
|---------|---------|
| `ai@6.0.0-beta` | Vercel AI SDK core |
| `@ai-sdk/mcp` | MCP protocol integration |
| `@clerk/nextjs` | Authentication |
| `drizzle-orm` | Database ORM (Neon) |
| `langfuse` | Observability/tracing |
| `@directus/sdk` | CMS integration (Directus) |
| `zod` | Schema validation |

## NOTES

- Next.js 16 with Turbopack (experimental)
- React 19 with Server Components
- OpenTelemetry instrumentation via `@vercel/otel`
- Langfuse for AI observability
- Tests exclude patterns: `**/*.test.ts`, `test-*.ts` in tsconfig

## Cursor Cloud specific instructions

Single Next.js 16 app. Standard commands live in `package.json` (`dev`, `lint`,
`test:unit`, `build`); deps install via `npm install` (already run on startup).
Auth is **Better Auth + Neon Postgres via Drizzle** (the Clerk/Supabase mentions
above are stale).

- **Run dev:** `npm run dev` (serves on `http://localhost:3000`). The marketing
  landing page renders with **no env vars**. Auth/dashboard/most `app/api/*`
  routes need a Postgres `DATABASE_URL` — `lib/db/index.ts` calls `neon(...)` at
  module load, so DB-backed routes 500 (and `/dashboard` redirects to login)
  when it's unset. Env validation (`lib/config/env.ts` / `npm run validate:env`)
  is lenient (all-optional, passthrough); missing keys don't crash boot, features
  just fail lazily when exercised.
- **Required `.env.local` for full dev (auth + dashboard):** `DATABASE_URL`
  (Neon serverless Postgres), `BETTER_AUTH_SECRET` (`openssl rand -hex 32`),
  `BETTER_AUTH_URL=http://localhost:3000`, `NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000`.
  Feature keys (AI providers / `AI_GATEWAY_API_KEY`, `DATAFORSEO_*`, `JINA_API_KEY`,
  `PERPLEXITY_API_KEY`, `FIRECRAWL_API_KEY`, `POLAR_*`, Upstash, Webflow, Inngest)
  stay optional and only matter for their specific feature. See `.env.example`.
- **DB schema setup (gotcha):** use `npx drizzle-kit push`, NOT `drizzle-kit migrate`.
  The committed `drizzle/` migrations have ordering conflicts (`0000` uses the
  `vector` type before the extension exists; `0001` redefines `0000`'s
  `match_frameworks` function) and `migrate` runs the whole batch in one
  transaction, so it rolls everything back. Before pushing, enable pgvector:
  `CREATE EXTENSION IF NOT EXISTS vector;`. Also note `drizzle.config.ts` only
  references `lib/db/schema.ts`, so the Better Auth tables in `lib/auth-schema.ts`
  (`user`/`session`/`account`/`verification`) are NOT created by a default push —
  push a config whose `schema` includes both files, or you can sign up but the
  `user` table will be missing.
- **Hello-world:** sign up at `/sign-up` (or `POST /api/auth/sign-up/email`).
  On success Better Auth creates the `user` + `session` rows and a DB hook mirrors
  the row into the app `users` table; the new user is auto-redirected to the Polar
  checkout/trial page.
- **Production build is currently broken** (pre-existing, not an env issue):
  `npm run build` fails prerendering `/_not-found` with `Cannot read properties of
  null (reading 'useState')`. Use `npm run dev` for development.
