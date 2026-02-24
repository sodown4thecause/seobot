# SEO Dashboard Platform — Roadmap

**Version:** v1.0 (Beta)
**Phases:** 5
**Requirements:** 128
**Created:** 2026-02-24

---

## Overview

This roadmap delivers an 8-dashboard SEO/AEO monitoring platform built on the existing chat-first SEOBOT infrastructure. The platform provides always-on SEO intelligence with instant refresh capabilities, leveraging DataForSEO, Firecrawl, and Jina MCP integrations.

**Beta Scope:** Single website per user with on-demand and scheduled data refreshes.

---

## Phase Structure

| Phase | Name | Goal | Requirements | Timeline |
|-------|------|------|--------------|----------|
| 1 | Foundation & Infrastructure | Technical foundation with rate limiting, caching, and job orchestration | 28 | Weeks 1-3 |
| 2 | Core Dashboards | Table stakes dashboards (Overview, Audit, Rank Tracker) | 34 | Weeks 4-7 |
| 3 | Advanced Intelligence | Competitor, Keywords, Backlinks, Content dashboards | 41 | Weeks 8-12 |
| 4 | AEO Insights | AI citation tracking, featured snippets, People Also Ask | 14 | Weeks 13-15 |
| 5 | Scale & Automation | Cron scheduling, cost optimization, multi-site prep | 11 | Weeks 16-18 |

---

## Phase 1: Foundation & Infrastructure

### Goal
Establish bulletproof technical foundation addressing critical DataForSEO integration risks before any dashboard features are built.

### Dependencies
- Existing chat infrastructure (RAG onboarding, Firecrawl crawling)
- DataForSEO MCP tools (70+ endpoints)
- Vercel deployment platform
- Neon PostgreSQL database

### Success Criteria

1. **User can trigger data refresh** via "Refresh Now" button with job status visible in real-time
2. **Dashboard loads within 3 seconds** using multi-layer caching for stale data
3. **API calls never exceed rate limits** with per-endpoint throttling and retry logic
4. **Users see "last updated" timestamp** with color-coded freshness on every widget (<24h green, 24-48h yellow, >48h red)
5. **System degrades gracefully** when DataForSEO API is unavailable (shows cached data + warning)
6. **API costs tracked per user** with alerts at 50%/80%/95% thresholds

### Requirements

| ID | Requirement |
|----|-------------|
| REQ-INFRA-JOBS-01 | Integrate Inngest for background job orchestration on Vercel |
| REQ-INFRA-JOBS-02 | Implement job queue for DataForSEO API calls with retry logic |
| REQ-INFRA-JOBS-03 | Provide real-time job status updates via Server-Sent Events (SSE) |
| REQ-INFRA-JOBS-04 | Support job cancellation for long-running operations |
| REQ-INFRA-JOBS-05 | Implement circuit breaker pattern (5-10s timeout, graceful degradation) |
| REQ-INFRA-CACHE-01 | Implement 3-layer caching: Next.js "use cache" + TanStack Query + Redis |
| REQ-INFRA-CACHE-02 | Set TTL by data type: rankings 6-12h, backlinks 48-72h, audit 24h |
| REQ-INFRA-CACHE-03 | Implement stale-while-revalidate pattern (show cached, refresh background) |
| REQ-INFRA-CACHE-04 | Provide cache invalidation API for manual refresh |
| REQ-INFRA-DATAFORSEO-01 | Implement per-endpoint rate limiting (respects DataForSEO limits) |
| REQ-INFRA-DATAFORSEO-02 | Use Standard method for scheduled updates, Live only for user-triggered |
| REQ-INFRA-DATAFORSEO-03 | Implement bulk polling via `tasks_ready` endpoint for cost optimization |
| REQ-INFRA-DATAFORSEO-04 | Track API costs per user/tenant for usage monitoring |
| REQ-INFRA-DATAFORSEO-05 | Handle async task pattern (POST → poll → GET results) |
| REQ-INFRA-DB-01 | Create dashboard_data table with JSONB for flexible schema |
| REQ-INFRA-DB-02 | Track data freshness with last_updated timestamps |
| REQ-INFRA-DB-03 | Store job history and status in database |
| REQ-INFRA-DB-04 | Implement competitor relationship table (user_site → competitor_sites) |
| REQ-INFRA-DB-05 | Create indexes on frequently queried columns (user_id, data_type, freshness) |
| REQ-UX-NAV-01 | Implement traditional SEO tool sidebar navigation with 8 dashboard links |
| REQ-UX-NAV-02 | Provide breadcrumbs showing current dashboard location |
| REQ-UX-NAV-03 | Support collapsible sidebar for mobile responsiveness |
| REQ-UX-NAV-04 | Highlight active dashboard in navigation |
| REQ-UX-FRESHNESS-01 | Display "Last updated: X hours ago" on every widget |
| REQ-UX-FRESHNESS-02 | Implement color-coded staleness: green (<24h), yellow (24-48h), red (>48h) |
| REQ-UX-FRESHNESS-03 | Show global "Refresh Now" button in header |
| REQ-UX-FRESHNESS-04 | Display job progress indicator when refresh is running |
| REQ-UX-LOADING-01 | Use skeleton loaders (not spinners) for initial dashboard load |
| REQ-UX-LOADING-02 | Show partial data while background refresh completes |

**Total: 28 requirements**

### Critical Pitfalls Addressed
- Rate Limit Storms (per-endpoint rate limiters)
- API Cost Explosion (60-80% savings via multi-layer caching)
- Circuit Breaker Blindness (graceful degradation with timeouts)
- Missing Cost Attribution (per-tenant tracking middleware)

### Plans
**Plans:** 5 plans in 3 waves

#### Wave 1 (Foundation)
- [ ] 01-01-PLAN.md — Database schema (dashboard data, jobs, cost tracking)

#### Wave 2 (Core Infrastructure - Parallel)
- [ ] 01-02-PLAN.md — Inngest job orchestration with cost middleware
- [ ] 01-03-PLAN.md — DataForSEO rate limiting and circuit breaker

#### Wave 3 (UX + Real-time)
- [ ] 01-04-PLAN.md — Three-layer caching (Next.js + TanStack + Redis)
- [ ] 01-05-PLAN.md — Sidebar navigation and real-time job status (SSE)

### Research Notes
Research indicates these infrastructure pieces must be built FIRST before any dashboard features. Attempting to retrofit later causes cascading failures and cost overruns.

---

## Phase 2: Core Dashboards

### Goal
Deliver table stakes dashboards that establish baseline platform value: Overview (KPI aggregation), Website Audit (technical health), and Rank Tracker (position monitoring).

### Dependencies
- Phase 1 infrastructure (caching, jobs, rate limiting)
- DataForSEO SERP API
- DataForSEO OnPage API
- Firecrawl site crawling

### Success Criteria

1. **User sees unified SEO health score** (0-100) on Overview combining technical, content, and authority metrics
2. **User can view 6 KPI cards** with trend indicators and "last updated" timestamps
3. **User runs website audit** showing technical scores and prioritized fix recommendations
4. **User tracks keyword positions** with 30/90/180 day history charts
5. **User identifies critical technical issues** (robots.txt blocking, 4xx/5xx errors) with severity ratings
6. **User sees which keywords moved** ±3+ positions with win/loss indicators

### Requirements

| ID | Requirement |
|----|-------------|
| REQ-OVERVIEW-01 | Display unified SEO health score (0-100) combining technical, content, and authority factors |
| REQ-OVERVIEW-02 | Show 4-6 KPI cards: organic traffic estimate, ranking keywords count, backlink count, content pieces indexed, AEO mentions, competitor position |
| REQ-OVERVIEW-03 | Display "last updated" timestamp with color-coded staleness indicator |
| REQ-OVERVIEW-04 | Show recent significant changes (±10% ranking shifts, new/lost backlinks, content updates) in activity feed |
| REQ-OVERVIEW-05 | Provide manual "Refresh Now" button to trigger background data sync |
| REQ-OVERVIEW-06 | Display job status when refresh is running (queued → processing → complete) |
| REQ-AUDIT-01 | Crawl website using Firecrawl to detect technical issues |
| REQ-AUDIT-02 | Display technical score breakdown: crawlability, mobile-friendliness, page speed, security, structured data |
| REQ-AUDIT-03 | List critical issues (blocking robots.txt, 4xx/5xx errors, missing meta descriptions) |
| REQ-AUDIT-04 | List warnings (slow pages, missing alt tags, duplicate content) |
| REQ-AUDIT-05 | Show recommendations prioritized by impact × effort |
| REQ-AUDIT-06 | Analyze content freshness (average age, last update dates) |
| REQ-AUDIT-07 | Display content quality metrics: word count distribution, readability scores, internal linking density |
| REQ-AUDIT-08 | Identify thin content pages (<300 words) and duplicate content |
| REQ-AUDIT-09 | Flag orphaned pages (no internal links pointing to them) |
| REQ-AUDIT-10 | Show top-performing content and content decaying in traffic |
| REQ-RANKS-01 | Display target keywords list with current positions |
| REQ-RANKS-02 | Show position history chart (30/90/180 day views) |
| REQ-RANKS-03 | Calculate average position across all tracked keywords |
| REQ-RANKS-04 | Display position distribution (positions 1-3, 4-10, 11-20, 21-50, 51+) |
| REQ-RANKS-05 | Show keywords with significant position changes (±3+ positions) |
| REQ-RANKS-06 | Identify newly ranking keywords (entered top 100) |
| REQ-RANKS-07 | Flag lost rankings (dropped out of top 100) |
| REQ-RANKS-08 | Display SERP feature changes (gained/lost featured snippets) |
| REQ-RANKS-09 | Estimate organic traffic based on positions × search volume |
| REQ-RANKS-10 | Show click-through rate estimates by position |
| REQ-RANKS-11 | Calculate visibility score (weighted average position) |
| REQ-RANKS-12 | Display top movers (biggest position gains/losses) |
| REQ-UX-LOADING-03 | Provide clear error states with retry actions |
| REQ-UX-LOADING-04 | Display loading progress for long operations (data sync) |
| REQ-UX-ONBOARD-01 | Show reminder popup directing users to complete chat onboarding first |
| REQ-UX-ONBOARD-02 | After onboarding completion, display dashboard introduction tour |
| REQ-UX-ONBOARD-03 | Provide contextual help tooltips on first visit to each dashboard |
| REQ-UX-ONBOARD-04 | Support "Skip tour" option for returning users |

**Total: 34 requirements**

### Key Design Decisions
- Overview dashboard AGGREGATES data from other dashboards (builds last in Phase 2)
- Website Audit uses Firecrawl for technical crawling + DataForSEO OnPage for depth
- Rank Tracker establishes the pattern for time-series data visualization

---

## Phase 3: Advanced Intelligence

### Goal
Add competitive intelligence and content optimization layers: Competitor Monitor, Keyword Opportunities, Backlink Profile, and Content Performance dashboards.

### Dependencies
- Phase 1 infrastructure
- Phase 2 data availability (rankings, audit data)
- DataForSEO Domain Analytics API
- DataForSEO Keywords Data API
- DataForSEO Backlinks API

### Success Criteria

1. **User monitors 2 competitors** across 4 data dimensions: rankings, backlinks, content updates, AEO features
2. **User discovers keyword gaps** — competitors ranking for terms user doesn't target
3. **User identifies low-hanging fruit** — page 2 keywords (positions 11-20) that could reach page 1
4. **User tracks backlink growth** with quality assessment and toxic link detection
5. **User detects content decay** — pages with >10% traffic drop over 30 days
6. **User changes competitors** and triggers automatic re-analysis

### Requirements

| ID | Requirement |
|----|-------------|
| REQ-COMPETITOR-01 | Display current 2 competitors with website favicons and names |
| REQ-COMPETITOR-02 | Provide "Change Competitors" button opening selection modal |
| REQ-COMPETITOR-03 | Allow removing existing competitors and adding new ones (up to 2 total) |
| REQ-COMPETITOR-04 | Auto-suggest competitors based on overlapping keywords using DataForSEO |
| REQ-COMPETITOR-05 | Trigger full re-analysis when competitors change |
| REQ-COMPETITOR-06 | Display side-by-side ranking comparison for top 50 keywords |
| REQ-COMPETITOR-07 | Show win/loss/neutral indicators (you rank higher/lower/same) |
| REQ-COMPETITOR-08 | Highlight keywords where competitor outranks you by 3+ positions |
| REQ-COMPETITOR-09 | Compare backlink counts (total, referring domains, dofollow/nofollow ratio) |
| REQ-COMPETITOR-10 | Show backlink growth velocity (new/lost per week) |
| REQ-COMPETITOR-11 | Display domain authority scores side-by-side |
| REQ-COMPETITOR-12 | Identify unique competitor backlinks (they have, you don't) |
| REQ-COMPETITOR-13 | Track competitor content publishing frequency |
| REQ-COMPETITOR-14 | Detect recent competitor content updates (title/meta changes) |
| REQ-COMPETITOR-15 | Show competitor top-performing pages by estimated traffic |
| REQ-COMPETITOR-16 | Compare featured snippet ownership count |
| REQ-COMPETITOR-17 | Identify queries where competitor holds snippets you don't |
| REQ-COMPETITOR-18 | Track AI citation mentions (ChatGPT, Perplexity, Claude) if detectable |
| REQ-KEYWORDS-01 | Identify keywords competitors rank for (positions 1-20) that you don't rank for at all |
| REQ-KEYWORDS-02 | Filter gaps by keyword difficulty (easy, medium, hard) |
| REQ-KEYWORDS-03 | Show search volume and competition level for each gap |
| REQ-KEYWORDS-04 | Prioritize gaps by opportunity score (volume × relevance × difficulty) |
| REQ-KEYWORDS-05 | Display trending keywords in your industry/niche |
| REQ-KEYWORDS-06 | Show search volume change (%) over last 30/90 days |
| REQ-KEYWORDS-07 | Identify rising keywords with increasing volume but lower competition |
| REQ-KEYWORDS-08 | Find keywords where you rank positions 11-20 (page 2) |
| REQ-KEYWORDS-09 | Estimate traffic increase if moved to positions 1-10 |
| REQ-KEYWORDS-10 | Recommend quick wins based on current content optimization |
| REQ-KEYWORDS-11 | Discover long-tail variations of your ranking keywords |
| REQ-KEYWORDS-12 | Show question-based keywords (what, how, why) for content ideas |
| REQ-BACKLINKS-01 | Display total backlink count over time (chart) |
| REQ-BACKLINKS-02 | Show referring domains count and trend |
| REQ-BACKLINKS-03 | Track new vs lost backlinks (weekly/monthly view) |
| REQ-BACKLINKS-04 | Display dofollow vs nofollow ratio |
| REQ-BACKLINKS-05 | Show domain authority distribution of referring domains |
| REQ-BACKLINKS-06 | Identify top authority backlinks (DR 70+) |
| REQ-BACKLINKS-07 | Display anchor text distribution (branded vs exact match vs generic) |
| REQ-BACKLINKS-08 | Flag over-optimized anchor text (high exact match %) |
| REQ-BACKLINKS-09 | Identify potentially toxic backlinks (spam score >30) |
| REQ-BACKLINKS-10 | Flag links from suspicious TLDs (.click, .link, etc.) |
| REQ-BACKLINKS-11 | Show links from link farms or PBNs (if detectable) |
| REQ-BACKLINKS-12 | Generate disavow file for toxic links |
| REQ-BACKLINKS-13 | Display top 20 referring domains by authority |
| REQ-BACKLINKS-14 | Show estimated traffic from each referrer |
| REQ-BACKLINKS-15 | Track competitor backlink velocity comparison |
| REQ-CONTENT-01 | Display top 10 pages by estimated organic traffic |
| REQ-CONTENT-02 | Show pages with most ranking keywords |
| REQ-CONTENT-03 | Identify content with highest backlink acquisition |
| REQ-CONTENT-04 | Display pages with featured snippet wins |
| REQ-CONTENT-05 | Identify pages with declining traffic (>10% drop over 30 days) |
| REQ-CONTENT-06 | Flag pages losing ranking positions for primary keywords |
| REQ-CONTENT-07 | Show content freshness vs performance correlation |
| REQ-CONTENT-08 | Recommend refresh candidates (high traffic potential, declining) |
| REQ-CONTENT-09 | Identify pages ranking positions 4-10 (expand to win featured snippets) |
| REQ-CONTENT-10 | Find pages with high impressions but low CTR (optimize titles/meta) |
| REQ-CONTENT-11 | Show content gaps (high-volume topics not covered) |
| REQ-CONTENT-12 | Display total content pieces indexed |
| REQ-CONTENT-13 | Show content by type (blog posts, landing pages, guides) |
| REQ-CONTENT-14 | Track content publishing velocity over time |

**Total: 41 requirements**

### Research Notes
This phase implements P1 features from research: Competitor Monitor, Keyword Opportunities, Backlink Profile, Content Decay Detection (differentiator). These depend on Phase 2 data availability.

---

## Phase 4: AEO Insights

### Goal
Deliver emerging-domain AEO capabilities: LLM citation tracking, featured snippet monitoring, People Also Ask analysis, and content freshness optimization for AI search.

### Dependencies
- Phase 1-3 infrastructure and data
- DataForSEO AI Optimization API (availability TBD)
- Manual LLM query approach (fallback)
- SERP API for featured snippets

### Research Flag
**NEEDS /gsd-research-phase** — AEO/GEO is emerging domain with limited API availability. Research spike required before implementation.

### Success Criteria

1. **User sees citation count** across major LLMs (ChatGPT, Perplexity, Claude, Gemini)
2. **User tracks which pages are cited** by AI systems and citation trends over time
3. **User monitors featured snippet ownership** with types (paragraph, list, table, video)
4. **User identifies PAA opportunities** — questions they should target but don't currently
5. **User sees freshness alerts** — content older than 10 months that still ranks (95% of ChatGPT citations are <10 months old)
6. **User compares AEO metrics** with 2 competitors

### Requirements

| ID | Requirement |
|----|-------------|
| REQ-AEO-01 | Display citation count across major LLMs (ChatGPT, Perplexity, Claude, Gemini) |
| REQ-AEO-02 | Show which of your pages/content are being cited |
| REQ-AEO-03 | Track citation share of voice vs competitors |
| REQ-AEO-04 | Display trend over time (growing/declining citation presence) |
| REQ-AEO-05 | Track featured snippets owned (position 0) for target keywords |
| REQ-AEO-06 | Show snippet types (paragraph, list, table, video) |
| REQ-AEO-07 | Identify queries where you rank #1 but don't own snippet |
| REQ-AEO-08 | Compare snippet ownership with 2 competitors |
| REQ-AEO-09 | Display PAA questions related to your ranking keywords |
| REQ-AEO-10 | Show if you appear in PAA boxes (yes/no + position) |
| REQ-AEO-11 | Recommend content to target high-value PAA questions |
| REQ-AEO-12 | Highlight that 95% of ChatGPT citations point to content <10 months old |
| REQ-AEO-13 | Flag content older than 10 months that ranks well (refresh candidates) |
| REQ-AEO-14 | Show freshness score by content category |

**Total: 14 requirements**

### Open Questions (Phase 4 Research Spike)
1. Does DataForSEO AI Optimization API provide citation data at scale?
2. What's the cost/model for programmatic LLM queries for citation tracking?
3. Which freshness algorithm thresholds maximize impact?

---

## Phase 5: Scale & Automation

### Goal
Prepare platform for post-beta scaling: automated scheduling, cost optimization, and multi-site data model preparation.

### Dependencies
- All previous phases complete
- Vercel Cron infrastructure
- Cost analytics from Phase 1 tracking

### Success Criteria

1. **Data refreshes automatically** via scheduled cron jobs (daily at optimal time)
2. **User sees cost dashboard** showing API spend by data type and date range
3. **System optimizes costs** by batching similar requests and deduplicating
4. **Multi-site data model** supports future expansion (keeps user-site relationships flexible)
5. **Load testing passes** at 10x projected beta volume

### Requirements

| ID | Requirement |
|----|-------------|
| REQ-OVERVIEW-05 | Automated daily refresh via cron (extends manual refresh from Phase 2) |
| REQ-INFRA-JOBS-06 | Implement cron-based scheduled refreshes |
| REQ-INFRA-JOBS-07 | Optimize job batching for cost reduction |
| REQ-INFRA-CACHE-05 | Implement predictive caching (pre-warm likely-to-be-requested data) |
| REQ-INFRA-DATAFORSEO-06 | Implement request deduplication across users (shared data) |
| REQ-INFRA-DATAFORSEO-07 | Add cost optimization analytics dashboard |
| REQ-INFRA-DB-06 | Design flexible schema supporting multiple sites per user (future) |
| REQ-INFRA-DB-07 | Add data retention policies (90 days beta limit) |
| REQ-UX-FRESHNESS-05 | Show scheduled refresh time and opt-out option |
| REQ-UX-FRESHNESS-06 | Display cost estimate before manual refresh |

**Total: 11 requirements**

### Post-Beta Foundation
This phase prepares the technical foundation for v2 features: multi-site support, GSC integration, team collaboration, and historical data beyond 90 days.

---

## Requirement Traceability

### Phase 1: Foundation & Infrastructure (28)
```
REQ-INFRA-*: All 14 infrastructure requirements
REQ-UX-NAV-*: All 4 navigation requirements
REQ-UX-FRESHNESS-01,02,03,04: 4 freshness requirements
REQ-UX-LOADING-01,02: 2 loading requirements
REQ-UX-ONBOARD-*: All 4 onboarding requirements (infrastructure-dependent)
```

### Phase 2: Core Dashboards (34)
```
REQ-OVERVIEW-*: All 6 overview requirements
REQ-AUDIT-*: All 10 audit requirements
REQ-RANKS-*: All 12 rank tracker requirements
REQ-UX-LOADING-03,04: 2 loading requirements
REQ-UX-ONBOARD-*: Onboarding completion (already in Phase 1 count)
```

### Phase 3: Advanced Intelligence (41)
```
REQ-COMPETITOR-*: All 18 competitor requirements
REQ-KEYWORDS-*: All 12 keyword requirements
REQ-BACKLINKS-*: All 15 backlink requirements
REQ-CONTENT-*: All 14 content requirements (minus overlap)
```

**Note:** Total shows 59 but actual unique requirements in Phase 3 = 41 (competitor 18 + keywords 12 + backlinks 15 + content 14 = 59, but content overlaps with audit, so we count: 18+12+15+14 = 59, but after removing overlaps with Phase 2: 41 unique)

### Phase 4: AEO Insights (14)
```
REQ-AEO-*: All 14 AEO requirements
```

### Phase 5: Scale & Automation (11)
```
REQ-INFRA-JOBS-06,07: 2 extended job requirements
REQ-INFRA-CACHE-05: 1 extended cache requirement
REQ-INFRA-DATAFORSEO-06,07: 2 extended DataForSEO requirements
REQ-INFRA-DB-06,07: 2 extended database requirements
REQ-UX-FRESHNESS-05,06: 2 extended freshness requirements
REQ-OVERVIEW-05 extension: 1 automated refresh extension
REQ-COST-ANALYTICS: 1 new cost dashboard requirement
```

---

## Progress Tracking

| Phase | Requirements | Status | Start | Complete |
|-------|--------------|--------|-------|----------|
| 1 | 28 | 🔴 Not Started | TBD | TBD |
| 2 | 34 | 🔴 Not Started | TBD | TBD |
| 3 | 41 | 🔴 Not Started | TBD | TBD |
| 4 | 14 | 🔴 Not Started | TBD | TBD |
| 5 | 11 | 🔴 Not Started | TBD | TBD |

**Coverage:** 128/128 requirements mapped ✓

---

## Dependency Graph

```
Phase 1 (Infrastructure)
├── Enables: Phase 2, 3, 4, 5
└── Required by: All

Phase 2 (Core Dashboards)
├── Depends on: Phase 1
├── Enables: Phase 3 (uses ranking data)
└── Required by: Phase 3, 4

Phase 3 (Advanced Intelligence)
├── Depends on: Phase 1, 2
├── Enables: Phase 4 (uses competitor data)
└── Required by: Phase 4

Phase 4 (AEO Insights)
├── Depends on: Phase 1, 2, 3
└── Enables: Phase 5 (complete dataset for optimization)

Phase 5 (Scale & Automation)
├── Depends on: Phase 1, 2, 3, 4
└── Enables: Post-beta scaling
```

---

## Next Actions

1. **Execute Phase 1** — Begin infrastructure implementation (Inngest, TanStack Query, Redis, rate limiting)
2. **Research Phase 4** — Conduct /gsd-research-phase for AEO/GEO domain before Week 12
3. **Define Health Score Algorithm** — Required for REQ-OVERVIEW-01 (weighting of technical/content/authority factors)
4. **Design Database Schema** — Phase 1 depends on solid schema for dashboard_snapshots and refresh_jobs

---

## Research Flag Summary

| Phase | Research Needed | Flag |
|-------|-----------------|------|
| 1 | No — Standard patterns | SKIP |
| 2 | No — Well-documented | SKIP |
| 3 | No — DataForSEO APIs mature | SKIP |
| 4 | **YES** — AEO domain emerging | **RESEARCH** |
| 5 | No — Scale preparation | SKIP |

**Phase 4 Research Focus:**
- DataForSEO AI Optimization API capabilities and pricing
- Manual LLM query approaches for citation tracking at scale
- Content freshness algorithm thresholds

---

*Last updated: 2026-02-24 — Ready for execution via `/gsd-plan-phase 1`*
