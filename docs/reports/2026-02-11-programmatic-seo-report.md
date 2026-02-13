# FlowIntent Programmatic SEO Report

Date: 2026-02-11  
Project: `seobot` / flowintent.com  
Method: Applied the installed `programmatic-seo` skill framework (playbook selection, uniqueness requirements, indexation guardrails, and template design)

## Executive take

FlowIntent has enough product depth and data infrastructure to win with programmatic SEO, but should **not** start with high-volume, low-value page generation. The best near-term path is a focused rollout across four playbooks that match current assets:

1. Comparisons (`/compare/*`)
2. Personas (`/for/*`)
3. Integrations (`/integrations/*`)
4. Glossary (`/glossary/*`)

Launch in stages, beginning with 15 to 25 high-value pages, then expand only after indexation, engagement, and conversion quality are proven.

---

## Business context used

- Product: AI SEO + AEO platform with trust audits, content workflows, and competitor/keyword research
- Primary conversion goals: `Run Free Audit`, `Start Free Trial`, and sales contact on higher-intent pages
- Current strengths:
  - Existing content architecture (`/blog`, `/guides`, `/resources`, `/case-studies`)
  - Existing sitemap/robots setup and AI crawler allowances
  - Existing structured data implementation on key routes
- Current gap: no dedicated, scalable programmatic page system for high-intent query families

---

## Current-state findings

### What is already strong

- Strong topical foundation around AEO/GEO and AI visibility concepts
- Structured data already present across root layout and several key pages
- Dynamic content routes already established (Sanity-backed slugs), so operationally the stack can support scale

### What is missing for pSEO

- No dedicated pSEO URL clusters (e.g. `/compare/x-vs-y`, `/for/persona`, `/integrations/tool`)
- No canonical data model for repeatable, high-uniqueness template pages
- No quality gate for noindexing weak/underdeveloped long-tail variants
- No explicit internal-link hub-spoke architecture for programmatic clusters

---

## Opportunity assessment by playbook

### Priority 1: Comparisons

Pattern: `[tool A] vs [tool B]`, `[tool] alternatives`  
Why now: Highest commercial intent and clear existing competitor set.  
Suggested cluster size:
- Phase 1: 8 pages (head competitors)
- Phase 2: 20 to 30 pages (segment + scenario variants)

Example URLs:
- `/compare/flowintent-vs-frase`
- `/compare/flowintent-vs-surfer`
- `/compare/flowintent-vs-clearscope`
- `/compare/flowintent-vs-marketmuse`

### Priority 2: Personas

Pattern: `[solution] for [audience]`  
Why now: Landing and pricing copy already references agencies, SMBs, and teams; this aligns tightly to current conversion flow.  
Suggested cluster size:
- Phase 1: 6 to 10 pages
- Phase 2: 20+ pages (industry + role combinations)

Example URLs:
- `/for/agencies`
- `/for/small-business`
- `/for/saas-marketing-teams`
- `/for/local-businesses`

### Priority 3: Integrations

Pattern: `[product A] [product B] integration`  
Why now: FlowIntent already uses a broad ecosystem (DataForSEO, Firecrawl, Jina, AI models, CMS stack) and can package real workflows.  
Suggested cluster size:
- Phase 1: 5 to 8 pages (only live integrations/workflows)
- Phase 2: 15 to 25 pages

Example URLs:
- `/integrations/dataforseo`
- `/integrations/firecrawl`
- `/integrations/sanity`
- `/integrations/wordpress` (only if shipping and maintained)

### Priority 4: Glossary

Pattern: `what is [term]`  
Why now: Builds topical authority and supports internal links into comparison/persona/conversion pages.  
Suggested cluster size:
- Phase 1: 15 terms
- Phase 2: 50+ terms

Example URLs:
- `/glossary/answer-engine-optimization`
- `/glossary/llm-citation`
- `/glossary/ai-visibility-score`

---

## 90-day rollout plan

### Days 1-14: Foundation

- Add pSEO content types in Sanity (or equivalent content store):
  - `comparisonPage`
  - `personaPage`
  - `integrationPage`
  - `glossaryTerm`
- Create route clusters in Next.js:
  - `/compare/[slug]`
  - `/for/[slug]`
  - `/integrations/[slug]`
  - `/glossary/[slug]`
- Define quality score fields and publish gates:
  - `minimumUniqueDataPoints`
  - `hasOriginalInsight`
  - `conversionFit`
  - `indexable` boolean

### Days 15-45: Pilot launch (15-25 pages)

- Publish:
  - 8 comparison pages
  - 6 persona pages
  - 5 glossary pages
- Add one hub page per cluster:
  - `/compare`
  - `/for`
  - `/integrations`
  - `/glossary`
- Add contextual internal links from existing guides/resources/case studies into new hubs and spokes

### Days 46-90: Scale with guardrails

- Expand to 60-80 total pages only if pilot KPIs pass thresholds
- Noindex weak performers after 6-8 weeks if they fail utility thresholds
- Add refresh cadence:
  - comparisons: monthly
  - integrations: monthly or release-driven
  - glossary: quarterly
  - persona pages: quarterly

---

## Page quality requirements (non-negotiable)

Each page must include unique value, not just token-swapped templates.

Required per-page uniqueness:

- 3+ page-specific data points
- 1+ page-specific recommendation block
- 1+ page-specific "best for" and "not for" segment statement
- 1+ page-specific CTA adaptation (trial, audit, or contact depending on intent)

Automatic noindex criteria:

- Thin body copy under defined quality threshold
- Missing unique data points
- Duplicate target intent with an existing stronger URL
- No meaningful engagement after observation window

---

## Recommended template system

### Comparison page template

URL: `/compare/[a]-vs-[b]`  
Title: `[A] vs [B]: Which is better for [persona/use-case]? (2026)`  
Meta: `Side-by-side comparison of [A] and [B] across pricing, AEO capabilities, workflow fit, and implementation speed.`

Sections:

1. Direct verdict block (40-60 words)
2. Feature comparison table (must contain real differentiators)
3. Persona fit matrix (who should choose each)
4. Implementation effort + time-to-value
5. Scenario recommendations (3 to 5 scenarios)
6. FAQ block
7. CTA block mapped to intent (`/audit`, `/prices`, `/contact`)

Schema:

- `Article`
- `FAQPage`
- `BreadcrumbList`

### Persona page template

URL: `/for/[persona]`  
Title: `AEO and AI SEO for [Persona]: Strategy, Playbook, and Tools`  
Meta: `Practical AEO playbook for [persona], including workflow, metrics, and a 30-day implementation plan.`

Sections:

1. Persona problem framing
2. Common failure patterns for that persona
3. Role-specific workflow
4. KPI map and reporting cadence
5. Recommended starting sequence
6. Case proof or modeled outcomes
7. CTA tuned by readiness

Schema:

- `Article`
- `HowTo` (when steps are explicit)
- `FAQPage`
- `BreadcrumbList`

### Integration page template

URL: `/integrations/[tool]`  
Title: `[Tool] + FlowIntent: [Outcome] Integration`  
Meta: `Connect [Tool] and FlowIntent to improve [outcome]. Setup steps, use cases, and reporting examples.`

Sections:

1. Outcome-first summary
2. Supported integration/workflow details
3. Setup process
4. Use-case library by persona
5. Common pitfalls and fixes
6. CTA to start implementation

Schema:

- `Article`
- `HowTo`
- `BreadcrumbList`

---

## Internal linking architecture

Use hub and spoke structure from day one:

- Hubs:
  - `/compare`
  - `/for`
  - `/integrations`
  - `/glossary`
- Spokes:
  - all detail pages in each cluster
- Cross-links:
  - comparison -> persona pages
  - persona pages -> relevant integrations
  - glossary -> all clusters

Rules:

- Every spoke linked from at least one hub and one related spoke
- Breadcrumbs on all pSEO pages
- Include all indexable pages in sitemap

---

## Measurement framework

Track weekly by cluster and by page type:

- Indexation rate
- Non-brand impressions
- Avg rank of target intent terms
- CTR
- Engagement quality (scroll depth/time)
- Conversion by CTA type (audit/trial/contact)

Pilot success thresholds before scale:

- >= 70% indexation for pilot pages
- >= 2.5% average CTR on indexed pages
- >= 1.5x conversion lift versus generic blog traffic

If thresholds are missed, pause scale and improve page quality before publishing additional URLs.

---

## Risks and mitigations

1. Thin/duplicate pages  
Mitigation: publish gates + noindex policy + editorial QA checklists.

2. Cannibalization with existing guides  
Mitigation: explicit intent mapping and canonical targets per keyword family.

3. Overproduction without demand  
Mitigation: demand-first backlog; only create pages with validated query patterns.

4. Stale comparison data  
Mitigation: recurring refresh workflow and last-updated visibility on page.

---

## Immediate next actions (this week)

1. Finalize 4 pSEO clusters and URL taxonomy.
2. Create schema/content model for comparison/persona/integration/glossary pages.
3. Build first 8 comparison pages and 6 persona pages from highest-intent terms.
4. Launch cluster hubs and internal links from existing guides.
5. Add KPI dashboard for indexation + conversion by cluster.
