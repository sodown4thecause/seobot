# APP - NEXT.JS 16 APP ROUTER

Next.js 16 App Router with pages and API routes.

## STRUCTURE

```
app/
├── api/                    # Route Handlers
│   ├── chat/              # Main chat streaming (mode-aware)
│   ├── geo/               # GEO digest, health, trends, runs
│   ├── library/           # Workspace save/list
│   ├── content-zone/      # Brief builder API
│   ├── content/           # Content generation
│   ├── dataforseo/        # DataForSEO proxies
│   ├── cron/              # Weekly SEO/GEO research
│   └── workflows/         # Workflow execution
├── dashboard/             # Paywalled app
│   ├── page.tsx           # Mode-aware chat (default)
│   ├── workspace/         # Workspace browser (canonical)
│   ├── content-zone/      # Legacy workspace alias
│   └── content/           # Content routes + brief builder
├── login/                 # Better Auth login
├── sign-in/ sign-up/      # Auth entry points
└── (marketing)            # Landing, blog, case-studies (Webflow)
```

## API ROUTES

| Route | Purpose | Auth |
|-------|---------|------|
| `POST /api/chat` | Streaming chat (`mode: seo\|geo\|content`) | Required + paywall |
| `/api/library/*` | Workspace CRUD | Required |
| `/api/geo/*` | GEO runs, digest, trends | Required |
| `/api/content-zone/brief` | Brief builder | Required |
| `/api/dataforseo/*` | DataForSEO proxies | Required |
| `/api/cron/*` | Scheduled research | `CRON_SECRET` |
| `/api/admin/*` | Admin endpoints | Admin only |

## PATTERNS

### Route Handler Pattern
```typescript
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user) return new Response('Unauthorized', { status: 401 })
  // ...
}
```

### Streaming Response
```typescript
return result.toUIMessageStreamResponse()
```

## NOTES

- Auth via **Better Auth** — config in `lib/auth-config.ts`, edge gate in `proxy.ts`
- Protected routes: `/dashboard/*`, `/api/*` (except public/cron/webhooks)
- Public routes: marketing, `/reddit-gap`, auth pages
- **No onboarding** — removed permanently; do not reintroduce
- Deep-link chat mode: `/dashboard?mode=seo|geo|content`
