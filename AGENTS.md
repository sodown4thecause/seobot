# SEOBOT PROJECT KNOWLEDGE BASE

**Generated:** 2026-07-12
**Commit:** (see `git rev-parse HEAD`)  
**Branch:** `codex/production-readiness-pr-reconciliation`

## OVERVIEW

AI-powered SEO, GEO / AEO, and content platform (**FlowIntent** brand). Next.js 16 + React 19 + Vercel AI SDK 7 + MCP integrations (DataForSEO, Jina, Firecrawl).

## STRUCTURE

```
seobot/
├── app/                    # Next.js 16 App Router (API routes + pages)
├── components/             # React components (shadcn/ui base)
│   ├── chat/               # Chat + tool-ui + generative-ui
│   ├── workspace/          # Workspace browser
│   └── dashboard/          # Dashboard shell
├── lib/                    # Core business logic
│   ├── agents/             # AI agent orchestration
│   ├── artifacts/          # Artifact registry + chat sync
│   ├── chat/               # Modes, stream builder, persistence
│   ├── geo/                # GEO/AEO tools, Elmo client, digest
│   ├── mcp/                # MCP client wrappers
│   └── workflows/          # Multi-step workflow engine
├── mcps/                   # Auto-generated MCP bindings (DO NOT EDIT)
├── drizzle/                # SQL migrations (Neon)
├── docs/specs/             # Canonical product + architecture specs
├── scripts/                # Seed scripts, env validation, deploy
└── tests/                  # Vitest unit + integration tests
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new AI agent | `lib/agents/` | Register in `registry.ts` |
| Add API route | `app/api/` | Route handlers; auth via Better Auth |
| Add MCP integration | `mcps/` + `lib/mcp/` | Generate with `pnpm mcp:generate:*` |
| Add artifact type | `lib/artifacts/registry.ts` | Wire tool UI in `components/chat/tool-ui/` |
| Add chat mode UI | `lib/chat/modes.ts` | Shared labels, accents, deep links |
| Database schema | `lib/db/schema.ts` + `drizzle/` | Drizzle ORM, Neon serverless |
| Chat interface | `components/chat/` | Artifacts panel in `ai-chat-interface.tsx` |
| Workspace UI | `components/workspace/` | Route: `/dashboard/workspace` |
| GEO / Elmo integration | `lib/geo/elmo-client.ts` | VPS geomode stack |
| Product copy | `lib/product/elevator-pitch.ts` | Never say SEOBOT user-facing |

## CONVENTIONS

### Path Aliases
- `@/*` maps to project root (e.g., `@/lib/agents/registry`)

### AI SDK Usage
- Vercel AI SDK v7 (`ai@7.x`)
- MCP via `@ai-sdk/mcp`
- Models via AI Gateway (OpenAI, Anthropic, Google, Perplexity, DeepSeek)

### API Route Patterns
- Route Handlers in `app/api/`
- Auth via **Better Auth** (`lib/auth-config.ts`, edge gate in `proxy.ts`)
- Rate limiting via Upstash Redis (`lib/redis/rate-limit.ts`)
- Billing gate via Polar (`lib/billing/subscription-guard.ts`)

### Component Patterns
- shadcn/ui in `components/ui/`
- Radix UI + Tailwind CSS
- Mode accents from `CHAT_MODE_ACCENT_CLASSES` in `lib/chat/modes.ts`

### Agent Pattern
- Central router: `lib/agents/agent-router.ts`
- Mode selects agent + tools + RAG filter (`agent_documents.mode`)

## ANTI-PATTERNS

- **NEVER** use `as any` or `@ts-ignore`
- **NEVER** import from `mcps/` in application code — use `lib/mcp/` wrappers
- **NEVER** hardcode API keys
- **NEVER** skip auth checks in API routes
- **NEVER** user-facing **Content Zone** — say **Workspace**
- **NEVER** reintroduce onboarding routes or gates

## COMMANDS

```bash
pnpm dev                 # Start Next.js dev server
pnpm build               # Production build (runs env validation)
pnpm typecheck           # TypeScript check
pnpm test                # Run all tests
pnpm test:unit           # Unit tests only
pnpm seed:rag-documents
pnpm mcp:generate:jina
pnpm mcp:generate:dataforseo
```

## DEPLOYMENT (Vercel)

Production deploys from `main` only. After merging PRs:

```bash
git checkout main && git pull origin main
git commit --allow-empty -m "chore: trigger production deployment"
git push origin main
```

## DEPENDENCIES (Key)

| Package | Purpose |
|---------|---------|
| `ai@7.x` | Vercel AI SDK core |
| `@ai-sdk/mcp` | MCP protocol integration |
| `better-auth` | Authentication (Google) |
| `drizzle-orm` | Database ORM (Neon) |
| `@polar-sh/sdk` | Billing / subscriptions |
| `@directus/sdk` | Legacy CMS references |
| `langfuse` | AI observability |
| `zod` | Schema validation |

## Learned User Preferences

- Public brand is **FlowIntent** only; never SEOBOT on user-facing surfaces.
- Suggested journey SEO → GEO / AEO → Content is optional—not a forced funnel.
- Name supported GEO engines explicitly: ChatGPT, Perplexity, Google AI Overviews.
- Marketing design: red primary on dark background (`globals.css` tokens).
- Never user-facing **Content Zone** — say **Workspace**.
- No onboarding flow: simple auth (Better Auth + Google) with no onboarding gate.

## Learned Workspace Facts

- Product: three paywalled AI SDK 7 chat modes (SEO, GEO / AEO, Content); `/reddit-gap` is the free lead magnet; `/dashboard/*` is paywalled core.
- Core UX: mode-aware Chat → Artifacts (AI SDK 7 tool UI) → Workspace (saved library at `/dashboard/workspace`).
- GEO and AEO share one lane; engines: ChatGPT, Perplexity, Google AI Overviews.
- Legacy route `/dashboard/content-zone` kept; sidebar links to `/dashboard/workspace`.
- Canonical product spec: `docs/specs/platform-modes.md`; elevator pitch: `lib/product/elevator-pitch.ts`; mode UI: `lib/chat/modes.ts`.
- Auth: Better Auth with edge cookie gate in `proxy.ts` (not Clerk).
- Artifact registry: `lib/artifacts/registry.ts`; sync from messages: `lib/artifacts/sync-from-messages.ts`.
- GEO tracking: geomode (Elmo fork) on Ubuntu VPS; spec: `docs/specs/2026-06-12-geomode-geo-tracking-design.md`; client: `lib/geo/elmo-client.ts`; served at geo.flowintent.com.
- Billing: Polar; after sign-up users land on dashboard, not checkout.
- VPS access: Tailscale SSH alias `hermes-vps` (user `hermes`).
- `docs/plans/` is gitignored; commit durable docs under `docs/specs/`.
