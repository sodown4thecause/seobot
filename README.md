# FlowIntent (seobot)

**FlowIntent** is an AI-powered SEO, GEO / AEO, content, and social intelligence platform. Users chat in plain English across four paywalled modes, inspect structured tool results as artifacts, and save outputs to a workspace library. The public lead magnet is the free [Reddit content gap audit](/reddit-gap).

> Internal repo name: **seobot**. User-facing brand: **FlowIntent** only.

## Product

| Surface | Access | Purpose |
|---------|--------|---------|
| `/reddit-gap` | Public | Lead magnet — Reddit content gap audit |
| `/dashboard/*` | Signed in + paywall | Core product — mode-aware chat, artifacts, workspace |

### Four chat modes

| Mode | Job | Primary data |
|------|-----|--------------|
| **SEO Mode** | Rankings, keywords, SERPs, backlinks, technical SEO | DataForSEO (live) |
| **GEO / AEO Mode** | AI visibility — mentions and citations in answer engines | ChatGPT, Perplexity, Google AI Overviews |
| **Content Mode** | Research-first drafts, images, metadata → workspace | AI SDK tools + RAG |
| **Social Mode** | Social-web conversations, audience pain points, and trend signals | X/Twitter, Reddit, social web |

**Core UX:** Chat → Artifacts (AI SDK 7 tool UI) → Workspace (saved library)

Canonical spec: [`docs/specs/platform-modes.md`](docs/specs/platform-modes.md)

## Tech stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS, shadcn/ui
- **AI:** Vercel AI SDK 7, AI Gateway, Langfuse observability
- **Auth:** Better Auth (Google sign-in)
- **Billing:** Polar subscriptions
- **Database:** Neon PostgreSQL + Drizzle ORM
- **CMS:** Webflow (marketing blog + case studies)
- **Hosting:** Vercel for the application; geomode and supporting services run on a VPS — see [`docs/deployment/geomode-vultr.md`](docs/deployment/geomode-vultr.md)
- **Integrations:** DataForSEO, Jina, Firecrawl, Perplexity (MCP wrappers in `lib/mcp/`)

## Prerequisites

- Node.js 22+
- pnpm 11.5.0
- Neon PostgreSQL with Drizzle ORM
- API keys — copy [`.env.example`](.env.example) to `.env.local`

## Setup

```bash
pnpm install
cp .env.example .env.local   # fill in secrets
pnpm exec drizzle-kit migrate # apply DB migrations
pnpm dev                     # http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build (runs env validation) |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest (unit + integration) |
| `pnpm test:unit` | Unit tests only |
| `pnpm seed:rag-documents` | Seed RAG documents |
| `pnpm mcp:generate:jina` | Regenerate Jina MCP bindings |

## Project structure

```
app/                    # Next.js App Router (pages + API routes)
components/
  chat/                 # Chat UI, tool-ui/, generative-ui/
  workspace/            # Workspace browser
  dashboard/            # Dashboard shell + sidebar
lib/
  agents/               # Agent orchestration (agent-router.ts)
  artifacts/            # Artifact registry + sync from chat
  chat/                 # Modes, stream builder, persistence
  geo/                  # GEO/AEO tools, Elmo client, digest
  mcp/                  # MCP client wrappers (never import mcps/ directly)
  product/              # Elevator pitch + marketing copy
docs/specs/             # Durable product + architecture specs
drizzle/                # SQL migrations
tests/                  # Vitest unit + integration tests
```

## Key routes

| Route | Notes |
|-------|-------|
| `/dashboard` | Mode-aware chat (default SEO) |
| `/dashboard?mode=geo\|content` | Deep-link chat mode |
| `/dashboard/workspace` | Saved artifacts + library |
| `/dashboard/content-zone` | Legacy alias → workspace |
| `/api/chat` | Streaming chat API |
| `/api/library/*` | Workspace save/list |

## Deployment

Production deploys from **`main`** on Vercel. Preview deploys from all other branches.

```bash
git checkout main && git pull origin main
# trigger deploy if needed:
git commit --allow-empty -m "chore: trigger production deployment"
git push origin main
```

## Agent / contributor docs

- [`AGENTS.md`](AGENTS.md) — repo knowledge base for AI agents
- [`app/AGENTS.md`](app/AGENTS.md) — App Router patterns
- [`lib/AGENTS.md`](lib/AGENTS.md) — core business logic
- [`components/AGENTS.md`](components/AGENTS.md) — UI conventions

## License

Proprietary — All rights reserved
