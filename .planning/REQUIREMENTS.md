# SEO Dashboard Platform — Requirements

**Version:** v1.0 (Beta)
**Created:** 2026-02-24
**Status:** Draft → Ready for Roadmap

---

## v1 Requirements (Beta)

### Overview Dashboard (REQ-OVERVIEW)

**Purpose:** At-a-glance health status and key metrics

**Requirements:**

- [ ] **REQ-OVERVIEW-01** — Display unified SEO health score (0-100) combining technical, content, and authority factors
- [ ] **REQ-OVERVIEW-02** — Show 4-6 KPI cards: organic traffic estimate, ranking keywords count, backlink count, content pieces indexed, AEO mentions, competitor position
- [ ] **REQ-OVERVIEW-03** — Display "last updated" timestamp with color-coded staleness indicator (green <24h, yellow 24-48h, red >48h)
- [ ] **REQ-OVERVIEW-04** — Show recent significant changes (±10% ranking shifts, new/lost backlinks, content updates) in activity feed
- [ ] **REQ-OVERVIEW-05** — Provide manual "Refresh Now" button to trigger background data sync
- [ ] **REQ-OVERVIEW-06** — Display job status when refresh is running (queued → processing → complete)

**Dependencies:** All other dashboards must exist to aggregate data

---

### Website Audit Dashboard (REQ-AUDIT)

**Purpose:** Technical SEO health and content quality assessment

**Requirements:**

**Technical SEO Section:**
- [ ] **REQ-AUDIT-01** — Crawl website using Firecrawl to detect technical issues
- [ ] **REQ-AUDIT-02** — Display technical score breakdown: crawlability, mobile-friendliness, page speed, security (HTTPS), structured data
- [ ] **REQ-AUDIT-03** — List critical issues (blocking robots.txt, 4xx/5xx errors, missing meta descriptions)
- [ ] **REQ-AUDIT-04** — List warnings (slow pages, missing alt tags, duplicate content)
- [ ] **REQ-AUDIT-05** — Show recommendations prioritized by impact × effort

**Content Quality Section:**
- [ ] **REQ-AUDIT-06** — Analyze content freshness (average age, last update dates)
- [ ] **REQ-AUDIT-07** — Display content quality metrics: word count distribution, readability scores, internal linking density
- [ ] **REQ-AUDIT-08** — Identify thin content pages (<300 words) and duplicate content
- [ ] **REQ-AUDIT-09** — Flag orphaned pages (no internal links pointing to them)
- [ ] **REQ-AUDIT-10** — Show top-performing content and content decaying in traffic

**Data Sources:** Firecrawl site crawl, DataForSEO OnPage API

---

### Competitor Monitor Dashboard (REQ-COMPETITOR)

**Purpose:** Track 2 competitor websites across 4 data dimensions

**Requirements:**

**Competitor Management:**
- [ ] **REQ-COMPETITOR-01** — Display current 2 competitors with website favicons and names
- [ ] **REQ-COMPETITOR-02** — Provide "Change Competitors" button opening selection modal
- [ ] **REQ-COMPETITOR-03** — Allow removing existing competitors and adding new ones (up to 2 total)
- [ ] **REQ-COMPETITOR-04** — Auto-suggest competitors based on overlapping keywords using DataForSEO
- [ ] **REQ-COMPETITOR-05** — Trigger full re-analysis when competitors change

**Data Point 1 — Rankings Comparison:**
- [ ] **REQ-COMPETITOR-06** — Display side-by-side ranking comparison for top 50 keywords
- [ ] **REQ-COMPETITOR-07** — Show win/loss/neutral indicators (you rank higher/lower/same)
- [ ] **REQ-COMPETITOR-08** — Highlight keywords where competitor outranks you by 3+ positions

**Data Point 2 — Backlink Profile:**
- [ ] **REQ-COMPETITOR-09** — Compare backlink counts (total, referring domains, dofollow/nofollow ratio)
- [ ] **REQ-COMPETITOR-10** — Show backlink growth velocity (new/lost per week)
- [ ] **REQ-COMPETITOR-11** — Display domain authority scores side-by-side
- [ ] **REQ-COMPETITOR-12** — Identify unique competitor backlinks (they have, you don't)

**Data Point 3 — Content Updates:**
- [ ] **REQ-COMPETITOR-13** — Track competitor content publishing frequency
- [ ] **REQ-COMPETITOR-14** — Detect recent competitor content updates (title/meta changes)
- [ ] **REQ-COMPETITOR-15** — Show competitor top-performing pages by estimated traffic

**Data Point 4 — AEO/Featured Snippets:**
- [ ] **REQ-COMPETITOR-16** — Compare featured snippet ownership count
- [ ] **REQ-COMPETITOR-17** — Identify queries where competitor holds snippets you don't
- [ ] **REQ-COMPETITOR-18** — Track AI citation mentions (ChatGPT, Perplexity, Claude) if detectable

**Data Sources:** DataForSEO SERP API, Backlinks API, Domain Analytics API

---

### Keyword Opportunities Dashboard (REQ-KEYWORDS)

**Purpose:** Discover ranking opportunities and keyword gaps

**Requirements:**

**Gap Analysis:**
- [ ] **REQ-KEYWORDS-01** — Identify keywords competitors rank for (positions 1-20) that you don't rank for at all
- [ ] **REQ-KEYWORDS-02** — Filter gaps by keyword difficulty (easy, medium, hard)
- [ ] **REQ-KEYWORDS-03** — Show search volume and competition level for each gap
- [ ] **REQ-KEYWORDS-04** — Prioritize gaps by opportunity score (volume × relevance × difficulty)

**Trending Keywords:**
- [ ] **REQ-KEYWORDS-05** — Display trending keywords in your industry/niche
- [ ] **REQ-KEYWORDS-06** — Show search volume change (%) over last 30/90 days
- [ ] **REQ-KEYWORDS-07** — Identify rising keywords with increasing volume but lower competition

**Low-Hanging Fruit:**
- [ ] **REQ-KEYWORDS-08** — Find keywords where you rank positions 11-20 (page 2)
- [ ] **REQ-KEYWORDS-09** — Estimate traffic increase if moved to positions 1-10
- [ ] **REQ-KEYWORDS-10** — Recommend quick wins based on current content optimization

**Long-Tail Opportunities:**
- [ ] **REQ-KEYWORDS-11** — Discover long-tail variations of your ranking keywords
- [ ] **REQ-KEYWORDS-12** — Show question-based keywords (what, how, why) for content ideas

**Data Sources:** DataForSEO Keywords Data API, SERP API

---

### AEO Insights Dashboard (REQ-AEO)

**Purpose:** Track AI Engine Optimization performance (ChatGPT, Perplexity, Claude, Gemini citations)

**Requirements:**

**LLM Citation Tracking:**
- [ ] **REQ-AEO-01** — Display citation count across major LLMs (ChatGPT, Perplexity, Claude, Gemini)
- [ ] **REQ-AEO-02** — Show which of your pages/content are being cited
- [ ] **REQ-AEO-03** — Track citation share of voice vs competitors
- [ ] **REQ-AEO-04** — Display trend over time (growing/declining citation presence)

**Featured Snippets:**
- [ ] **REQ-AEO-05** — Track featured snippets owned (position 0) for target keywords
- [ ] **REQ-AEO-06** — Show snippet types (paragraph, list, table, video)
- [ ] **REQ-AEO-07** — Identify queries where you rank #1 but don't own snippet
- [ ] **REQ-AEO-08** — Compare snippet ownership with 2 competitors

**People Also Ask:**
- [ ] **REQ-AEO-09** — Display PAA questions related to your ranking keywords
- [ ] **REQ-AEO-10** — Show if you appear in PAA boxes (yes/no + position)
- [ ] **REQ-AEO-11** — Recommend content to target high-value PAA questions

**Content Freshness for AI:**
- [ ] **REQ-AEO-12** — Highlight that 95% of ChatGPT citations point to content <10 months old
- [ ] **REQ-AEO-13** — Flag content older than 10 months that ranks well (refresh candidates)
- [ ] **REQ-AEO-14** — Show freshness score by content category

**Data Sources:** DataForSEO AI Optimization API, manual LLM queries, SERP API

---

### Backlink Profile Dashboard (REQ-BACKLINKS)

**Purpose:** Monitor backlink growth, quality, and toxic links

**Requirements:**

**Growth Metrics:**
- [ ] **REQ-BACKLINKS-01** — Display total backlink count over time (chart)
- [ ] **REQ-BACKLINKS-02** — Show referring domains count and trend
- [ ] **REQ-BACKLINKS-03** — Track new vs lost backlinks (weekly/monthly view)
- [ ] **REQ-BACKLINKS-04** — Display dofollow vs nofollow ratio

**Quality Assessment:**
- [ ] **REQ-BACKLINKS-05** — Show domain authority distribution of referring domains
- [ ] **REQ-BACKLINKS-06** — Identify top authority backlinks (DR 70+)
- [ ] **REQ-BACKLINKS-07** — Display anchor text distribution (branded vs exact match vs generic)
- [ ] **REQ-BACKLINKS-08** — Flag over-optimized anchor text (high exact match %)

**Toxic Link Detection:**
- [ ] **REQ-BACKLINKS-09** — Identify potentially toxic backlinks (spam score >30)
- [ ] **REQ-BACKLINKS-10** — Flag links from suspicious TLDs (.click, .link, etc.)
- [ ] **REQ-BACKLINKS-11** — Show links from link farms or PBNs (if detectable)
- [ ] **REQ-BACKLINKS-12** — Generate disavow file for toxic links

**Top Referrers:**
- [ ] **REQ-BACKLINKS-13** — Display top 20 referring domains by authority
- [ ] **REQ-BACKLINKS-14** — Show estimated traffic from each referrer
- [ ] **REQ-BACKLINKS-15** — Track competitor backlink velocity comparison

**Data Sources:** DataForSEO Backlinks API, Bulk Backlinks API

---

### Rank Tracker Dashboard (REQ-RANKS)

**Purpose:** Track keyword ranking positions over time

**Requirements:**

**Position Tracking:**
- [ ] **REQ-RANKS-01** — Display target keywords list with current positions
- [ ] **REQ-RANKS-02** — Show position history chart (30/90/180 day views)
- [ ] **REQ-RANKS-03** — Calculate average position across all tracked keywords
- [ ] **REQ-RANKS-04** — Display position distribution (positions 1-3, 4-10, 11-20, 21-50, 51+)

**Ranking Changes:**
- [ ] **REQ-RANKS-05** — Show keywords with significant position changes (±3+ positions)
- [ ] **REQ-RANKS-06** — Identify newly ranking keywords (entered top 100)
- [ ] **REQ-RANKS-07** — Flag lost rankings (dropped out of top 100)
- [ ] **REQ-RANKS-08** — Display SERP feature changes (gained/lost featured snippets)

**Performance Metrics:**
- [ ] **REQ-RANKS-09** — Estimate organic traffic based on positions × search volume
- [ ] **REQ-RANKS-10** — Show click-through rate estimates by position
- [ ] **REQ-RANKS-11** — Calculate visibility score (weighted average position)
- [ ] **REQ-RANKS-12** — Display top movers (biggest position gains/losses)

**Data Sources:** DataForSEO SERP API, Rank Tracker API

---

### Content Performance Dashboard (REQ-CONTENT)

**Purpose:** Track content effectiveness and identify decay

**Requirements:**

**Top Performers:**
- [ ] **REQ-CONTENT-01** — Display top 10 pages by estimated organic traffic
- [ ] **REQ-CONTENT-02** — Show pages with most ranking keywords
- [ ] **REQ-CONTENT-03** — Identify content with highest backlink acquisition
- [ ] **REQ-CONTENT-04** — Display pages with featured snippet wins

**Content Decay Detection:**
- [ ] **REQ-CONTENT-05** — Identify pages with declining traffic (>10% drop over 30 days)
- [ ] **REQ-CONTENT-06** — Flag pages losing ranking positions for primary keywords
- [ ] **REQ-CONTENT-07** — Show content freshness vs performance correlation
- [ ] **REQ-CONTENT-08** — Recommend refresh candidates (high traffic potential, declining)

**Growth Opportunities:**
- [ ] **REQ-CONTENT-09** — Identify pages ranking positions 4-10 (expand to win featured snippets)
- [ ] **REQ-CONTENT-10** — Find pages with high impressions but low CTR (optimize titles/meta)
- [ ] **REQ-CONTENT-11** — Show content gaps (high-volume topics not covered)

**Content Inventory:**
- [ ] **REQ-CONTENT-12** — Display total content pieces indexed
- [ ] **REQ-CONTENT-13** — Show content by type (blog posts, landing pages, guides)
- [ ] **REQ-CONTENT-14** — Track content publishing velocity over time

**Data Sources:** DataForSEO OnPage API, Content Analysis API, Analytics integration

---

## Technical Infrastructure Requirements

### Background Job System (REQ-INFRA-JOBS)

- [ ] **REQ-INFRA-JOBS-01** — Integrate Inngest for background job orchestration on Vercel
- [ ] **REQ-INFRA-JOBS-02** — Implement job queue for DataForSEO API calls with retry logic
- [ ] **REQ-INFRA-JOBS-03** — Provide real-time job status updates via Server-Sent Events (SSE)
- [ ] **REQ-INFRA-JOBS-04** — Support job cancellation for long-running operations
- [ ] **REQ-INFRA-JOBS-05** — Implement circuit breaker pattern (5-10s timeout, graceful degradation)

### Caching Strategy (REQ-INFRA-CACHE)

- [ ] **REQ-INFRA-CACHE-01** — Implement 3-layer caching: Next.js "use cache" + TanStack Query + Redis
- [ ] **REQ-INFRA-CACHE-02** — Set TTL by data type: rankings 6-12h, backlinks 48-72h, audit 24h
- [ ] **REQ-INFRA-CACHE-03** — Implement stale-while-revalidate pattern (show cached, refresh background)
- [ ] **REQ-INFRA-CACHE-04** — Provide cache invalidation API for manual refresh

### DataForSEO Integration (REQ-INFRA-DATAFORSEO)

- [ ] **REQ-INFRA-DATAFORSEO-01** — Implement per-endpoint rate limiting (respects DataForSEO limits)
- [ ] **REQ-INFRA-DATAFORSEO-02** — Use Standard method for scheduled updates, Live only for user-triggered
- [ ] **REQ-INFRA-DATAFORSEO-03** — Implement bulk polling via `tasks_ready` endpoint for cost optimization
- [ ] **REQ-INFRA-DATAFORSEO-04** — Track API costs per user/tenant for usage monitoring
- [ ] **REQ-INFRA-DATAFORSEO-05** — Handle async task pattern (POST → poll → GET results)

### Database Schema (REQ-INFRA-DB)

- [ ] **REQ-INFRA-DB-01** — Create dashboard_data table with JSONB for flexible schema
- [ ] **REQ-INFRA-DB-02** — Track data freshness with last_updated timestamps
- [ ] **REQ-INFRA-DB-03** — Store job history and status in database
- [ ] **REQ-INFRA-DB-04** — Implement competitor relationship table (user_site → competitor_sites)
- [ ] **REQ-INFRA-DB-05** — Create indexes on frequently queried columns (user_id, data_type, freshness)

---

## UX Requirements

### Navigation & Layout (REQ-UX-NAV)

- [ ] **REQ-UX-NAV-01** — Implement traditional SEO tool sidebar navigation with 8 dashboard links
- [ ] **REQ-UX-NAV-02** — Provide breadcrumbs showing current dashboard location
- [ ] **REQ-UX-NAV-03** — Support collapsible sidebar for mobile responsiveness
- [ ] **REQ-UX-NAV-04** — Highlight active dashboard in navigation

### Data Freshness Indicators (REQ-UX-FRESHNESS)

- [ ] **REQ-UX-FRESHNESS-01** — Display "Last updated: X hours ago" on every widget
- [ ] **REQ-UX-FRESHNESS-02** — Implement color-coded staleness: green (<24h), yellow (24-48h), red (>48h)
- [ ] **REQ-UX-FRESHNESS-03** — Show global "Refresh Now" button in header
- [ ] **REQ-UX-FRESHNESS-04** — Display job progress indicator when refresh is running

### Loading States (REQ-UX-LOADING)

- [ ] **REQ-UX-LOADING-01** — Use skeleton loaders (not spinners) for initial dashboard load
- [ ] **REQ-UX-LOADING-02** — Show partial data while background refresh completes
- [ ] **REQ-UX-LOADING-03** — Provide clear error states with retry actions
- [ ] **REQ-UX-LOADING-04** — Display loading progress for long operations (data sync)

### Onboarding Flow (REQ-UX-ONBOARD)

- [ ] **REQ-UX-ONBOARD-01** — Show reminder popup directing users to complete chat onboarding first
- [ ] **REQ-UX-ONBOARD-02** — After onboarding completion, display dashboard introduction tour
- [ ] **REQ-UX-ONBOARD-03** — Provide contextual help tooltips on first visit to each dashboard
- [ ] **REQ-UX-ONBOARD-04** — Support "Skip tour" option for returning users

---

## Out of Scope (v1)

| Feature | Reason |
|---------|--------|
| Google Search Console integration | OAuth complexity, defer to v2 |
| Multiple websites per user | Beta constraint, add after validation |
| Automated email reports | Focus on dashboard UX first |
| Team/organization support | Single user only for Beta |
| Historical data beyond 90 days | Storage/cost optimization for Beta |
| White-label/custom branding | Future enterprise feature |
| PDF report generation | Out of scope for real-time dashboard focus |
| API access for external tools | Dashboard-only interface for v1 |

---

## Requirement Traceability

| Requirement ID | Mapped to Phase | Implementation Status |
|----------------|-----------------|----------------------|
| REQ-OVERVIEW-01 | Phase 2 | Not Started |
| REQ-OVERVIEW-02 | Phase 2 | Not Started |
| REQ-OVERVIEW-03 | Phase 2 | Not Started |
| REQ-OVERVIEW-04 | Phase 2 | Not Started |
| REQ-OVERVIEW-05 | Phase 2 | Not Started |
| REQ-OVERVIEW-06 | Phase 2 | Not Started |
| REQ-AUDIT-01 | Phase 2 | Not Started |
| REQ-AUDIT-02 | Phase 2 | Not Started |
| REQ-AUDIT-03 | Phase 2 | Not Started |
| REQ-AUDIT-04 | Phase 2 | Not Started |
| REQ-AUDIT-05 | Phase 2 | Not Started |
| REQ-AUDIT-06 | Phase 2 | Not Started |
| REQ-AUDIT-07 | Phase 2 | Not Started |
| REQ-AUDIT-08 | Phase 2 | Not Started |
| REQ-AUDIT-09 | Phase 2 | Not Started |
| REQ-AUDIT-10 | Phase 2 | Not Started |
| REQ-COMPETITOR-01 | Phase 3 | Not Started |
| REQ-COMPETITOR-02 | Phase 3 | Not Started |
| REQ-COMPETITOR-03 | Phase 3 | Not Started |
| REQ-COMPETITOR-04 | Phase 3 | Not Started |
| REQ-COMPETITOR-05 | Phase 3 | Not Started |
| REQ-COMPETITOR-06 | Phase 3 | Not Started |
| REQ-COMPETITOR-07 | Phase 3 | Not Started |
| REQ-COMPETITOR-08 | Phase 3 | Not Started |
| REQ-COMPETITOR-09 | Phase 3 | Not Started |
| REQ-COMPETITOR-10 | Phase 3 | Not Started |
| REQ-COMPETITOR-11 | Phase 3 | Not Started |
| REQ-COMPETITOR-12 | Phase 3 | Not Started |
| REQ-COMPETITOR-13 | Phase 3 | Not Started |
| REQ-COMPETITOR-14 | Phase 3 | Not Started |
| REQ-COMPETITOR-15 | Phase 3 | Not Started |
| REQ-COMPETITOR-16 | Phase 3 | Not Started |
| REQ-COMPETITOR-17 | Phase 3 | Not Started |
| REQ-COMPETITOR-18 | Phase 3 | Not Started |
| REQ-KEYWORDS-01 | Phase 3 | Not Started |
| REQ-KEYWORDS-02 | Phase 3 | Not Started |
| REQ-KEYWORDS-03 | Phase 3 | Not Started |
| REQ-KEYWORDS-04 | Phase 3 | Not Started |
| REQ-KEYWORDS-05 | Phase 3 | Not Started |
| REQ-KEYWORDS-06 | Phase 3 | Not Started |
| REQ-KEYWORDS-07 | Phase 3 | Not Started |
| REQ-KEYWORDS-08 | Phase 3 | Not Started |
| REQ-KEYWORDS-09 | Phase 3 | Not Started |
| REQ-KEYWORDS-10 | Phase 3 | Not Started |
| REQ-KEYWORDS-11 | Phase 3 | Not Started |
| REQ-KEYWORDS-12 | Phase 3 | Not Started |
| REQ-AEO-01 | Phase 4 | Not Started |
| REQ-AEO-02 | Phase 4 | Not Started |
| REQ-AEO-03 | Phase 4 | Not Started |
| REQ-AEO-04 | Phase 4 | Not Started |
| REQ-AEO-05 | Phase 4 | Not Started |
| REQ-AEO-06 | Phase 4 | Not Started |
| REQ-AEO-07 | Phase 4 | Not Started |
| REQ-AEO-08 | Phase 4 | Not Started |
| REQ-AEO-09 | Phase 4 | Not Started |
| REQ-AEO-10 | Phase 4 | Not Started |
| REQ-AEO-11 | Phase 4 | Not Started |
| REQ-AEO-12 | Phase 4 | Not Started |
| REQ-AEO-13 | Phase 4 | Not Started |
| REQ-AEO-14 | Phase 4 | Not Started |
| REQ-BACKLINKS-01 | Phase 3 | Not Started |
| REQ-BACKLINKS-02 | Phase 3 | Not Started |
| REQ-BACKLINKS-03 | Phase 3 | Not Started |
| REQ-BACKLINKS-04 | Phase 3 | Not Started |
| REQ-BACKLINKS-05 | Phase 3 | Not Started |
| REQ-BACKLINKS-06 | Phase 3 | Not Started |
| REQ-BACKLINKS-07 | Phase 3 | Not Started |
| REQ-BACKLINKS-08 | Phase 3 | Not Started |
| REQ-BACKLINKS-09 | Phase 3 | Not Started |
| REQ-BACKLINKS-10 | Phase 3 | Not Started |
| REQ-BACKLINKS-11 | Phase 3 | Not Started |
| REQ-BACKLINKS-12 | Phase 3 | Not Started |
| REQ-BACKLINKS-13 | Phase 3 | Not Started |
| REQ-BACKLINKS-14 | Phase 3 | Not Started |
| REQ-BACKLINKS-15 | Phase 3 | Not Started |
| REQ-RANKS-01 | Phase 2 | Not Started |
| REQ-RANKS-02 | Phase 2 | Not Started |
| REQ-RANKS-03 | Phase 2 | Not Started |
| REQ-RANKS-04 | Phase 2 | Not Started |
| REQ-RANKS-05 | Phase 2 | Not Started |
| REQ-RANKS-06 | Phase 2 | Not Started |
| REQ-RANKS-07 | Phase 2 | Not Started |
| REQ-RANKS-08 | Phase 2 | Not Started |
| REQ-RANKS-09 | Phase 2 | Not Started |
| REQ-RANKS-10 | Phase 2 | Not Started |
| REQ-RANKS-11 | Phase 2 | Not Started |
| REQ-RANKS-12 | Phase 2 | Not Started |
| REQ-CONTENT-01 | Phase 3 | Not Started |
| REQ-CONTENT-02 | Phase 3 | Not Started |
| REQ-CONTENT-03 | Phase 3 | Not Started |
| REQ-CONTENT-04 | Phase 3 | Not Started |
| REQ-CONTENT-05 | Phase 3 | Not Started |
| REQ-CONTENT-06 | Phase 3 | Not Started |
| REQ-CONTENT-07 | Phase 3 | Not Started |
| REQ-CONTENT-08 | Phase 3 | Not Started |
| REQ-CONTENT-09 | Phase 3 | Not Started |
| REQ-CONTENT-10 | Phase 3 | Not Started |
| REQ-CONTENT-11 | Phase 3 | Not Started |
| REQ-CONTENT-12 | Phase 3 | Not Started |
| REQ-CONTENT-13 | Phase 3 | Not Started |
| REQ-CONTENT-14 | Phase 3 | Not Started |
| REQ-INFRA-JOBS-01 | Phase 1 | Not Started |
| REQ-INFRA-JOBS-02 | Phase 1 | Not Started |
| REQ-INFRA-JOBS-03 | Phase 1 | Not Started |
| REQ-INFRA-JOBS-04 | Phase 1 | Not Started |
| REQ-INFRA-JOBS-05 | Phase 1 | Not Started |
| REQ-INFRA-CACHE-01 | Phase 1 | Not Started |
| REQ-INFRA-CACHE-02 | Phase 1 | Not Started |
| REQ-INFRA-CACHE-03 | Phase 1 | Not Started |
| REQ-INFRA-CACHE-04 | Phase 1 | Not Started |
| REQ-INFRA-DATAFORSEO-01 | Phase 1 | Not Started |
| REQ-INFRA-DATAFORSEO-02 | Phase 1 | Not Started |
| REQ-INFRA-DATAFORSEO-03 | Phase 1 | Not Started |
| REQ-INFRA-DATAFORSEO-04 | Phase 1 | Not Started |
| REQ-INFRA-DATAFORSEO-05 | Phase 1 | Not Started |
| REQ-INFRA-DB-01 | Phase 1 | Not Started |
| REQ-INFRA-DB-02 | Phase 1 | Not Started |
| REQ-INFRA-DB-03 | Phase 1 | Not Started |
| REQ-INFRA-DB-04 | Phase 1 | Not Started |
| REQ-INFRA-DB-05 | Phase 1 | Not Started |
| REQ-UX-NAV-01 | Phase 1 | Not Started |
| REQ-UX-NAV-02 | Phase 1 | Not Started |
| REQ-UX-NAV-03 | Phase 1 | Not Started |
| REQ-UX-NAV-04 | Phase 1 | Not Started |
| REQ-UX-FRESHNESS-01 | Phase 1 | Not Started |
| REQ-UX-FRESHNESS-02 | Phase 1 | Not Started |
| REQ-UX-FRESHNESS-03 | Phase 1 | Not Started |
| REQ-UX-FRESHNESS-04 | Phase 1 | Not Started |
| REQ-UX-LOADING-01 | Phase 1 | Not Started |
| REQ-UX-LOADING-02 | Phase 1 | Not Started |
| REQ-UX-LOADING-03 | Phase 2 | Not Started |
| REQ-UX-LOADING-04 | Phase 2 | Not Started |
| REQ-UX-ONBOARD-01 | Phase 2 | Not Started |
| REQ-UX-ONBOARD-02 | Phase 2 | Not Started |
| REQ-UX-ONBOARD-03 | Phase 2 | Not Started |
| REQ-UX-ONBOARD-04 | Phase 2 | Not Started |

**Coverage Summary:**
| Phase | Requirements |
|-------|--------------|
| Phase 1 | 28 requirements (Infrastructure, Navigation, Freshness, Loading base, Onboarding) |
| Phase 2 | 34 requirements (Overview, Audit, Rank Tracker, Loading complete) |
| Phase 3 | 59 requirements (Competitor, Keywords, Backlinks, Content) |
| Phase 4 | 14 requirements (AEO Insights) |
| Phase 5 | TBD (Scale extensions) |
| **Total** | **135 mapped (includes Phase 5 extensions)** |

*Last updated: 2026-02-24 — Roadmap created, ready for execution*
