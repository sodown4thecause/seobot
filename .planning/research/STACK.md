# Technology Stack

**Project:** SEOBOT Dashboard + SEO SaaS Platform  
**Researched:** February 2026  
**Context:** Subsequent milestone adding dashboard capabilities to existing SEO/AEO chat platform

---

## Executive Summary

**Recommended Stack Philosophy:** Build on existing foundation (Next.js 16 + React 19 + shadcn/ui + DataForSEO MCP), add enterprise-grade dashboard capabilities with TanStack Query for caching, Inngest for background jobs, and shadcn/ui Charts for data visualization. Prioritize solutions that integrate cleanly with your DataForSEO MCP infrastructure.

**Key Decisions:**
- **Caching:** TanStack Query v5 (server state) + nuqs (URL state) + Upstash Redis (edge cache)
- **Background Jobs:** Inngest (runs on your infrastructure, clean DataForSEO integration)
- **Charts:** shadcn/ui Charts (Recharts-based, matches design system)
- **State:** Zustand for global UI state (minimal, 1.2KB)

---

## Recommended Stack

### Core Framework (Already in Use)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 16.x | Full-stack React framework | App Router, Server Components, streaming | HIGH - already using |
| React | 19.x | UI library | Concurrent features, Server Actions | HIGH - already using |
| TypeScript | 5.x | Type safety | Industry standard | HIGH - already using |
| Tailwind CSS | 4.x | Styling | Utility-first, shadcn/ui integration | HIGH - already using |
| shadcn/ui | latest | Component library | Copy-paste model, full ownership | HIGH - already using |

### Dashboard UI Layer

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **TanStack Table v8** | ^8.21.0 | Data tables | Headless, sorting, filtering, pagination, 10K+ rows | HIGH |
| **shadcn/ui Charts** | latest | Data visualization | 53 pre-built charts, Recharts-based, matches shadcn theme | HIGH |
| **Recharts** | ^2.15.0 | Chart library | Underlies shadcn Charts, composable | HIGH |
| **Tremor** | ^3.18.0 | Dashboard components | Optional: pre-built KPI cards, metrics (200KB vs 50KB shadcn) | MEDIUM |

**Rationale:**
- **TanStack Table v8** is the industry standard for React data tables. Headless architecture means it works with shadcn/ui styling. Server-side pagination/sorting/filtering support critical for SEO data.
- **shadcn/ui Charts** (new in 2025) provides 53 production-ready chart components styled for shadcn/ui. Uses Recharts under the hood but adds theming, dark mode, responsive design out of the box.
- **Tremor** as optional addition if you want pre-built dashboard layouts/KPI cards quickly. Tradeoff: 200KB vs shadcn's 50KB, less customization.

**What NOT to use:**
- ❌ **Raw Recharts without shadcn/ui Charts** - You'll spend days configuring axes, grids, tooltips to match your design system
- ❌ **Chart.js** - Canvas-based, harder to customize than D3-based (Recharts) solutions
- ❌ **Nivo** - Great but overkill for standard SEO dashboards; adds bundle size

### Caching Strategy

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **TanStack Query v5** | ^5.66.0 | Server state management | Caching, deduplication, background refetch, mutations | HIGH |
| **nuqs** | ^2.3.0 | URL state management | Type-safe query params, shareable state, ~6KB | HIGH |
| **Upstash Redis** | ^1.34.0 | Edge caching | Serverless Redis, 1-2ms response, rate limiting | MEDIUM |
| **@upstash/ratelimit** | ^2.0.5 | API rate limiting | Edge-compatible, protects DataForSEO quotas | MEDIUM |

**Rationale:**
- **TanStack Query v5** is the 2025 standard for server state. Treats server state as first-class citizen with automatic caching, background refetching, stale-while-revalidate. Perfect for DataForSEO API responses that change slowly.
  - `staleTime`: 5-15 minutes for SEO metrics (don't hammer DataForSEO)
  - `gcTime`: 24 hours (keep data for quick revisits)
  - DevTools for debugging cache state
- **nuqs** ("knucks") is the modern solution for URL state. Type-safe, works like `useState` but persists to URL. Critical for dashboard filters, date ranges, pagination that users want to share/bookmark.
- **Upstash Redis** for edge caching of expensive calculations or DataForSEO responses that exceed TanStack Query's client-side cache. HTTP-based, works on Vercel Edge.

**TanStack Query vs SWR:**
- TanStack Query: 16.2KB, more features, DevTools, larger community
- SWR: 5.3KB, simpler, Vercel-maintained
- **Choose TanStack Query** for dashboards - you need the DevTools, mutations, and advanced features.

### Background Job Architecture

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Inngest** | ^3.31.0 | Background jobs & workflows | Runs on your infrastructure, event-driven, great DX | HIGH |

**Rationale:**
- **Inngest** is the recommended choice for DataForSEO-heavy workflows:
  - Runs on YOUR infrastructure (Vercel functions) - no external worker needed
  - Event-driven: trigger DataForSEO syncs from database changes, user actions, or schedules
  - Real-time updates: stream progress to dashboard via `Inngest.Realtime`
  - Automatic retries, idempotency, observability
  - **100,000 free executions/month** (generous free tier)
  - Clean integration: `inngest.send({ name: "seo/sync", data: { siteId } })`

**Inngest vs Trigger.dev:**

| Factor | Inngest | Trigger.dev |
|--------|---------|-------------|
| **Execution** | Your infrastructure (Vercel) | Their infrastructure |
| **Pricing** | Steps-based (100K free/month) | Per-run ($20 base + usage) |
| **Long jobs (>60s)** | Requires flow control | Native support (CRIU checkpoints) |
| **DataForSEO integration** | Clean event-driven | Good but separate infra |
| **Real-time updates** | Built-in Realtime API | Requires WebSocket/SSE setup |
| **Next.js integration** | Native SDK | Good SDK |
| **Observability** | Dashboard + logs | Dashboard + logs |

**Choose Inngest because:**
1. You already have DataForSEO MCP integration - keep execution in your stack
2. Your use case (on-demand refresh, manual triggers) fits Inngest's event model perfectly
3. Better pricing for your expected volume (beta: 1 site/user, 8 dashboards)
4. Real-time progress updates to dashboard built-in
5. No additional infrastructure to manage

**What NOT to use:**
- ❌ **BullMQ** - Requires Redis server you manage, doesn't fit serverless model
- ❌ **pg-boss** - PostgreSQL-based, good but Inngest has better DX for this use case
- ❌ **Custom polling** - Too fragile for production SEO data syncing

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Zustand** | ^5.0.0 | Global UI state | Minimal (1.2KB), simple, no boilerplate | HIGH |
| **TanStack Query** | ^5.66.0 | Server state | Already in caching layer above | HIGH |
| **nuqs** | ^2.3.0 | URL state | Already in caching layer above | HIGH |
| **React Context** | built-in | Theme/auth | Simple global providers | HIGH |

**Rationale:**
Modern React state management is layered:
1. **Server state** → TanStack Query (DataForSEO data, dashboard metrics)
2. **URL state** → nuqs (filters, pagination, date ranges)
3. **Global UI state** → Zustand (sidebar open/closed, theme, selected dashboard tab)
4. **Local state** → useState/useReducer (form inputs, component toggles)

**Zustand over Redux because:**
- 1.2KB vs 20KB (Redux Toolkit + React-Redux)
- No boilerplate: `create((set) => ({ count: 0, increment: () => set(...) }))`
- Perfect for "sidebar state" and "theme" - simple global state without ceremony
- Hooks-based, TypeScript-first

**What NOT to use:**
- ❌ **Redux Toolkit** - Overkill for dashboard UI state. Choose only if you need time-travel debugging, strict middleware, or enterprise compliance.
- ❌ **Jotai/Recoil** - Atomic state is powerful but unnecessary complexity for this use case.
- ❌ **Context for frequent updates** - Will cause re-render issues in data-heavy dashboards.

### Database (Already in Use)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Neon PostgreSQL** | serverless | Primary database | Serverless, scales to zero, branching | HIGH - already using |
| **Drizzle ORM** | ^0.39.0 | Type-safe queries | SQL-like syntax, lightweight, fast | HIGH - already using |
| **@neondatabase/serverless** | latest | Neon driver | WebSocket/HTTP adapters for serverless | HIGH |

---

## Installation

### Core Dependencies

```bash
# Dashboard UI
npm install @tanstack/react-table
npx shadcn add chart  # shadcn/ui Charts
npm install recharts   # Underlying chart library

# Caching & State
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install nuqs
npm install zustand

# Background Jobs
npm install inngest

# Edge Caching (optional, for rate limiting)
npm install @upstash/redis @upstash/ratelimit
```

### Provider Setup

```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutes
      gcTime: 1000 * 60 * 60 * 24,  // 24 hours
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </NuqsAdapter>
  )
}
```

---

## Architecture Integration with DataForSEO

### Recommended Data Flow

```
User Action (refresh button, login)
         ↓
Inngest Event (seo/sync-requested)
         ↓
Inngest Function (runs on Vercel)
         ↓
DataForSEO MCP Tools (via lib/mcp/)
         ↓
Drizzle ORM → Neon PostgreSQL
         ↓
TanStack Query Cache (auto-refreshed)
         ↓
Dashboard UI (shadcn/ui + charts)
```

### Cache Invalidation Strategy

```typescript
// lib/dashboard/sync.ts
import { inngest } from '@/lib/inngest/client'
import { queryClient } from '@/lib/query-client'

export async function triggerSEOSync(siteId: string) {
  // 1. Invalidate cache immediately (optimistic UI)
  queryClient.invalidateQueries({ queryKey: ['seo', siteId] })
  
  // 2. Send to Inngest for processing
  await inngest.send({
    name: 'seo/sync',
    data: { siteId, requestedAt: new Date().toISOString() },
  })
}

// Inngest function
export const syncSEOData = inngest.createFunction(
  { id: 'sync-seo-data', retries: 3 },
  { event: 'seo/sync' },
  async ({ event, step }) => {
    const { siteId } = event.data
    
    // Step 1: Website Audit
    const audit = await step.run('website-audit', async () => {
      // Call DataForSEO via MCP
      return await dataforseo.audit(siteId)
    })
    
    // Step 2: Competitor Monitor
    const competitors = await step.run('competitor-monitor', async () => {
      return await dataforseo.competitors(siteId)
    })
    
    // Step 3: Save to database
    await step.run('save-results', async () => {
      await db.insert(seoData).values({ siteId, audit, competitors })
    })
    
    // Real-time update to dashboard
    await step.run('notify-dashboard', async () => {
      await inngest.realtime.publish({
        channel: `seo-sync:${siteId}`,
        data: { status: 'complete', timestamp: Date.now() }
      })
    })
    
    return { siteId, completedAt: new Date().toISOString() }
  }
)
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Chosen |
|----------|-------------|-------------|----------------|
| Background Jobs | Inngest | Trigger.dev | Trigger.dev runs on their infrastructure; Inngest keeps execution in your stack which fits DataForSEO MCP integration better |
| Background Jobs | Inngest | BullMQ | BullMQ requires managed Redis; Inngest is serverless-native |
| Data Fetching | TanStack Query | SWR | TanStack Query has better DevTools and mutations for dashboard interactions |
| Charts | shadcn/ui Charts | Tremor | Tremor is faster to set up but 4x larger bundle; shadcn Charts matches existing design system |
| URL State | nuqs | Custom useSearchParams | nuqs provides type safety, throttling, SSR support that manual implementation lacks |
| Global State | Zustand | Redux Toolkit | Redux is overkill for dashboard UI state; Zustand is 16x smaller |

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Dashboard UI (shadcn/ui + TanStack Table) | HIGH | Battle-tested, 2025 industry standard, multiple sources confirm |
| Charts (Recharts + shadcn/ui Charts) | HIGH | shadcn/ui Charts is new but Recharts is mature; community consensus |
| Caching (TanStack Query) | HIGH | Dominant solution in React ecosystem, years of production use |
| Background Jobs (Inngest) | HIGH | Strong 2025 recommendations for Next.js + serverless, fits DataForSEO use case |
| State Management (Zustand + nuqs) | HIGH | Zustand is mature (50K+ stars), nuqs gaining rapid adoption |
| Database (Neon + Drizzle) | HIGH | Already using, excellent for serverless |

---

## Phase-Specific Implementation Notes

### Phase 1: Foundation (Weeks 1-2)
- Install TanStack Query + Devtools
- Setup nuqs provider
- Add Zustand for sidebar/theme state
- Create basic dashboard layout with shadcn/ui

### Phase 2: Data Integration (Weeks 3-4)
- Setup Inngest
- Create DataForSEO sync functions
- Build first dashboard (Overview) with TanStack Table
- Implement URL state for filters

### Phase 3: Visualization (Weeks 5-6)
- Add shadcn/ui Charts
- Build remaining 7 dashboards
- Implement real-time sync status updates

### Phase 4: Polish (Weeks 7-8)
- Add Upstash Redis for edge caching
- Implement rate limiting
- Performance optimization

---

## Sources

### High Confidence (Official Docs / Context7)
- TanStack Query v5 Documentation: https://tanstack.com/query/v5/docs
- Inngest Documentation: https://www.inngest.com/docs
- shadcn/ui Charts: https://ui.shadcn.com/charts
- nuqs Documentation: https://nuqs.47ng.com
- Zustand Documentation: https://docs.pmnd.rs/zustand

### Medium Confidence (Community / 2025 Articles)
- "TanStack Query vs SWR 2025" - Refine.dev: https://refine.dev/blog/react-query-vs-tanstack-query-vs-swr-2025/
- "Inngest vs Trigger.dev" - NextBuild: https://nextbuild.co/blog/background-jobs-vercel-inngest-trigger
- "shadcn Dashboard Tutorial 2026" - DesignRevision: https://designrevision.com/blog/shadcn-dashboard-tutorial
- "React State Management 2025" - DeveloperWay: https://www.developerway.com/posts/react-state-management-2025
- "nuqs React Advanced 2025" - InfoQ: https://www.infoq.com/news/2025/12/nuqs-react-advanced/

### Verification Notes
- All version numbers current as of February 2026
- TanStack Query v5 is latest major version (v4 deprecated)
- Inngest v3 is current (Connect API released late 2024)
- shadcn/ui Charts launched Q4 2024, now mature
- Next.js 16 + React 19 compatibility verified for all recommendations
