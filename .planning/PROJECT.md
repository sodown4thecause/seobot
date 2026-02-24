# SEO Dashboard Platform - PROJECT.md

**Created:** 2026-02-24
**Status:** Initialized → Ready for Roadmap

---

## What This Is

A modern SEO/AEO dashboard SaaS product with 8 comprehensive monitoring dashboards. Built on top of an existing chat-first SEO platform, these dashboards provide ongoing website intelligence with daily data refreshes using DataForSEO, Firecrawl, and Jina MCP integrations.

**Beta Scope:** Single-site monitoring per user with on-demand refresh capabilities.

---

## Why This Exists

The chat interface is excellent for onboarding and ad-hoc questions, but users need persistent dashboards to monitor their SEO/AEO performance over time. This bridges the gap between conversation-based SEO help and traditional dashboard monitoring, with modern UX powered by shadcn/ui components.

---

## Success Looks Like

- User completes chat onboarding → gets directed to dashboards
- User opens any dashboard → sees cached data with "last updated" timestamp
- User clicks "Refresh Now" → background jobs fetch fresh DataForSEO data
- All 8 dashboards provide actionable insights within 3 seconds of page load
- User can change competitors anytime → triggers automatic re-analysis

---

## Core Value

**"Always-on SEO intelligence with instant refresh"** — Users get a complete view of their website's SEO health, competitor positioning, and growth opportunities without waiting for reports to generate.

---

## Target User

SEO professionals, marketing teams, and website owners who need ongoing monitoring of their search performance with the ability to dig deeper via chat when questions arise.

---

## Constraints

### Technical
- Must integrate with existing chat onboarding (RAG-based website capture)
- Must use existing MCP tools (DataForSEO 70+ endpoints, Firecrawl, Jina)
- Must work with existing workflow infrastructure
- Must support background job execution via `/api/cron`

### Business
- Beta: 1 website per user maximum
- Must build on existing Next.js 16 + React 19 + shadcn/ui foundation
- Must reuse existing database (Drizzle ORM + Neon PostgreSQL)

### User Experience
- Dashboards must load cached data instantly (<3s)
- Manual "Refresh Now" button for fresh data
- Competitor changes trigger full re-analysis
- Clear UX path: Chat Onboarding → Dashboards

---

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 8 dashboards in v1 | Complete monitoring suite without GSC | 8 distinct monitoring views |
| On-demand refresh | Balance freshness vs cost | Manual "Refresh Now" button |
| 2 competitors per site | Sweet spot for meaningful comparison | Competitor Monitor dashboard |
| GSC deferred to v2 | OAuth complexity, focus on core first | Roadmap item for Phase 6+ |
| Beta = 1 site/user | Simplifies data model, test product-market fit | Clear upgrade path later |

---

## Requirements

### Validated

(None yet — existing chat interface and MCP tools are pre-built infrastructure)

### Active

**Dashboards (8 total):**

1. **Overview Dashboard** — KPI cards, health scores, recent changes summary
2. **Website Audit** — Technical SEO score + Content quality metrics
3. **Competitor Monitor** — 2 competitors with 4 data points each (rankings, backlinks, content updates, AEO features)
4. **Keyword Opportunities** — Gap analysis, trending keywords, low-hanging fruit
5. **AEO Insights** — Featured snippet tracking, LLM citation monitoring
6. **Backlink Profile** — Growth, quality assessment, toxic link detection
7. **Rank Tracker** — Position tracking over time for target keywords
8. **Content Performance** — Top pages, content decay/growth analysis

**UX Features:**
- Sidebar navigation matching traditional SEO tool layout
- "Last updated" timestamps on all data
- "Refresh Now" manual trigger
- Competitor change flow with re-analysis trigger
- Onboarding reminder popups (chat → dashboards path)

**Technical:**
- Background job infrastructure for DataForSEO API calls
- Data caching strategy (>24h old = stale)
- Real-time job status indicators
- Error handling for API limits/failures

### Out of Scope

- Google Search Console integration — Complex OAuth flow, defer to v2
- Multiple websites per user — Beta constraint, add after validation
- Automated email reports — Focus on dashboard UX first
- Team/organization features — Single user only for beta
- Historical data beyond 90 days — Beta limitation
- White-label/custom branding — Future enterprise feature

---

## Discovery Session Notes

**From questioning session 2026-02-24:**

User has existing infrastructure:
- Chat-first onboarding with RAG-based website understanding
- Firecrawl site crawling + AI brand voice analysis
- Competitor discovery (auto-find or manual add)
- 70+ DataForSEO MCP tools available
- 12 existing workflows including competitor analysis, AEO audit
- `/api/cron` already exists for background jobs

Dashboard vision:
- Traditional SEO sidebar navigation
- Modern shadcn/ui components
- Daily refresh via background jobs
- Instant load with manual refresh option
- 2 competitors per site (changeable)
- All 4 competitor data points: rankings, backlinks, content updates, AEO wins

Architecture decisions made:
- SaaS model with 1 site/user during beta
- On-demand refresh when user logs in (check staleness)
- Manual "Refresh Now" button for instant updates
- Competitor changes trigger full re-analysis
- GSC integration added later (Phase 6+)

---

*Last updated: 2026-02-24 after initialization*
