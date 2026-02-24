# Research Summary: SEOBOT Dashboard Platform

**Project:** SEOBOT Dashboard + SEO SaaS Platform  
**Research Date:** February 24, 2026  
**Synthesized By:** Research Synthesis Agent  

---

## Executive Summary

This research synthesizes findings across technology stack, feature landscape, system architecture, and common pitfalls for building an SEO/AEO dashboard platform as a subsequent milestone to the existing SEOBOT chat system.

**Recommended Approach:** Build on the existing foundation (Next.js 16 + React 19 + DataForSEO MCP) by adding enterprise-grade dashboard capabilities using TanStack Query for caching, Inngest for background job orchestration, and shadcn/ui Charts for data visualization. The platform must operate in the emerging "dual-search paradigm" where traditional keyword rankings coexist with AI-driven Answer Engine Optimization (AEO).

**Key Strategic Insight:** The Gartner prediction that traditional search volume will drop 25% by 2026 means leading platforms must now track both SERP visibility AND AI citation share-of-voice. 95% of ChatGPT citations point to content updated in the last 10 months, making freshness monitoring table stakes for 2026.

**Critical Risks:** The primary risks center on DataForSEO API integration—rate limit storms can cause cascading failures, API costs can explode without proper caching (60-80% savings possible with aggressive caching), and stale data UX anti-patterns can erode user trust. These must be addressed in Phase 1 infrastructure, not retrofitted later.

---

## Key Findings

### From STACK.md: Technology Decisions

**Core Technologies (with rationale):**

| Technology | Purpose | Why |
|------------|---------|-----|
| **TanStack Query v5** | Server state & caching | Industry standard, treats server state as first-class citizen, automatic background refetching |
| **Inngest** | Background jobs & workflows | Runs on YOUR infrastructure (Vercel), event-driven, built-in real-time updates, 100K free executions/month |
| **shadcn/ui Charts** | Data visualization | 53 pre-built charts matching design system, Recharts-based, dark mode support |
| **nuqs** | URL state management | Type-safe query params, shareable state, ~6KB |
| **Zustand** | Global UI state | Minimal (1.2KB), no boilerplate, perfect for sidebar/theme |
| **Upstash Redis** | Edge caching | Serverless Redis, 1-2ms response, rate limiting |

**Key Version Requirements:**
- TanStack Query v5 (v4 deprecated) - staleTime: 5-15min for SEO metrics, gcTime: 24 hours
- Inngest v3 - event-driven architecture with Realtime API
- Next.js 16 + React 19 - all recommendations verified compatible

**What NOT to use:** Redux Toolkit (overkill), raw Recharts without shadcn/ui Charts, BullMQ (requires managed Redis), Chart.js (harder to customize than Recharts).

---

### From FEATURES.md: Feature Priorities

**Table Stakes (Must-Have for Beta Launch):**

| Dashboard | P0 Features | Notes |
|-----------|-------------|-------|
| **Overview** | KPI cards, health score, trend lines, period comparisons | Build first - depends on all data sources |
| **Website Audit** | Crawl errors, Core Web Vitals, indexation, structured data | Critical: Sites without monitoring see 12% organic decline per quarter |
| **Rank Tracker** | Daily rank updates, desktop/mobile split, SERP features | Core table stakes - DataForSEO handles heavy lifting |
| **Content Performance** | Top pages by traffic (basic) | GA4 integration required |

**Should-Have (P1 - Important but can defer):**
- Competitor Monitor (2 competitors, 4 data points)
- Keyword Opportunities (gap analysis)
- Backlink Profile (basic referring domains)
- Content Decay Detection (differentiator - 30% traffic loss if unmonitored)

**Differentiators (P2 - Post-Beta):**
- **AEO Insights** - LLM citation tracking (ChatGPT, Perplexity, Claude mentions)
- **Automated Content Decay** - Proactive alerts before traffic drops
- **Conversational Interface** - Natural language queries (leverage existing chat system)
- **Workflow-Triggered Recommendations** - Connect dashboard insights to existing workflow engine

**Anti-Features (Explicitly NOT building in Beta):**
- White-label capabilities (agency feature)
- Multi-client portfolio dashboard (beta is 1 site per user)
- PDF report generation (focus on live dashboards)
- Social/PPC integration (scope creep)

---

### From ARCHITECTURE.md: System Patterns

**Multi-Layer Caching Strategy:**

```
Layer 1: Memory (In-Memory)
├── React Server Component cache
├── Next.js fetch cache
└── TTL: Request-scoped

Layer 2: Redis (Upstash)
├── Drizzle query cache
├── API response cache (SERP: 24h, metrics: 7d, domain: 30d)
└── TTL: 1-24 hours

Layer 3: Database (Neon)
├── Dashboard snapshots
├── Historical aggregations
└── TTL: Days/weeks (configurable)
```

**Data Flow Patterns:**

1. **On-Demand Refresh (User-Initiated):**
   - User clicks "Refresh" → Job Queue → DataForSEO tasks → Database → Cache Invalidation → SSE Broadcast → UI Update

2. **Background Refresh (Scheduled):**
   - Vercel Cron → Job Queue (batched by priority) → DataForSEO Rate Limiter → Database updates

3. **Staleness Check on Login:**
   - User login → Check freshness → If stale: enqueue refresh while showing cached data

**Key Components:**
- **Dashboard Data Service** (`lib/dashboard/`) - Central hub for all dashboard data
- **Cache Manager** (`lib/cache/`) - Multi-layer caching with automatic invalidation
- **Job Queue** (`lib/queue/`) - Async processing with state machine (queued → running → completed/failed)
- **DataForSEO Orchestrator** (`lib/mcp/dataforseo/`) - Cost-optimized API interaction with deduplication
- **Real-Time Status Layer** (`lib/realtime/`) - SSE-based push updates (recommended over WebSockets for dashboards)

**Build Order (Dependencies):**
1. Phase 1: Database Schema → Cache Layer → DataForSEO Rate Limiter
2. Phase 2: Job Queue → DataForSEO Orchestrator → Dashboard Data Service
3. Phase 3: Real-Time Layer → Dashboard Components
4. Phase 4: Cron Jobs → Cost Optimization

---

### From PITFALLS.md: Critical Risks & Prevention

**Top 5 Critical Pitfalls:**

| Pitfall | Risk Level | Prevention |
|---------|------------|------------|
| **Rate Limit Storms** | CRITICAL | Per-endpoint rate limiters, use Standard method (not Live) for scheduled jobs, exponential backoff on 429s |
| **Stale Data UX Anti-Pattern** | CRITICAL | Always show "Last updated" timestamp, color-code freshness (<24h green, 24-48h yellow, >48h red), skeleton loaders |
| **API Cost Explosion** | CRITICAL | Multi-layer caching (60-80% savings), request deduplication, batch processing, cost monitoring per tenant |
| **Circuit Breaker Blindness** | CRITICAL | Implement circuit breaker pattern, 5-10s timeouts, graceful degradation (cached data + warning), collapse non-critical widgets |
| **Missing Cost Attribution** | CRITICAL | Track API spend per user/site, alert at 50%/80%/95% thresholds, implement fair-use limits |

**DataForSEO Rate Limits (Critical):**
- General: 2,000 req/min (account-level)
- Live Google Ads: 12 req/min (VERY RESTRICTIVE)
- Live Google Trends: 250 req/min (shared across ALL users)
- Tasks Ready: 20 req/min (use callbacks instead)
- **Rule:** Prefer Standard method with callbacks over Live endpoints

**Moderate Pitfalls:**
- Widget tight coupling (use data layer pattern)
- Inconsistent refresh patterns (clear UX differentiation)
- Dashboard IA anti-patterns (SEO-specific hierarchy needed)
- Inadequate error handling UX (reusable error state components)

---

## Implications for Roadmap

### Suggested Phase Structure

Based on dependencies and risk mitigation:

#### Phase 1: Foundation & Infrastructure (Weeks 1-3)
**Rationale:** All subsequent phases depend on these systems. Critical pitfalls must be addressed here.

**What it delivers:**
- Database schema (dashboard_snapshots, refresh_jobs, api_usage_logs)
- Multi-layer caching (Upstash Redis, Drizzle cache extension)
- DataForSEO rate limiter with per-endpoint queues
- Cost attribution middleware (per-tenant tracking)
- Circuit breaker implementation
- Job queue system with state machine

**Features from FEATURES.md:** None (infrastructure only)

**Pitfalls to address:**
- Rate Limit Storms (implement rate limiters)
- API Cost Explosion (design caching from start)
- Circuit Breaker Blindness (add to all API calls)
- Missing Cost Attribution (build middleware)

**Research Flag:** SKIP - Architecture is well-documented

---

#### Phase 2: Core Dashboards (Weeks 4-7)
**Rationale:** Build table stakes dashboards that establish the platform's baseline value.

**What it delivers:**
- Overview Dashboard (KPI cards, health score, trends)
- Website Audit (crawl errors, CWV, indexation)
- Rank Tracker (position monitoring, SERP features)
- Basic Content Performance (top pages by traffic)

**Features from FEATURES.md:**
- P0: Overview, Website Audit, Rank Tracker, Content Performance (basic)

**Dependencies:**
- DataForSEO: SERP API, OnPage API
- GA4/GSC connections for traffic data

**Pitfalls to address:**
- Stale Data UX (implement freshness indicators on every widget)
- Widget Tight Coupling (use DashboardDataService pattern)
- Inconsistent Refresh Patterns (clear UX differentiation)

**Research Flag:** SKIP - Standard dashboard patterns, well-documented

---

#### Phase 3: Advanced Features (Weeks 8-11)
**Rationale:** Add competitive and keyword intelligence layers.

**What it delivers:**
- Competitor Monitor (2 competitors, 4 data points)
- Keyword Opportunities (gap analysis, trending)
- Backlink Profile (referring domains, link velocity)
- Content Decay Detection (differentiator - proactive alerts)

**Features from FEATURES.md:**
- P1: Competitor Monitor, Keyword Opportunities, Backlink Profile
- P1 differentiator: Content Decay Detection

**Dependencies:**
- DataForSEO: Domain Analytics API, Keywords Data API, Backlinks API
- Historical data storage for decay detection

**Pitfalls to address:**
- Dashboard IA Anti-Patterns (implement SEO-specific hierarchy)
- Inadequate Error Handling UX (reusable error components)

**Research Flag:** SKIP - DataForSEO APIs well-documented

---

#### Phase 4: AEO & Differentiators (Weeks 12-15)
**Rationale:** High-complexity, emerging domain. Defer until core platform is solid.

**What it delivers:**
- AEO Insights dashboard (Featured Snippets, People Also Ask)
- LLM Citation Monitoring (ChatGPT, Perplexity, Claude)
- Content Freshness Alerts
- Conversational Dashboard Interface

**Features from FEATURES.md:**
- P2: AEO Insights (high complexity, new domain)
- Differentiator: Conversational Interface

**Dependencies:**
- DataForSEO AI Optimization API (if available) or manual LLM query approach
- Integration with existing workflow engine

**Open Questions:**
- How to programmatically query LLMs for citation data at scale?
- Can DataForSEO AI Optimization API replace manual LLM queries?

**Pitfalls to address:**
- New domain = higher uncertainty risk

**Research Flag:** **NEEDS /gsd-research-phase** - AEO/GEO is emerging, limited API availability

---

#### Phase 5: Scale & Automation (Weeks 16-18)
**Rationale:** Prepare for post-beta scaling and multi-site support.

**What it delivers:**
- Cron-based scheduled refreshes
- Cost optimization analytics
- Multi-site data model preparation
- Performance optimizations

**Features from FEATURES.md:**
- Predictive Traffic Forecasting (ML-based)

**Pitfalls to address:**
- Cost Explosion at Scale (load test with 10x volume)
- Multi-site support (ensure data model supports many sites per user)

**Research Flag:** SKIP - Scale preparation, standard patterns

---

### Phase Summary Table

| Phase | Focus | Weeks | Research Needed | Key Pitfall |
|-------|-------|-------|-----------------|-------------|
| 1 | Infrastructure | 1-3 | No | Rate limits, cost tracking |
| 2 | Core Dashboards | 4-7 | No | Stale data UX |
| 3 | Advanced Features | 8-11 | No | Dashboard IA |
| 4 | AEO/Differentiators | 12-15 | **YES** | New domain uncertainty |
| 5 | Scale/Automation | 16-18 | No | Multi-site prep |

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| **Stack Recommendations** | HIGH | Battle-tested 2025 industry standards, official documentation verified, multiple sources confirm |
| **Table Stakes Features** | HIGH | Well-established patterns across SEMrush, Ahrefs, SE Ranking; DataForSEO APIs well-understood |
| **Technical SEO Requirements** | HIGH | Standard checklist widely documented |
| **Architecture Patterns** | HIGH | Next.js 16 caching official docs, DataForSEO async model mature, Vercel Cron production-ready |
| **AEO/GEO Features** | MEDIUM | Emerging domain, limited API availability; research from Discovered Labs/SearchGen provides framework |
| **Pitfall Prevention** | HIGH | DataForSEO official docs clear on rate limits and best practices |
| **Cost Optimization** | MEDIUM-HIGH | DataForSEO best practices documented, community patterns established |

**Overall Research Confidence:** HIGH for core platform, MEDIUM for AEO differentiators

---

## Gaps to Address

| Gap | Impact | Phase to Address | Action |
|-----|--------|------------------|--------|
| **LLM Citation Data Source** | Blocks AEO Insights | Phase 4 | Research DataForSEO AI Optimization API availability; fallback: manual query approach |
| **Health Score Weighting** | Blocks Overview Dashboard | Phase 1 (Requirements) | Define scoring algorithm for technical SEO health |
| **Content Decay Thresholds** | Blocks Decay Detection | Phase 3 | Define what % drop triggers recommendations (20%? 30%?) |
| **Competitor Data Points** | Blocks Competitor Monitor | Phase 2 (Requirements) | Select which 4 data points maximize value for 2-competitor limit |
| **Webhook vs Polling Trade-offs** | Architecture decision | Phase 1 | Assess volume projections for high-volume users (>1000 tasks/min) |
| **Cache Storage Costs** | Cost planning | Phase 1 | Upstash Redis pricing vs database storage for cached data |
| **Multi-tenant Cache Isolation** | Security | Phase 1 | Should cache keys include user ID or project ID? |

---

## Aggregated Sources

### High Confidence (Official Docs / Context7)
- TanStack Query v5 Documentation (HIGH)
- Inngest Documentation (HIGH)
- shadcn/ui Charts Documentation (HIGH)
- nuqs Documentation (HIGH)
- Zustand Documentation (HIGH)
- Next.js 16 Caching Documentation (HIGH)
- DataForSEO API v3 Documentation (HIGH)
- Vercel Cron Jobs Documentation (HIGH)
- DataForSEO Rate Limits & Best Practices (HIGH)

### Medium Confidence (Community / 2025-2026 Articles)
- "TanStack Query vs SWR 2025" - Refine.dev (MEDIUM)
- "Inngest vs Trigger.dev" - NextBuild (MEDIUM)
- "shadcn Dashboard Tutorial 2026" - DesignRevision (MEDIUM)
- "React State Management 2025" - DeveloperWay (MEDIUM)
- "Single Grain Best SEO Reporting Tools 2026" (MEDIUM)
- "SEOTesting Content Decay Tools 2025" (MEDIUM)

### Emerging Domain (AEO/GEO)
- Discovered Labs "AEO Tools and Platforms" (MEDIUM)
- SearchGen "AEO Optimization Playbook" (MEDIUM)
- FastAEOCheck "AEO & GEO Scoring Methodology" (MEDIUM)
- Gartner search volume prediction 2026 (MEDIUM)

---

## Research Flags Summary

**Phases requiring `/gsd-research-phase`:**
- **Phase 4: AEO & Differentiators** - High complexity, emerging domain, limited APIs available
  - Specific research needed: DataForSEO AI Optimization API capabilities
  - Specific research needed: Manual LLM query approaches for citation tracking
  - Specific research needed: Content freshness algorithms

**Phases with standard patterns (skip research):**
- Phase 1: Infrastructure - Well-documented caching/job patterns
- Phase 2: Core Dashboards - Standard SEO dashboard patterns
- Phase 3: Advanced Features - DataForSEO APIs mature
- Phase 5: Scale/Automation - Standard scale preparation

---

## Ready for Requirements

This research provides a solid foundation for requirements definition. Key decisions have been made:

1. **Stack is settled:** TanStack Query + Inngest + shadcn/ui Charts + nuqs + Zustand
2. **Phase structure is clear:** Infrastructure → Core → Advanced → AEO → Scale
3. **Pitfalls are identified:** Rate limits, cost tracking, stale UX must be Phase 1
4. **Research gaps are flagged:** Phase 4 AEO work needs deeper investigation

**Next Steps:**
1. Define Phase 1 requirements (infrastructure)
2. Create Phase 2-3 requirements (core dashboards)
3. Plan Phase 4 research spike (AEO domain)
4. Execute Phase 1-3 in parallel where dependencies allow

---

*Research synthesis complete. All four research files synthesized into actionable roadmap guidance.*
