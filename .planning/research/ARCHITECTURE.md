# Dashboard Data Architecture

**Project:** SEOBOT - Dashboard + SEO SaaS Platform
**Domain:** SEO SaaS Dashboard Data Systems
**Researched:** 2026-02-24
**Confidence:** HIGH

---

## Executive Summary

SEO SaaS dashboard architecture requires a **multi-layered caching strategy** combined with **async job orchestration** to handle expensive third-party API calls (DataForSEO) efficiently. The architecture centers on three principles:

1. **Never block the user** - Data fetching happens asynchronously with polling/UI updates
2. **Cache aggressively** - Multiple cache layers reduce API costs by 60-80%
3. **Stale-while-revalidate** - Show cached data immediately, refresh in background

---

## Recommended Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DASHBOARD UI                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │   Overview   │ │  Rankings    │ │  Competitors │ │   Keywords   │       │
│  │   Cards      │ │   Chart      │ │   Table      │ │   Explorer   │       │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘       │
└─────────┼────────────────┼────────────────┼────────────────┼──────────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │      Next.js 16 App Router     │
                    │   React Server Components      │
                    │   (Parallel Data Fetching)     │
                    └───────────────┬───────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
┌─────────▼─────────┐    ┌──────────▼──────────┐   ┌────────▼───────┐
│   Cache Layer 1   │    │    Cache Layer 2      │   │  Cache Layer 3 │
│   (In-Memory)     │    │   (Upstash Redis)     │   │  (Neon DB)     │
│                   │    │                       │   │                │
│ • Server Comps    │    │ • Query results       │   │ • Dashboard    │
│ • Next.js fetch   │    │ • Session data        │   │   snapshots    │
│   cache           │    │ • Rate limit state    │   │ • Historical   │
│                   │    │                       │   │   trends       │
└───────────────────┘    └───────────────────────┘   └────────────────┘
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │      Data Orchestration Layer   │
                    │                                 │
                    │  ┌────────────┐ ┌────────────┐ │
                    │  │   Cache    │ │   Stale    │ │
                    │  │   Manager  │ │  Checker   │ │
                    │  └────────────┘ └────────────┘ │
                    │                                 │
                    │  ┌────────────┐ ┌────────────┐ │
                    │  │   Async    │ │   Refresh  │ │
                    │  │   Queue    │ │  Scheduler │ │
                    │  └────────────┘ └────────────┘ │
                    └─────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
┌─────────▼──────────┐   ┌─────────▼──────────┐   ┌──────────▼────────┐
│   DataForSEO MCP   │   │   Firecrawl MCP    │   │    Jina MCP       │
│   (70+ endpoints)  │   │   (Crawling)       │   │   (Summarizer)    │
└────────────────────┘   └────────────────────┘   └───────────────────┘
```

---

## Component Boundaries

### 1. Dashboard Data Service (`lib/dashboard/`)

**Responsibility:** Central hub for all dashboard data operations

**Communicates With:**
- React Server Components (provides data)
- Cache Manager (reads/writes cache)
- Job Queue (enqueues async tasks)
- DataForSEO MCP (triggers API calls)

**Key Functions:**
```typescript
// Core data fetching with stale-while-revalidate pattern
async function getDashboardData(projectId: string, options: {
  maxAge?: number      // Max cache age in seconds
  forceRefresh?: boolean  // Bypass cache
  priority?: 'high' | 'normal' | 'low'
})

// Background refresh orchestration  
async function scheduleRefresh(projectId: string, dataTypes: DataType[])

// Real-time status for pending operations
async function getPendingOperations(projectId: string)
```

---

### 2. Cache Manager (`lib/cache/`)

**Responsibility:** Multi-layer caching with automatic invalidation

**Communicates With:**
- Drizzle ORM (table-level cache invalidation)
- Upstash Redis (distributed cache)
- Next.js Cache API (Server Component cache)

**Architecture Pattern:**

```
┌────────────────────────────────────────────┐
│           Cache Manager                     │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │         Layer 1: Memory              │   │
│  │  • React Server Component cache     │   │
│  │  • Next.js fetch cache              │   │
│  │  • TTL: Request-scoped              │   │
│  └─────────────────────────────────────┘   │
│                    │                        │
│  ┌─────────────────────────────────────┐   │
│  │         Layer 2: Redis               │   │
│  │  • Drizzle query cache              │   │
│  │  • API response cache               │   │
│  │  • Session-based dashboards         │   │
│  │  • TTL: 1 hour - 24 hours           │   │
│  └─────────────────────────────────────┘   │
│                    │                        │
│  ┌─────────────────────────────────────┐   │
│  │         Layer 3: Database            │   │
│  │  • Dashboard snapshots               │   │
│  │  • Historical aggregations           │   │
│  │  • Computed metrics cache            │   │
│  │  • TTL: Configurable (days/weeks)    │   │
│  └─────────────────────────────────────┘   │
│                                             │
└────────────────────────────────────────────┘
```

**Cache Key Strategy:**
```typescript
// Hierarchical cache keys for granular invalidation
`dashboard:${projectId}:${dataType}:${granularity}:${dateRange}`
`api:dataforseo:${endpoint}:${hash(params)}`
`query:${tableName}:${hash(queryParams)}`
```

---

### 3. Job Queue (`lib/queue/`)

**Responsibility:** Async processing of DataForSEO tasks

**Communicates With:**
- Vercel Cron (scheduled job triggers)
- DataForSEO MCP (submits tasks)
- Database (persists job state)
- SSE/WS layer (pushes status updates)

**Job Types:**

| Type | Description | Trigger |
|------|-------------|---------|
| `refresh_rankings` | Update ranking positions | Cron (daily), Manual, Staleness check |
| `fetch_competitors` | Pull competitor data | Manual, Onboarding |
| `audit_site` | Run site audit | Manual, Scheduled |
| `aggregate_metrics` | Compute trend data | Cron (weekly) |
| `enrich_keywords` | Keyword data expansion | User action |

**Job State Machine:**

```
        ┌──────────┐
        │  queued  │
        └────┬─────┘
             │ dequeue
             ▼
        ┌──────────┐
        │ running  │◄──────────────────────────┐
        └────┬─────┘                           │
             │                                 │
     ┌───────┴───────┐                       │
     │               │                       │
     ▼               ▼                       │
┌─────────┐    ┌──────────┐                 │
│completed│    │  failed  │──retry──────────┘
└─────────┘    └──────────┘
```

---

### 4. DataForSEO Orchestrator (`lib/mcp/dataforseo/orchestrator.ts`)

**Responsibility:** Cost-optimized API interaction

**Communicates With:**
- Job Queue (receives task requests)
- DataForSEO MCP (makes API calls)
- Cache Manager (stores responses)

**Cost Optimization Strategies:**

1. **Request Deduplication**
   ```typescript
   // Identical requests in flight are batched
   const pendingRequests = new Map<string, Promise<any>>()
   
   async function fetchWithDedup(key: string, fetcher: () => Promise<any>) {
     if (pendingRequests.has(key)) {
       return pendingRequests.get(key)
     }
     const promise = fetcher()
     pendingRequests.set(key, promise)
     promise.finally(() => pendingRequests.delete(key))
     return promise
   }
   ```

2. **Smart Polling**
   - Use `tasks_ready` endpoint (bulk check, 20 calls/min, no charge)
   - Exponential backoff for pending tasks
   - Webhook/pingback for high-volume scenarios

3. **Result Caching**
   - Cache SERP results for 24 hours (rankings don't change frequently)
   - Cache keyword data for 7 days
   - Cache domain metrics for 30 days

---

### 5. Real-Time Status Layer (`lib/realtime/`)

**Responsibility:** Push updates to dashboard without polling

**Communicates With:**
- Dashboard UI (via Server-Sent Events)
- Job Queue (monitors job progress)
- Database (checks data freshness)

**Technology Choice:**

| Approach | Best For | Implementation |
|----------|----------|----------------|
| **SSE** (Recommended) | One-way updates, simple | `EventSource` in client, `ReadableStream` in API route |
| **Long Polling** | Fallback for older browsers | Periodic API calls with connection hold |
| **WebSockets** | Bi-directional, chat | Overkill for dashboards |

**Implementation Pattern:**
```typescript
// app/api/dashboard/updates/route.ts
export async function GET(request: Request) {
  const projectId = getProjectId(request)
  
  const stream = new ReadableStream({
    start(controller) {
      // Subscribe to job updates for this project
      jobQueue.subscribe(projectId, (update) => {
        controller.enqueue(`data: ${JSON.stringify(update)}\n\n`)
      })
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    }
  })
}
```

---

## Data Flow Patterns

### Pattern 1: On-Demand Refresh (User-Initiated)

```
User clicks "Refresh"
        │
        ▼
┌──────────────────┐
│ Dashboard UI     │
│ (optimistic UI)  │
└────────┬─────────┘
         │ POST /api/dashboard/refresh
         ▼
┌──────────────────┐
│ Job Queue        │
│ (enqueue jobs)   │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│Job 1   │ │Job 2   │
│Rankings│ │Compet. │
└───┬────┘ └───┬────┘
    │          │
    ▼          ▼
┌──────────────────┐
│ DataForSEO       │
│ (async tasks)    │
└────────┬─────────┘
         │ results via webhook/poll
         ▼
┌──────────────────┐
│ Database         │
│ (update tables)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Cache Manager    │
│ (invalidate)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ SSE Broadcast    │
│ (notify clients) │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Dashboard UI     │
│ (update display) │
└──────────────────┘
```

### Pattern 2: Background Refresh (Scheduled)

```
Vercel Cron triggers
        │
        ▼
┌──────────────────┐
│ Cron Handler     │
│ (identify stale  │
│  projects)       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Job Queue        │
│ (batch jobs by   │
│  priority)       │
└────────┬─────────┘
         │
    ┌────┴────┬────────┐
    ▼         ▼        ▼
┌────────┐ ┌────────┐ ┌────────┐
│High    │ │Medium  │ │Low     │
│Priority│ │Priority│ │Priority│
└───┬────┘ └───┬────┘ └───┬────┘
    │          │          │
    ▼          ▼          ▼
┌──────────────────────────────────┐
│ DataForSEO Rate Limiter         │
│ (max 2000 req/min, with         │
│  exponential backoff)            │
└──────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│ Database updates │
│ (no UI impact)   │
└──────────────────┘
```

### Pattern 3: Staleness Check on Login

```
User logs in
        │
        ▼
┌──────────────────┐
│ Session Init     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Staleness Check  │
│ (per project)    │
│                  │
│ if lastUpdate >  │
│    threshold:    │
│   enqueue refresh│
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ Fresh  │ │ Stale  │
│ Data   │ │ Data   │
└───┬────┘ └───┬────┘
    │          │
    ▼          ▼
┌────────┐ ┌─────────────────┐
│Display │ │ Display +       │
│Directly│ │ Background Job  │
└────────┘ └─────────────────┘
```

---

## Build Order (Dependencies)

### Phase 1: Foundation (Required First)

```
1. Database Schema
   └── Tables: dashboard_snapshots, refresh_jobs, api_usage_logs
   
2. Cache Layer
   └── Redis connection, Drizzle cache extension, cache key utilities
   
3. DataForSEO Rate Limiter
   └── Token bucket algorithm, request queue, retry logic
```

### Phase 2: Core Data Pipeline

```
4. Job Queue System
   └── Depends on: Database Schema
   └── Features: Job state machine, priority queuing, retry logic
   
5. DataForSEO Orchestrator
   └── Depends on: Rate Limiter, Job Queue
   └── Features: Task submission, polling, result processing
   
6. Dashboard Data Service
   └── Depends on: Cache Layer, Job Queue
   └── Features: Data fetching, staleness detection
```

### Phase 3: Real-Time & UI

```
7. Real-Time Status Layer
   └── Depends on: Job Queue
   └── Features: SSE endpoints, status aggregation
   
8. Dashboard Components
   └── Depends on: Dashboard Data Service, Real-Time Layer
   └── Features: Cards, charts, refresh controls
```

### Phase 4: Automation

```
9. Cron Jobs
   └── Depends on: All previous
   └── Features: Scheduled refresh, usage reports
   
10. Cost Optimization
    └── Depends on: API Usage Logs
    └── Features: Usage dashboards, alerts, caching analytics
```

---

## Suggested File Structure

```
lib/
├── dashboard/
│   ├── index.ts                 # Main exports
│   ├── data-service.ts          # DashboardDataService class
│   ├── staleness-detector.ts    # Staleness checking logic
│   └── types.ts                 # Dashboard data types
│
├── cache/
│   ├── index.ts
│   ├── manager.ts               # Multi-layer cache manager
│   ├── keys.ts                  # Cache key utilities
│   └── invalidation.ts          # Cache invalidation rules
│
├── queue/
│   ├── index.ts
│   ├── manager.ts               # Job queue implementation
│   ├── types.ts                 # Job type definitions
│   └── handlers/                # Job-specific handlers
│       ├── rankings-handler.ts
│       ├── competitors-handler.ts
│       └── audit-handler.ts
│
├── mcp/dataforseo/
│   ├── orchestrator.ts          # Cost-optimized API orchestrator
│   ├── rate-limiter.ts          # Token bucket rate limiting
│   ├── task-pool.ts            # Request deduplication
│   └── polling-strategy.ts      # Smart polling logic
│
└── realtime/
    ├── index.ts
    ├── sse-server.ts            # SSE endpoint handler
    └── status-aggregator.ts    # Job status aggregation

app/api/
├── dashboard/
│   ├── refresh/route.ts         # Manual refresh endpoint
│   ├── data/route.ts            # Data fetching endpoint
│   └── updates/route.ts         # SSE endpoint
│
└── cron/
    ├── refresh-stale/route.ts   # Staleness check + enqueue
    └── aggregate-metrics/route.ts  # Background aggregation
```

---

## DataForSEO-Specific Patterns

### Task Lifecycle

DataForSEO uses an async task model. Here's the recommended handling:

```typescript
// 1. Submit task (immediate response with task ID)
const task = await dataforseo.submitTask({
  keyword: "best seo tools",
  location: 2840,
  // ...
})

// 2. Store pending task
await jobQueue.create({
  type: 'dataforseo_task',
  externalId: task.id,
  status: 'pending',
  projectId: project.id
})

// 3. Poll for completion (efficient bulk polling)
async function pollTasksReady() {
  // Get up to 1000 completed tasks (no charge)
  const ready = await dataforseo.getTasksReady()
  
  for (const task of ready.tasks) {
    // Fetch results (this is when you're charged)
    const results = await dataforseo.getTaskResults(task.id)
    
    // Store and cache
    await cacheManager.set(
      `api:dataforseo:${task.endpoint}:${task.id}`,
      results,
      { ttl: 86400 } // 24 hours
    )
    
    // Update database
    await db.update(dashboardData)
      .set({ data: results, updatedAt: new Date() })
      .where(eq(dashboardData.taskId, task.id))
  }
}
```

### Cost Optimization Checklist

| Strategy | Implementation | Savings |
|----------|---------------|---------|
| **Request deduplication** | Map pending requests, return same promise | 20-30% |
| **Aggressive caching** | Cache SERP results 24h, metrics 7d | 60-80% |
| **Smart polling** | Use `tasks_ready` endpoint (free) | 10-15% |
| **Batch processing** | Group similar requests | 15-25% |
| **Result filtering** | Use `stop_crawl_on_match` | 10-20% |
| **Depth limiting** | Fetch only needed result pages | 20-40% |

---

## Anti-Patterns to Avoid

### 1. Synchronous API Calls in Server Components

❌ **Bad:** Blocking render with API calls
```typescript
// DON'T: This blocks the page render
export default async function Dashboard() {
  const data = await fetchDataForSEO() // 5-10 second delay
  return <DashboardUI data={data} />
}
```

✅ **Good:** Show cached data, refresh async
```typescript
// DO: Return cached data immediately
export default async function Dashboard() {
  const data = await getDashboardData({ maxAge: 3600 })
  
  // Trigger background refresh if needed
  if (isStale(data)) {
    await scheduleBackgroundRefresh()
  }
  
  return <DashboardUI data={data} />
}
```

### 2. Naive Polling

❌ **Bad:** Poll every second for each user
```typescript
// DON'T: This hits rate limits and costs money
setInterval(() => fetchUpdates(), 1000)
```

✅ **Good:** Smart polling with exponential backoff
```typescript
// DO: Backoff strategy + bulk polling
const pollWithBackoff = async (attempt: number) => {
  const delay = Math.min(1000 * 2 ** attempt, 30000) // Max 30s
  await sleep(delay)
  return dataforseo.getTasksReady() // Bulk check (free)
}
```

### 3. No Cache Invalidation Strategy

❌ **Bad:** Cache forever or never cache
```typescript
// DON'T: Static forever or always fetch
const data = await fetch(url, { cache: 'force-cache' }) // Never updates
const data = await fetch(url, { cache: 'no-store' })   // Always expensive
```

✅ **Good:** Tagged cache with selective invalidation
```typescript
// DO: Cache with tags for targeted invalidation
const data = await fetch(url, {
  next: {
    revalidate: 3600,
    tags: [`project:${projectId}`, `metric:${metricType}`]
  }
})

// Invalidate specific tags when data changes
await revalidateTag(`project:${projectId}`)
```

---

## Sources & References

### Official Documentation
- **Next.js 16 Caching**: https://nextjs.org/blog/next-16 (HIGH confidence)
- **DataForSEO API v3**: https://docs.dataforseo.com/v3/ (HIGH confidence)
- **Drizzle ORM Cache**: https://orm.drizzle.team/docs/cache (HIGH confidence)
- **Vercel Cron Jobs**: https://vercel.com/docs/cron-jobs (HIGH confidence)

### Architecture Patterns
- "Next.js 16 Architecture Blueprint for Large-Scale Applications" - Suresh Kumar Ariya Gowder (MEDIUM confidence)
- "Data Fetching, Caching & Revalidation in Next.js" - Stackademic (MEDIUM confidence)
- "SERP API Best Practices 2025" - SERPPost (MEDIUM confidence)

### Real-Time Patterns
- "Long-Polling vs SSE vs WebSockets" - Medium 2026 (MEDIUM confidence)
- "WebSocket vs Polling vs SSE" - LinkedIn Dec 2025 (MEDIUM confidence)

### Cost Optimization
- "How to Save Costs when Using DataForSEO" - SEO Utils (MEDIUM confidence)
- "Budget-Friendly Rank Tracking Strategies" - DataForSEO Blog (HIGH confidence)

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| **Next.js 16 Caching** | HIGH | Official documentation, stable APIs |
| **DataForSEO Patterns** | HIGH | Official API docs, well-established async model |
| **Drizzle + Redis** | MEDIUM-HIGH | Official docs, some reported issues with cache invalidation |
| **Vercel Cron** | HIGH | Official documentation, production-ready |
| **Real-Time Updates** | MEDIUM | Multiple valid approaches, context-dependent |
| **Cost Optimization** | MEDIUM-HIGH | DataForSEO best practices, community patterns |

---

## Open Questions for Phase-Specific Research

1. **Webhook vs Polling Trade-offs**: For high-volume users (>1000 tasks/min), DataForSEO recommends webhooks. Need to assess volume projections.

2. **Cache Storage Costs**: Upstash Redis pricing vs database storage for cached data - need cost analysis at projected scale.

3. **Multi-tenant Isolation**: Should cache keys include user ID or project ID for proper isolation in shared Redis instance?

4. **Dashboard Data Retention**: How long to keep historical dashboard snapshots? Impacts database storage planning.

---

*Research completed: 2026-02-24*
