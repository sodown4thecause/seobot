# SEO Dashboard Platform — Project State

**Project:** SEO Dashboard + SEO SaaS Platform  
**Current Phase:** Phase 1 Gap Closure In Progress  
**Last Updated:** 2026-02-24
**Last activity:** 2026-02-24 - Completed 01-08-PLAN.md (refresh resilience + cancellation + invalidation)

---

## Project Reference

### Core Value
**"Always-on SEO intelligence with instant refresh"** — Users get a complete view of their website's SEO health, competitor positioning, and growth opportunities without waiting for reports to generate.

### Target User
SEO professionals, marketing teams, and website owners who need ongoing monitoring of their search performance with the ability to dig deeper via chat when questions arise.

### Success Definition
- User completes chat onboarding → gets directed to dashboards
- User opens any dashboard → sees cached data with "last updated" timestamp
- User clicks "Refresh Now" → background jobs fetch fresh DataForSEO data
- All 8 dashboards provide actionable insights within 3 seconds of page load
- User can change competitors anytime → triggers automatic re-analysis

---

## Current Position

### Phase Status
| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 1 | Foundation & Infrastructure | 🟡 In Progress | 88.9% (8/9 plans) |
| 2 | Core Dashboards | 🔴 Not Started | 0% |
| 3 | Advanced Intelligence | 🔴 Not Started | 0% |
| 4 | AEO Insights | 🔴 Not Started | 0% |
| 5 | Scale & Automation | 🔴 Not Started | 0% |

### Active Plan
**None** — 01-08 execution complete.

### Current Focus
Complete remaining Phase 1 gap-closure plan (01-09), then proceed to Phase 2 Core Dashboards.

### Progress
`█████████░` 88.9% (8/9 plans complete)

---

## Performance Metrics

### Project Health
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Requirements Defined | 128 | 128 | ✅ Complete |
| Phases Planned | 5 | 5 | ✅ Complete |
| Research Complete | 4 phases | 5 phases | ⚠️ Phase 4 pending |
| Coverage | 100% | 100% | ✅ Complete |

### Quality Gates
| Gate | Status | Notes |
|------|--------|-------|
| Research Synthesized | ✅ | STACK, FEATURES, ARCHITECTURE, PITFALLS complete |
| Requirements Documented | ✅ | 128 v1 requirements with IDs |
| Roadmap Created | ✅ | 5 phases with success criteria |
| Success Criteria Observable | ✅ | User-behavior focused, not implementation |
| Traceability | ✅ | All requirements mapped to exactly one phase |

---

## Accumulated Context

### Key Decisions Made

| Decision | Rationale | Commitment |
|----------|-----------|------------|
| 5-phase structure | Follows natural dependencies (infra → core → advanced → AEO → scale) | Locked |
| 8 dashboards in v1 | Complete monitoring suite without GSC complexity | Locked |
| On-demand refresh | Balance freshness vs cost for beta | Locked |
| 2 competitors per site | Sweet spot for meaningful comparison | Locked |
| Beta = 1 site/user | Simplifies data model, test PMF | Locked |
| GSC deferred to v2 | OAuth complexity, focus on core first | Locked |
| SSE auth transport | Use same-origin cookie auth for EventSource | Applied in 01-05 |
| SSE connection cap | Max 1 active stream per user to limit polling load | Applied in 01-05 |
| Refresh trigger pattern | Browser calls `/api/jobs/refresh`; server emits Inngest event | Applied in 01-05 |
| Cache config compatibility | Keep `cacheComponents`/`cacheLife` under `experimental` until route segment runtime exports are migrated | Applied in 01-04 |
| Competitor relationship mapping | Keep `competitors` table and add explicit `user_competitors` mapping artifact | Applied in 01-06 |
| Async DataForSEO lifecycle path | Use canonical POST submit -> tasks_ready polling -> GET-style result retrieval for refresh workloads | Applied in 01-07 |
| Cost attribution enforcement | Require `executeTrackedDataForSeoCall` with `userId` and `jobId` on submit/poll/fetch helper paths | Applied in 01-07 |
| Refresh execution strategy | Run real async DataForSEO calls per data type with explicit exponential backoff and job-scoped circuit wrapper | Applied in 01-08 |
| Cache invalidation timing | Invalidate user dashboard cache at manual enqueue and again at job finalize (complete/cancelled) | Applied in 01-08 |

### Critical Risks Identified

| Risk | Phase | Mitigation |
|------|-------|------------|
| Rate limit storms | 1 | Per-endpoint rate limiters, exponential backoff |
| API cost explosion | 1 | Multi-layer caching (60-80% savings) |
| Stale data UX anti-pattern | 1-2 | "Last updated" timestamp on every widget, color-coded freshness |
| Circuit breaker blindness | 1 | 5-10s timeouts, graceful degradation |
| Missing cost attribution | 1 | Per-tenant tracking middleware |
| AEO domain uncertainty | 4 | Research spike required before implementation |

### Research Gaps

| Gap | Impact | Phase to Address |
|-----|--------|------------------|
| **LLM Citation Data Source** | Blocks AEO Insights | Phase 4 — Research DataForSEO AI Optimization API availability |
| **Health Score Weighting** | Blocks Overview Dashboard | Phase 1 Planning — Define scoring algorithm |
| **Content Decay Thresholds** | Blocks Decay Detection | Phase 3 Planning — Define % drop that triggers recommendations |

### Technical Foundation

**Existing Infrastructure (Pre-Built):**
- Next.js 16 + React 19 + shadcn/ui
- Chat-first onboarding with RAG-based website understanding
- Firecrawl site crawling + AI brand voice analysis
- 70+ DataForSEO MCP tools available
- 12 existing workflows including competitor analysis, AEO audit
- `/api/cron` endpoint exists for background jobs
- Clerk authentication integration
- Drizzle ORM + Neon PostgreSQL

**New Infrastructure Required (Phase 1):**
- Inngest for job orchestration
- TanStack Query v5 for caching
- Upstash Redis for edge caching
- Rate limiting layer for DataForSEO
- Circuit breaker implementation
- Cost tracking middleware

---

## Session Continuity

### This Session
**Action:** Executed `01-08-PLAN.md` (refresh resiliency/cancellation/cache invalidation wiring)  
**Outcome:** Replaced placeholder refresh execution with async DataForSEO flows, added cancellation checkpoints with skipped-work metadata, and wired enqueue/finalize Redis invalidation  
**Next Action:** Execute `01-09-PLAN.md` (final Phase 1 gap closure)

### Last Session
Executed Foundation plans (`01-01` through `01-07`) and established schema, jobs, async DataForSEO lifecycle helpers, cost-tracking middleware, UX/SSE primitives, and competitor mapping migration artifact.

### Upcoming Sessions
1. Execute `01-09-PLAN.md`
2. `/gsd-research-phase 4` — AEO domain research (before Week 12)
3. Define health score weighting for REQ-OVERVIEW-01

---

## Blockers

| Blocker | Status | Resolution |
|---------|--------|------------|
| None | - | - |

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | ai-visibility-audit-prompt (1).md | 2026-02-25 | 1b55728 | [001-ai-visibility-audit-prompt-1-md](./quick/001-ai-visibility-audit-prompt-1-md/) |
| 002 | complete-ai-visibility-audit-prompt-md | 2026-02-25 | b042b53 | [002-complete-ai-visibility-audit-prompt-md](./quick/002-complete-ai-visibility-audit-prompt-md/) |

## Decisions Needed

| Decision | Context | Deadline |
|----------|---------|----------|
| Health score algorithm weights | REQ-OVERVIEW-01 needs scoring formula | Phase 1 planning |
| Content decay threshold % | REQ-CONTENT-05 needs trigger point | Phase 3 planning |
| Phase 4 research approach | AEO API availability uncertain | Before Week 12 |

---

## Session Continuity (Execution)

Last session: 2026-02-24 19:18 UTC  
Stopped at: Completed `01-08-PLAN.md`  
Resume file: None

---

## Notes

### Architecture Patterns Established
- **Multi-layer caching:** Next.js "use cache" → TanStack Query → Redis → Database
- **Data flow:** On-demand refresh → Job Queue → DataForSEO → Database → Cache Invalidation → UI Update
- **Real-time updates:** Server-Sent Events (SSE) for job status (not WebSockets)
- **Cost optimization:** Standard method for scheduled, Live method for user-triggered only

### Phase Boundaries
- Phase 1 must complete BEFORE any dashboard features (strict dependency)
- Phase 2-3 can have some overlap once Phase 1 infra is solid
- Phase 4 REQUIRES research spike — do not start implementation without research
- Phase 5 is optimization/prep — can be partially parallel with Phase 4

### Beta Constraints
- 1 website per user maximum
- 90 days historical data retention
- 2 competitors per site (changeable)
- No GSC integration (v2)
- No team/organization features (v2)
- No automated email reports (v2)

---

*State managed via GSD workflow. Update this file after each planning/execution session.*
