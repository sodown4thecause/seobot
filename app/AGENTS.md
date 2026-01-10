# APP - NEXT.JS 16 APP ROUTER

Next.js 16 App Router with pages and API routes.

## STRUCTURE

```
app/
├── api/                    # API Route Handlers (~50 routes)
│   ├── chat/              # Main chat streaming
│   ├── content/           # Content generation, validation
│   ├── dataforseo/        # DataForSEO API proxies
│   ├── onboarding/        # Onboarding steps
│   ├── admin/             # Admin-only endpoints
│   └── workflows/         # Workflow execution
├── dashboard/             # Main app pages
│   ├── workflows/
│   ├── content/create/
│   └── analytics/
├── admin/                 # Admin dashboard (protected)
├── studio/                # Sanity CMS studio
├── (auth pages)           # sign-in/, sign-up/, user-profile/
└── (marketing)            # blog/, guides/, resources/
```

## API ROUTES

| Route | Purpose | Auth |
|-------|---------|------|
| `/api/chat` | Main chat streaming | Required |
| `/api/content/*` | Content generation | Required |
| `/api/dataforseo/*` | DataForSEO proxies | Required |
| `/api/onboarding/*` | Onboarding handlers | Required |
| `/api/admin/*` | Admin endpoints | Admin only |
| `/api/workflows/*` | Workflow execution | Required |

## PATTERNS

### Route Handler Pattern
```typescript
// app/api/example/route.ts
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })
  // ...
}
```

### Streaming Response
```typescript
// For AI chat responses
return new StreamingTextResponse(stream)
```

## NOTES

- Auth via Clerk middleware - see `middleware.ts`
- Protected routes: `/dashboard/*`, `/admin/*`, `/api/*`
- Public routes: marketing pages, blog, auth pages
