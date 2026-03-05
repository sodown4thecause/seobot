# FlowIntent SEO Recovery Plan (Google Search Console + Technical SEO)

Date: 2026-03-01
Property: `sc-domain:flowintent.com`
Source data: Google Search Console API + live crawl checks of sitemap URLs

## SEO Recovery Snapshot

FlowIntent currently has a severe indexing and visibility gap:

- GSC sitemap metrics show `submitted: 31` and `indexed: 0` for `https://flowintent.com/sitemap.xml`.
- Organic performance is near-zero over recent weeks (`0 clicks`, low impressions).
- One sitemap URL is broken (`/aeo-vs-seo` = 404).
- Many indexable pages are missing canonical tags.
- Multiple titles/descriptions are outside recommended length, hurting CTR and snippet quality.

This plan fixes the full issue set in four phases: crawl/indexing integrity, metadata/canonical normalization, indexation recovery, and growth optimization.

---

## Baseline Audit Findings

## 1) Search Console Findings (2026-02-01 to 2026-02-27)

- Access/permission: siteOwner on `sc-domain:flowintent.com`
- Sitemaps:
  - `https://flowintent.com/sitemap.xml`
  - Reported: submitted 31, indexed 0, errors 0, warnings 0
- Search Analytics:
  - Clicks: 0
  - CTR: 0
  - Impressions are present but very low
  - Example query observed: `intent signal template` (very low volume/visibility)
- Devices:
  - Desktop impressions dominate
  - Mobile impressions are much lower

## 2) Live Sitemap URL Audit (19 URLs checked)

### Critical

- Broken URL in sitemap:
  - `https://flowintent.com/aeo-vs-seo` -> 404

### Technical On-page Issues

- Missing canonical tag: 13 URLs
- Title too long: 4 URLs
- Meta description too long: 3 URLs

### URLs flagged by checks

- `https://flowintent.com` (description too long, canonical missing)
- `https://flowintent.com/prices` (title too long, description too long, canonical missing)
- `https://flowintent.com/guides/llm-mentions` (canonical missing)
- `https://flowintent.com/guides/aeo-audit-playbook` (title too long, description too long, canonical missing)
- `https://flowintent.com/guides/answer-engine-optimization` (canonical missing)
- `https://flowintent.com/guides/chatgpt-seo` (canonical missing)
- `https://flowintent.com/guides/aeo-vs-geo` (canonical missing)
- `https://flowintent.com/faq` (title too long, canonical missing)
- `https://flowintent.com/docs` (canonical missing)
- `https://flowintent.com/contact` (canonical missing)
- `https://flowintent.com/aeo-vs-seo` (404)
- `https://flowintent.com/aeo-auditor` (title too long, canonical missing)
- `https://flowintent.com/privacy` (canonical missing)
- `https://flowintent.com/terms` (canonical missing)

---

## Recovery Goals and KPIs

## Primary Objectives

1. Restore valid indexation coverage for all intended public URLs.
2. Eliminate crawl/indexing blockers and sitemap inconsistencies.
3. Improve snippet quality and CTR readiness through metadata cleanup.
4. Establish repeatable monitoring to prevent regression.

## Success Criteria (Targets)

- 0 non-200 URLs in sitemap.
- 100% of indexable sitemap URLs have self-referencing canonical.
- GSC sitemap indexed count rises from 0 to:
  - >=80% within 14 days
  - >=95% within 30 days
- Search Analytics begins returning non-zero clicks within 2-4 weeks.
- No major indexing errors for key templates (home, prices, blog/guides/resources/case-studies).

---

## Implementation Plan (0-30 Days)

## Phase 0: Setup and Guardrails (Day 0)

Owner: SEO lead + developer

Tasks:

- Define canonical URL policy across site:
  - protocol `https`
  - preferred host `flowintent.com`
  - trailing slash convention (pick one and enforce consistently)
- Define indexability rules by route type:
  - index: marketing pages, guides, docs, resources (if populated), case studies
  - noindex: auth, dashboards, onboarding, private pages
- Create tracking sheet with URL-level status:
  - URL
  - status code
  - canonical present
  - canonical target
  - robots meta
  - included in sitemap
  - indexed in GSC
  - last checked date

Deliverable:

- Signed-off URL/indexability policy doc used by engineering and content teams.

## Phase 1: Remove Crawl and Indexing Blockers (Day 0-1)

Owner: engineering (high priority)

Tasks:

1. Resolve broken sitemap URL (`/aeo-vs-seo`)
   - Remove `/aeo-vs-seo` from sitemap.
   - Add a permanent redirect from `/aeo-vs-seo` to `/guides/aeo-vs-geo`.
   - Treat `/aeo-vs-seo` as a deprecated route and prevent reintroduction in future sitemaps.

2. Regenerate sitemap to include only canonical, indexable, 200 URLs.

3. Validate all sitemap URLs return 200 or valid 301 -> final 200 canonical destination.

4. Confirm robots behavior is intentional:
   - Current robots blocks private routes (`/api`, `/dashboard`, `/login`, etc.) which is good.
   - Ensure no public content routes are accidentally blocked.

5. In GSC:
   - resubmit sitemap
   - inspect fixed URL(s)
   - request indexing for the most important URLs (home, prices, guides hub, resources, case studies)

Exit criteria:

- Sitemap has no broken URLs.
- GSC accepts sitemap with crawlable URLs.

## Phase 2: Canonical, Title, and Meta Standardization (Day 1-3)

Owner: engineering + SEO/content

Tasks:

1. Add self-referencing canonical tags to all indexable pages missing them.

2. Normalize title tags:
   - target length: 45-60 chars
   - include primary intent phrase + brand suffix when useful

3. Normalize meta descriptions:
   - target length: 130-160 chars
   - clear outcome/value proposition + soft CTA

4. Ensure canonical and sitemap URLs always match the resolved URL format.

5. Ensure each indexable page has:
   - one H1
   - unique title + description
   - no duplicate canonical targets

Priority pages first:

- `https://flowintent.com`
- `https://flowintent.com/prices`
- `https://flowintent.com/guides/aeo-audit-playbook`
- `https://flowintent.com/faq`
- `https://flowintent.com/aeo-auditor`
- all pages currently missing canonical

Exit criteria:

- 100% canonical coverage on indexable pages.
- No critical metadata length outliers on key landing pages.

## Phase 3: Indexation Recovery Sprint (Day 3-14)

Owner: SEO lead

Tasks:

1. GSC Page Indexing triage by bucket:
   - Crawled - currently not indexed
   - Discovered - currently not indexed
   - Duplicate without user-selected canonical
   - Soft 404
   - Excluded by noindex

2. For each affected URL, assign a fix type:
   - Improve page substance/uniqueness
   - Strengthen internal linking
   - Fix canonical/noindex mismatch
   - Remove low-value pages from sitemap

3. Internal linking reinforcement:
   - Link from homepage and key hubs to all strategic pages.
   - Add contextual links between related guides/resources/case studies.

4. Request indexing in controlled batches (10-20 URLs/day after fixes).

5. Monitor sitemap indexed count and URL-level inspection outcomes daily for first week, then every 2-3 days.

Exit criteria:

- Indexed count shows clear positive trend.
- High-value pages become indexed and remain stable.

## Phase 4: CTR + Demand Capture Optimization (Week 2-4)

Owner: SEO/content

Tasks:

1. For pages with impressions but low/zero clicks:
   - rewrite title/description to better match query intent
   - sharpen value proposition and differentiation

2. Expand underpowered pages that are indexable but thin:
   - resources hub currently reports "No resources found"; either:
     - publish real resource entries quickly, or
     - noindex/remove from sitemap until populated

3. Build topic clusters around early-demand themes (AEO, LLM mentions, ChatGPT SEO).

4. Add structured data where relevant (FAQ/Article/SoftwareApplication already partially present).

5. Track weekly:
   - impressions
   - clicks
   - average position
   - indexed pages count
   - query footprint growth

Exit criteria:

- Non-zero clicks sustained.
- Growing query/page coverage in GSC.

---

## Issue-to-Resolution Matrix

## A) Broken URL in sitemap

Issue:

- `https://flowintent.com/aeo-vs-seo` returns 404.

Fix:

- Keep page removed, 301 redirect to `/guides/aeo-vs-geo`, and exclude `/aeo-vs-seo` from sitemap.
- Ensure sitemap includes only the destination canonical URL.

Validation:

- URL returns 200 (or 301->200), appears in sitemap correctly, GSC URL inspection passes.

## B) Missing canonicals

Issue:

- 13 URLs flagged without canonical tag.

Fix:

- Add `<link rel="canonical" href="{self-url}" />` on all indexable pages.
- Ensure no canonical points to non-indexable or redirected URL.

Validation:

- Crawl check reports canonical present and self-referencing for all public URLs.

## C) Overlength metadata

Issue:

- Titles and descriptions exceed best-practice ranges on key pages.

Fix:

- Rewrite by intent and snippet constraints.

Validation:

- Post-deploy extraction confirms target length ranges and uniqueness.

## D) Indexing disconnect (submitted > indexed)

Issue:

- Sitemap submitted URLs not becoming indexed.

Fix:

- Resolve technical blockers, strengthen page quality/internal links, prune low-value URLs from sitemap.

Validation:

- Indexed coverage rises in GSC sitemap and Page Indexing reports.

---

## 30-Day Execution Timeline

Week 1:

- Phase 0-2 complete.
- Broken URL fixed, canonicals added, metadata normalized, sitemap resubmitted.

Week 2:

- Phase 3 active.
- Daily GSC inspections and indexing requests for repaired URLs.

Week 3:

- Continue indexation remediation.
- Improve internal linking and low-value pages.

Week 4:

- Phase 4 optimization.
- CTR-focused metadata iteration and reporting review.

---

## RACI (Who Does What)

- SEO Lead: prioritization, GSC diagnosis, indexation requests, reporting
- Engineer: canonical implementation, routing/redirects, sitemap generation, template fixes
- Content Lead: title/description rewrites, thin-content expansion, internal links in content
- PM/Founder: approve URL policy and quality thresholds, unblock dependencies

---

## Definition of Done (Technical SEO)

- [ ] No sitemap URL returns 4xx/5xx
- [ ] Canonical exists on all indexable pages and points to final URL
- [ ] Metadata unique and within target lengths for priority pages
- [ ] Sitemap contains only canonical indexable URLs
- [ ] GSC shows improving indexed count week-over-week
- [ ] At least one week of non-zero clicks after stabilization

---

## Risk Register and Mitigations

1. Risk: indexing still stalls after technical fixes
   - Mitigation: prune low-quality URLs from sitemap; improve content depth; strengthen internal link graph.

2. Risk: canonical/noindex conflicts from templates
   - Mitigation: add automated QA checks in CI for rendered head tags.

3. Risk: route or CMS regressions reintroduce broken URLs
   - Mitigation: nightly sitemap URL health check and alerting.

4. Risk: pages indexed but low CTR
   - Mitigation: monthly snippet testing cycle by query intent bucket.

---

## Weekly SEO Recovery Scorecard

- Week ending:
- Indexed URLs (sitemap):
- Submitted URLs (sitemap):
- Coverage ratio (%):
- Clicks:
- Impressions:
- CTR:
- Avg position:
- New indexed pages this week:
- URLs fixed this week:
- Top blockers remaining:
- Next week priorities:

---

## Immediate Next Actions (First 24 Hours)

1. Remove `https://flowintent.com/aeo-vs-seo` from sitemap and keep permanent redirect to `/guides/aeo-vs-geo`.
2. Add canonical tags to all flagged pages.
3. Regenerate and resubmit sitemap.
4. Request indexing for top-priority URLs in GSC.
5. Start the URL-level tracking sheet and assign owners.
