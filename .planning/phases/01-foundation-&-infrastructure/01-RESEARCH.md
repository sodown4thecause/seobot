# Phase 1: Foundation & Infrastructure - Research

**Researched:** 2026-02-24  
**Domain:** Background Jobs, Caching, API Resilience, Real-time Updates, Cost Tracking  
**Confidence:** HIGH

## Summary

This research covers the technical foundation for implementing a bulletproof SEO dashboard infrastructure with DataForSEO integration. The primary challenges addressed include: orchestrating long-running background jobs via Inngest, implementing a multi-layer caching strategy for sub-3-second dashboard loads, handling DataForSEO's complex rate limiting, ensuring API resilience with circuit breakers, storing flexible dashboard data in PostgreSQL, streaming real-time job status updates, and tracking per-user API costs.

**Primary recommendation:** Use Inngest for job orchestration, Next.js 16's `"use cache"` with Redis/Upstash for server-side caching, TanStack Query v5 for client state, a custom circuit breaker for DataForSEO resilience, and SSE for real-time job updates.

## Standard Stack

### Core Infrastructure
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `inngest` | ^3.0.0 | Background job orchestration | Purpose-built for durable serverless workflows, first-class Next.js support |
| `@upstash/redis` | ^1.28.0 | Redis client for serverless | HTTP-based, global edge replication, no connection pooling issues |
| `@tanstack/react-query` | ^5.x | Client-side server state | Industry standard for React data fetching, caching, synchronization |
| `opossum` | ^8.x | Circuit breaker pattern | Hystrix-compliant, battle-tested npm package for resilience |
| `exponential-backoff` | ^3.x | Retry with backoff | Clean implementation of exponential backoff with jitter |

### Database & Storage
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `drizzle-orm` | ^0.30.0 | Type-safe SQL builder | All database operations with Neon PostgreSQL |
| `@neondatabase/serverless` | ^0.9.0 | Neon connection | Serverless-compatible Postgres driver |

### Next.js 16 Features
| Feature | Configuration | Purpose |
|---------|---------------|---------|
| `"use cache"` | `cacheComponents: true` in next.config.ts | Component-level server caching |
| `"use cache: remote"` | Redis/Upstash adapter | Distributed caching across instances |
| `cacheLife` | Custom profiles | Fine-grained TTL control |

**Installation:**
```bash
npm install inngest @upstash/redis @tanstack/react-query opossum exponential-backoff
npm install drizzle-orm @neondatabase/serverless
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inngest | BullMQ + Redis | BullMQ requires Redis management; Inngest is managed, purpose-built for workflows |
| SSE | WebSockets | WebSockets overkill for one-way server-to-client; SSE simpler, auto-reconnects |
| Custom circuit breaker | `opossum` | opossum is Hystrix-compliant with half-open state, proven in production |

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── inngest/              # Inngest client and function definitions
│   │   ├── client.ts         # Inngest client singleton
│   │   ├── functions/        # Background job definitions
│   │   │   ├── data-refresh.ts
│   │   │   └── cost-tracker.ts
│   │   └── middleware/       # Inngest middleware (cost tracking, rate limiting)
│   ├── caching/              # Caching utilities
│   │   ├── redis.ts          # Upstash Redis client
│   │   ├── next-cache.ts     # Next.js "use cache" wrappers
│   │   └── tanstack/         # TanStack Query config
│   ├── resilience/           # Circuit breaker and retry logic
│   │   ├── circuit-breaker.ts
│   │   └── rate-limiter.ts
│   ├── sse/                  # Server-Sent Events utilities
│   │   ├── job-stream.ts     # Job status streaming
│   │   └── connection-manager.ts
│   └── db/                   # Database schema and utilities
│       ├── schema/
│       │   ├── dashboard-data.ts
│       │   ├── job-history.ts
│       │   └── cost-tracking.ts
│       └── jsonb-helpers.ts
└── app/
    ├── api/
    │   ├── inngest/route.ts   # Inngest serve endpoint
    │   ├── sse/
    │   │   └── jobs/[jobId]/route.ts  # SSE endpoint for job status
    │   └── dashboard/refresh/route.ts # Trigger refresh endpoint
    └── dashboard/
        └── page.tsx           # Dashboard with real-time updates
```

### Pattern 1: Inngest with Next.js 16 + Vercel
**What:** Event-driven durable functions for background job orchestration  
**When to use:** Long-running data collection, multi-step workflows, guaranteed execution  
**Example:**

```typescript
// src/lib/inngest/client.ts
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "seobot-dashboard",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// src/lib/inngest/functions/data-refresh.ts
export const dataRefreshJob = inngest.createFunction(
  { 
    id: "dashboard-data-refresh",
    retries: 3,
    concurrency: { limit: 5 },  // Prevent overwhelming DataForSEO
  },
  { event: "dashboard/refresh.requested" },
  async ({ event, step, runId }) => {
    const { userId, siteId, widgets } = event.data;
    
    // Step 1: Initialize job status
    await step.run("initialize-job", async () => {
      await db.insert(jobHistory).values({
        id: runId,
        userId,
        status: "running",
        startedAt: new Date(),
      });
    });
    
    // Step 2: Fetch data for each widget with built-in retries
    for (const widget of widgets) {
      await step.run(`fetch-${widget.type}`, async () => {
        const data = await fetchWidgetData(widget, { 
          userId,  // For cost attribution
          jobId: runId 
        });
        await saveWidgetData(siteId, widget.id, data);
      });
    }
    
    // Step 3: Complete job
    await step.run("complete-job", async () => {
      await db.update(jobHistory)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(jobHistory.id, runId));
    });
    
    return { success: true, jobId: runId };
  }
);

// src/app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { dataRefreshJob } from "@/lib/inngest/functions/data-refresh";

// Enable streaming for long-running jobs on Vercel
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [dataRefreshJob],
  streaming: "force", // Required for >10s jobs on Vercel
});
```

**Key configuration:**
- `streaming: "force"` enables 800s timeout on Vercel (vs default 10s)
- Endpoint must be at `/api/inngest` for auto-discovery
- Set `INNGEST_SIGNING_KEY` in production for security

### Pattern 2: Three-Layer Caching Strategy
**What:** Layered caching for optimal performance and freshness  

#### Layer 1: Next.js 16 "use cache" (Server-side)
```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;

// src/lib/caching/next-cache.ts
"use cache";

import { cacheLife } from "next/cache";

// Custom cache life profiles
const cacheProfiles = {
  dashboard: { 
    stale: 300,      // 5 min stale-while-revalidate
    revalidate: 600, // 10 min server revalidation
    expire: 86400,    // 24 hr expiration
  },
  widget: {
    stale: 60,
    revalidate: 300,
    expire: 3600,
  },
};

export async function getCachedDashboardData(siteId: string) {
  cacheLife(cacheProfiles.dashboard);
  
  const data = await db.query.dashboardData.findFirst({
    where: eq(dashboardData.siteId, siteId),
  });
  
  return data;
}
```

#### Layer 2: Redis/Upstash (Distributed)
```typescript
// src/lib/caching/redis.ts
import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached) return cached;
  
  const data = await fetcher();
  await redis.setex(key, ttl, data);
  return data;
}

export async function invalidateCache(pattern: string) {
  // Upstash Redis supports SCAN for pattern matching
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

#### Layer 3: TanStack Query (Client-side)
```typescript
// src/lib/caching/tanstack/config.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 min fresh data
      gcTime: 1000 * 60 * 30,       // 30 min garbage collection
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});

// Hook usage
function useDashboardData(siteId: string) {
  return useQuery({
    queryKey: ["dashboard", siteId],
    queryFn: () => fetchDashboardData(siteId),
    staleTime: 1000 * 60 * 5,  // Match Next.js cache stale time
  });
}
```

### Pattern 3: Circuit Breaker for DataForSEO
**What:** Prevent cascading failures when DataForSEO API is unavailable  

```typescript
// src/lib/resilience/circuit-breaker.ts
import CircuitBreaker from "opossum";

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  timeout?: number;
}

export function createDataForSEOCircuitBreaker(
  apiCall: Function,
  options: CircuitBreakerOptions = {}
) {
  const {
    failureThreshold = 5,     // Open after 5 failures
    resetTimeout = 30000,     // Try again after 30s
    timeout = 10000,           // 10s timeout per request
  } = options;

  const breaker = new CircuitBreaker(apiCall, {
    errorThresholdPercentage: (failureThreshold / 10) * 100,
    resetTimeout,
    timeout,
    volumeThreshold: 3,       // Minimum calls before calculating failures
  });

  breaker.on("open", () => {
    console.warn("DataForSEO circuit breaker OPEN - API unavailable");
  });

  breaker.on("halfOpen", () => {
    console.info("DataForSEO circuit breaker HALF-OPEN - testing recovery");
  });

  breaker.on("close", () => {
    console.info("DataForSEO circuit breaker CLOSED - API recovered");
  });

  return breaker;
}

// Usage with fallback
export async function resilientDataForSEOCall<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  const breaker = createDataForSEOCircuitBreaker(operation);
  
  try {
    return await breaker.fire();
  } catch (error) {
    if (breaker.opened) {
      // Return cached/fallback data
      return fallback;
    }
    throw error;
  }
}
```

### Pattern 4: Per-Endpoint Rate Limiting
**What:** Respect DataForSEO's different rate limits per endpoint  

```typescript
// src/lib/resilience/rate-limiter.ts
import { RateLimiterRedis } from "rate-limiter-flexible";
import { redis } from "@/lib/caching/redis";

// DataForSEO rate limits from official docs
const RATE_LIMITS = {
  general: { points: 2000, duration: 60 },           // 2000/min general
  liveGoogleAds: { points: 12, duration: 60 },         // 12/min live Google Ads
  userData: { points: 6, duration: 60 },              // 6/min user data
  apiStatus: { points: 10, duration: 60 },            // 10/min status
  errors: { points: 10, duration: 60 },               // 10/min errors
  tasksReady: { points: 20, duration: 60 },           // 20/min tasks_ready
};

export function createRateLimiter(endpoint: keyof typeof RATE_LIMITS) {
  const config = RATE_LIMITS[endpoint];
  
  return new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: `dfseo_ratelimit_${endpoint}`,
    points: config.points,
    duration: config.duration,
    blockDuration: 60,  // Block for 1 min if exceeded
  });
}

// Usage
export async function rateLimitedApiCall<T>(
  endpoint: keyof typeof RATE_LIMITS,
  apiCall: () => Promise<T>,
  key: string
): Promise<T> {
  const limiter = createRateLimiter(endpoint);
  
  try {
    await limiter.consume(key, 1);
    return await apiCall();
  } catch (rejRes) {
    if (rejRes.remainingPoints === 0) {
      // Rate limited - queue for later or return cached
      throw new Error(`Rate limit exceeded for ${endpoint}. Retry after ${rejRes.msBeforeNext}ms`);
    }
    throw rejRes;
  }
}
```

### Pattern 5: Bulk Polling with tasks_ready
**What:** Efficiently collect bulk task results using DataForSEO's tasks_ready endpoint  

```typescript
// src/lib/dataforseo/bulk-polling.ts
interface TaskPollingOptions {
  maxConcurrent: number;
  pollIntervalMs: number;
}

export async function pollBulkTasks<T>(
  taskIds: string[],
  fetchTaskResult: (id: string) => Promise<T>,
  options: TaskPollingOptions = { maxConcurrent: 5, pollIntervalMs: 5000 }
): Promise<Map<string, T | Error>> {
  const results = new Map<string, T | Error>();
  const pending = new Set(taskIds);
  
  while (pending.size > 0) {
    // Poll tasks_ready to check which are done
    const readyTasks = await fetchTasksReady();
    const readyIds = readyTasks.map(t => t.id);
    
    // Process ready tasks with concurrency limit
    const toProcess = readyIds.filter(id => pending.has(id));
    const chunks = chunk(toProcess, options.maxConcurrent);
    
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (id) => {
          try {
            const result = await fetchTaskResult(id);
            results.set(id, result);
            pending.delete(id);
          } catch (error) {
            results.set(id, error as Error);
            pending.delete(id);
          }
        })
      );
    }
    
    if (pending.size > 0) {
      await sleep(options.pollIntervalMs);
    }
  }
  
  return results;
}

// Use with Inngest steps for durability
export async function pollWithInngestStep(
  taskIds: string[],
  step: any  // Inngest step object
) {
  for (const taskId of taskIds) {
    // Each poll is a separate step - resumable after failures
    const result = await step.run(`poll-${taskId}`, async () => {
      return pollUntilComplete(taskId, {
        maxAttempts: 60,  // 5 min with 5s intervals
        intervalMs: 5000,
      });
    });
    
    await step.run(`save-${taskId}`, async () => {
      await saveTaskResult(taskId, result);
    });
  }
}
```

### Pattern 6: Server-Sent Events for Job Status
**What:** Real-time updates from background jobs to client  

```typescript
// src/app/api/sse/jobs/[jobId]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;
  
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial status
      const sendStatus = async () => {
        const job = await db.query.jobHistory.findFirst({
          where: eq(jobHistory.id, jobId),
        });
        
        const data = `data: ${JSON.stringify({
          type: "job-update",
          jobId,
          status: job?.status,
          progress: job?.progress,
          timestamp: new Date().toISOString(),
        })}\n\n`;
        
        controller.enqueue(encoder.encode(data));
        
        // Close stream if job is complete
        if (job?.status === "completed" || job?.status === "failed") {
          controller.close();
        }
      };
      
      // Poll for updates
      const interval = setInterval(sendStatus, 1000);
      
      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
      
      // Initial status
      sendStatus();
    },
  });
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

// Client-side hook
function useJobStatus(jobId: string | null) {
  const [status, setStatus] = useState<JobStatus | null>(null);
  
  useEffect(() => {
    if (!jobId) return;
    
    const eventSource = new EventSource(`/api/sse/jobs/${jobId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data);
      
      if (data.status === "completed" || data.status === "failed") {
        eventSource.close();
      }
    };
    
    eventSource.onerror = () => {
      // Auto-reconnects automatically
      console.error("SSE connection error");
    };
    
    return () => eventSource.close();
  }, [jobId]);
  
  return status;
}
```

### Pattern 7: Cost Tracking Architecture
**What:** Track per-user API costs with alert thresholds  

```typescript
// src/lib/cost-tracking/middleware.ts
export const costTrackingMiddleware = new InngestMiddleware({
  name: "Cost Tracking",
  init: () => ({
    onSendEvent: async ({ payload }) => {
      // Track event sending costs (if applicable)
    },
  }),
});

// Database schema (Drizzle)
// src/lib/db/schema/cost-tracking.ts
import { pgTable, uuid, timestamp, decimal, jsonb, text } from "drizzle-orm/pg-core";

export const apiUsage = pgTable("api_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  jobId: uuid("job_id"),
  endpoint: text("endpoint").notNull(),
  cost: decimal("cost", { precision: 10, scale: 6 }).notNull(),
  metadata: jsonb("metadata"),  // Task details, response size, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const userCostAlerts = pgTable("user_cost_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  threshold: decimal("threshold", { precision: 10, scale: 2 }).notNull(),
  currentSpend: decimal("current_spend", { precision: 10, scale: 2 }).default("0"),
  lastAlertSentAt: timestamp("last_alert_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cost tracking service
export async function trackApiCost(
  userId: string,
  endpoint: string,
  cost: number,
  metadata?: Record<string, any>
) {
  // Record the usage
  await db.insert(apiUsage).values({
    userId,
    endpoint,
    cost: cost.toString(),
    metadata,
  });
  
  // Check alert thresholds
  const alerts = await db.query.userCostAlerts.findMany({
    where: eq(userCostAlerts.userId, userId),
  });
  
  for (const alert of alerts) {
    const currentSpend = await getCurrentMonthSpend(userId);
    const thresholdValue = parseFloat(alert.threshold);
    
    // Alert at 50%, 80%, 95%
    const alertPoints = [0.5, 0.8, 0.95];
    for (const point of alertPoints) {
      if (
        currentSpend >= thresholdValue * point &&
        (!alert.lastAlertSentAt || shouldSendAlert(alert.lastAlertSentAt, point))
      ) {
        await sendCostAlert(userId, currentSpend, thresholdValue, point);
        await db.update(userCostAlerts)
          .set({ lastAlertSentAt: new Date() })
          .where(eq(userCostAlerts.id, alert.id));
      }
    }
  }
}
```

### Pattern 8: Flexible Dashboard Data (JSONB)
**What:** Store variable widget data in PostgreSQL JSONB  

```typescript
// src/lib/db/schema/dashboard-data.ts
import { pgTable, uuid, timestamp, text, jsonb, index } from "drizzle-orm/pg-core";

export const dashboardData = pgTable("dashboard_data", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").notNull(),
  widgetType: text("widget_type").notNull(),  // 'rankings', 'backlinks', etc.
  data: jsonb("data").notNull(),  // Flexible widget data
  metadata: jsonb("metadata").$type<{
    lastUpdated: string;
    dataAge: number;  // seconds
    source: string;   // DataForSEO endpoint
    cost: number;     // API cost for this data
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  siteWidgetIdx: index("site_widget_idx").on(table.siteId, table.widgetType),
  updatedAtIdx: index("updated_at_idx").on(table.updatedAt),
}));

// Query helpers for freshness
export async function getWidgetDataWithFreshness(
  siteId: string,
  widgetType: string,
  maxAgeSeconds: number = 3600
) {
  const record = await db.query.dashboardData.findFirst({
    where: and(
      eq(dashboardData.siteId, siteId),
      eq(dashboardData.widgetType, widgetType)
    ),
    orderBy: desc(dashboardData.updatedAt),
  });
  
  if (!record) return { data: null, freshness: "stale" };
  
  const age = Date.now() - new Date(record.updatedAt).getTime();
  const ageSeconds = Math.floor(age / 1000);
  
  let freshness: "fresh" | "stale" | "expired";
  if (ageSeconds < maxAgeSeconds * 0.5) freshness = "fresh";
  else if (ageSeconds < maxAgeSeconds) freshness = "stale";
  else freshness = "expired";
  
  return {
    data: record.data,
    freshness,
    lastUpdated: record.updatedAt,
    ageSeconds,
  };
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Job queue + retries | Custom queue | Inngest | Durable execution, automatic retries, observability, step functions |
| Circuit breaker logic | Naive if-else | `opossum` | Hystrix-compliant, battle-tested, half-open state, event emitters |
| Exponential backoff | DIY loop | `exponential-backoff` | Jitter, max delay, proper timing, tested |
| Redis connection | `ioredis` | `@upstash/redis` | Serverless-optimized, HTTP-based, no pooling headaches |
| Rate limiter | Custom counter | `rate-limiter-flexible` | Multiple algorithms, Redis store, battle-tested |
| Real-time updates | Polling | SSE | Native browser support, auto-reconnect, simple HTTP |
| Job status tracking | Custom polling | Inngest Realtime + SSE | Purpose-built for workflow updates |

**Key insight:** In serverless environments, infrastructure components must handle cold starts, connection management, and partial failures gracefully. Established libraries have solved these edge cases.

## Common Pitfalls

### Pitfall 1: Vercel Function Timeout Without Streaming
**What goes wrong:** Background jobs >10s fail on Vercel Hobby plan  
**Why it happens:** Default function timeout is 10s without Fluid Compute or streaming  
**How to avoid:**
- Enable `streaming: "force"` in Inngest serve handler
- Or use Edge runtime with `streaming: "allow"`
- Or upgrade to Vercel Pro with Fluid Compute (800s)

```typescript
// MUST have for long jobs on Vercel
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [dataRefreshJob],
  streaming: "force", // ← Essential
});
```

### Pitfall 2: Redis Connection Exhaustion
**What goes wrong:** "Too many connections" errors in production  
**Why it happens:** Traditional Redis clients (ioredis) hold persistent connections, unsuitable for serverless  
**How to avoid:** Use `@upstash/redis` which is HTTP-based, connectionless

### Pitfall 3: DataForSEO Rate Limit Errors
**What goes wrong:** 429 errors or "rate limit exceeded" at scale  
**Why it happens:** Different endpoints have vastly different limits (12/min vs 2000/min)  
**How to avoid:**
- Implement per-endpoint rate limiters
- Use tasks_ready for bulk polling (20/min limit)
- Queue tasks and spread them over time
- Implement graceful degradation with cached data

### Pitfall 4: Cache Stale Data on Dashboard
**What goes wrong:** Users see outdated data, "last updated" shows hours ago  
**Why it happens:** Cache invalidation not coordinated between layers  
**How to avoid:**
- Use consistent TTLs across Next.js cache, Redis, and TanStack Query
- Implement freshness indicators in UI
- Provide manual "Refresh Now" button that bypasses cache
- Use cache tags for targeted invalidation

### Pitfall 5: SSE Connection Leaks
**What goes wrong:** Memory leaks, orphaned connections  
**Why it happens:** Not properly cleaning up EventSource on component unmount  
**How to avoid:**
```typescript
useEffect(() => {
  const eventSource = new EventSource(url);
  // ... handlers ...
  
  return () => {
    eventSource.close(); // ← Essential cleanup
  };
}, []);
```

### Pitfall 6: Cost Tracking Data Loss
**What goes wrong:** API costs not recorded, alerts not triggered  
**Why it happens:** Cost tracking happens outside transaction, or async failures  
**How to avoid:**
- Record costs synchronously before API response is returned
- Use Inngest middleware for guaranteed execution
- Implement idempotency keys to prevent double-counting

### Pitfall 7: Circuit Breaker Not Testing Recovery
**What goes wrong:** Circuit stays open indefinitely, never recovers  
**Why it happens:** No half-open state testing  
**How to avoid:** Use `opossum` which implements proper half-open state

## Code Examples

### Complete Job Orchestration Flow

```typescript
// Client triggers refresh
// src/app/api/dashboard/refresh/route.ts
export async function POST(request: Request) {
  const { userId, siteId, widgets } = await request.json();
  
  // Send event to Inngest
  const { ids } = await inngest.send({
    name: "dashboard/refresh.requested",
    data: { userId, siteId, widgets },
  });
  
  return Response.json({ jobId: ids[0] });
}

// Inngest function handles the work
// src/lib/inngest/functions/data-refresh.ts
export const dataRefreshJob = inngest.createFunction(
  {
    id: "dashboard-data-refresh",
    retries: 3,
    concurrency: { limit: 5 },
    throttle: { limit: 10, period: "1m" },  // Respect rate limits
  },
  { event: "dashboard/refresh.requested" },
  async ({ event, step, runId }) => {
    const { userId, siteId, widgets } = event.data;
    
    await step.run("init", async () => {
      await redis.setex(`job:${runId}:status`, 3600, JSON.stringify({
        status: "running",
        progress: 0,
        total: widgets.length,
      }));
    });
    
    let completed = 0;
    for (const widget of widgets) {
      await step.run(`fetch-${widget.id}`, async () => {
        // Circuit breaker protected call
        const data = await resilientDataForSEOCall(
          () => fetchWidgetData(widget),
          { cached: null }  // Fallback
        );
        
        // Track cost
        await trackApiCost(userId, widget.endpoint, data.cost);
        
        // Save to DB
        await saveWidgetData(siteId, widget.id, data);
        
        // Update progress via Redis (for SSE polling)
        completed++;
        await redis.setex(`job:${runId}:status`, 3600, JSON.stringify({
          status: "running",
          progress: completed,
          total: widgets.length,
        }));
      });
    }
    
    await step.run("complete", async () => {
      await redis.setex(`job:${runId}:status`, 3600, JSON.stringify({
        status: "completed",
        progress: widgets.length,
        total: widgets.length,
        completedAt: new Date().toISOString(),
      }));
      
      // Invalidate caches
      await invalidateCache(`dashboard:${siteId}:*`);
    });
    
    return { jobId: runId, completed };
  }
);
```

### Dashboard Component with Real-time Updates

```typescript
// src/app/dashboard/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function Dashboard({ siteId }: { siteId: string }) {
  const [refreshJobId, setRefreshJobId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Initial data fetch
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard", siteId],
    queryFn: () => fetchDashboardData(siteId),
    staleTime: 1000 * 60 * 5,
  });
  
  // Real-time job status
  const jobStatus = useJobStatus(refreshJobId);
  
  const handleRefresh = async () => {
    const res = await fetch("/api/dashboard/refresh", {
      method: "POST",
      body: JSON.stringify({ siteId, widgets: dashboardData?.widgets }),
    });
    const { jobId } = await res.json();
    setRefreshJobId(jobId);
  };
  
  // Invalidate cache when job completes
  useEffect(() => {
    if (jobStatus?.status === "completed") {
      queryClient.invalidateQueries({ queryKey: ["dashboard", siteId] });
      setRefreshJobId(null);
    }
  }, [jobStatus?.status]);
  
  return (
    <div>
      <button onClick={handleRefresh} disabled={!!refreshJobId}>
        {refreshJobId ? "Refreshing..." : "Refresh Now"}
      </button>
      
      {jobStatus && (
        <ProgressBar 
          progress={jobStatus.progress} 
          total={jobStatus.total} 
        />
      )}
      
      {dashboardData?.widgets.map(widget => (
        <Widget 
          key={widget.id} 
          data={widget.data} 
          freshness={widget.freshness}
          lastUpdated={widget.lastUpdated}
        />
      ))}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next.js 15 implicit caching | Next.js 16 `"use cache"` explicit | Nov 2025 | Surgical caching control, no accidental dynamic rendering |
| WebSockets for job updates | SSE + Inngest Realtime | 2024-2025 | Simpler, HTTP-based, auto-reconnect, no socket management |
| BullMQ/Agenda for jobs | Inngest durable functions | 2023-2024 | Zero infrastructure, automatic retries, observability |
| Custom retry logic | Circuit breaker + exponential backoff | Industry std | Resilience patterns proven in microservices |
| Redis (ioredis) | Upstash Redis | 2023+ | Serverless-native, global edge, no connection pools |

**Deprecated/outdated:**
- `next.config.js` `experimental.ppr` - Replaced by `cacheComponents` in Next.js 16
- Manual job polling - Use Inngest Realtime or SSE instead
- Custom queue systems - Use Inngest for serverless durability

## Open Questions

1. **Inngest Realtime vs Custom SSE**
   - What we know: Inngest offers `@inngest/realtime` middleware for streaming
   - What's unclear: Whether it's better than custom SSE for this use case
   - Recommendation: Start with custom SSE (simpler, direct control), evaluate Inngest Realtime for v2

2. **JSONB Query Performance at Scale**
   - What we know: PostgreSQL JSONB supports indexing with GIN
   - What's unclear: Performance with 10k+ users, complex nested queries
   - Recommendation: Add GIN indexes on frequently queried JSONB paths, monitor query performance

3. **DataForSEO Bulk Polling vs Webhooks**
   - What we know: `tasks_ready` has 20/min limit, postback_url is recommended for high volume
   - What's unclear: Webhook reliability, retry handling
   - Recommendation: Implement postback_url with fallback to tasks_ready polling

4. **Next.js 16 Cache Invalidation**
   - What we know: `revalidateTag()` and `cacheTag()` available
   - What's unclear: Best practices for multi-layer invalidation
   - Recommendation: Use cache tags for widget-level invalidation, Redis pattern invalidation for bulk

## Sources

### Primary (HIGH confidence)
- DataForSEO API Docs - Rate limits, tasks_ready endpoint, error codes
  - https://dataforseo.com/help-center/rate-limits-and-request-limits
  - https://docs.dataforseo.com/v3/appendix/errors
- Inngest Documentation - Next.js integration, streaming, middleware
  - https://www.inngest.com/docs/learn/serving-inngest-functions
- Next.js 16 Documentation - "use cache", cacheLife, cacheComponents
  - https://nextjs.org/docs/app/api-reference/directives/use-cache
- TanStack Query v5 Docs - Caching, stale time, query keys
  - https://tanstack.com/query/v5/docs/react/guides/caching

### Secondary (MEDIUM confidence)
- Upstash Redis + Next.js Examples
  - https://upstash.com/docs/redis/tutorials/nextjs_with_redis
- Circuit breaker pattern implementations (TypeScript)
  - https://github.com/nodeshift/opossum (verified npm package)
- Server-Sent Events production guides
  - https://xiouyang.medium.com/building-production-ready-sse-in-next-js

### Tertiary (LOW confidence)
- Community articles on multi-tenant cost tracking (general patterns, not specific libraries)
- SSE auto-reconnect behavior in various browsers

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs, established libraries
- Architecture patterns: HIGH - Verified with official documentation
- Pitfalls: MEDIUM-HIGH - Based on production experience + official docs

**Research date:** 2026-02-24  
**Valid until:** 2026-04-24 (Next.js 16 is stable, but expect minor refinements)

**DataForSEO rate limits (verified from official docs):**
- General: 2000 requests/minute
- Live Google Ads: 12 requests/minute
- User Data endpoint: 6 requests/minute
- API Status: 10 requests/minute
- Errors endpoint: 10 requests/minute
- Tasks Ready: 20 requests/minute
- Simultaneous requests: 30 max (for database endpoints)
- Recommended tasks per POST: up to 100

**Inngest + Vercel timeouts:**
- Default: 10 seconds (Hobby)
- With streaming: 800 seconds (Pro with Fluid Compute)
- With Edge: 30 seconds (configurable)

**Next.js 16 cache profiles:**
- `default`: stale=300, revalidate=900, expire=86400
- `short`: stale=60, revalidate=300, expire=3600
- `long`: stale=1800, revalidate=3600, expire=2592000
- Custom profiles: Fully configurable
