# Superpower Plugins for flowintent.com

> How to leverage DataForSEO, Jina AI, Firecrawl, and Perplexity to build content, guides, case studies, pricing pages, and developer portfolios.

---

## Overview

Your SEObot platform integrates **70+ AI-powered tools** across four major "superpower plugins":

| Plugin | Tools | Best For |
|--------|-------|----------|
| **DataForSEO** | 48 tools | Keyword research, competitor analysis, SERP tracking, domain metrics |
| **Jina AI** | 15 tools | Web search, content extraction, relevance ranking, deduplication |
| **Firecrawl** | 6 tools | Web scraping, site crawling, structured data extraction |
| **Perplexity** | 4 modes | Real-time research, citations, statistics, trend analysis |

---

## Use Case 1: SEO/AEO Guides for flowintent.com

### Goal
Create authoritative SEO and Answer Engine Optimization guides that rank in both Google and AI search engines (ChatGPT, Perplexity, Claude, Gemini).

### Plugin Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   PERPLEXITY    │────▶│   DATAFORSEO    │────▶│    FIRECRAWL    │
│  Research topic │     │ Keyword metrics │     │ Scrape top 10   │
│  Get citations  │     │ Search intent   │     │ SERP pages      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                              ┌─────────────────────────────────────┐
                              │           CONTENT AGENT              │
                              │  Generate optimized guide with:      │
                              │  • Direct answers for AEO            │
                              │  • Structured H-tags                 │
                              │  • FAQ schema                        │
                              │  • Expert citations                  │
                              └─────────────────────────────────────┘
```

### Specific Tools to Use

| Step | Plugin | Tool | Purpose |
|------|--------|------|---------|
| 1 | Perplexity | `sonar-pro` | Research "what is [topic]" with citations |
| 2 | DataForSEO | `dataforseo_labs_google_keyword_ideas` | Generate 50+ keyword variations |
| 3 | DataForSEO | `dataforseo_labs_search_intent` | Classify intent (informational/commercial) |
| 4 | DataForSEO | `serp_organic_live_advanced` | Get top 10 ranking pages |
| 5 | Firecrawl | `firecrawl_scrape` | Extract content from top competitors |
| 6 | Jina | `sort_by_relevance` | Rank extracted snippets by relevance |
| 7 | DataForSEO | `on_page_lighthouse` | Audit your published page |

### Example Guide Topics for flowintent.com

- "Complete Guide to User Intent Mapping in 2026"
- "How to Build Intent-Based Content Funnels"
- "AEO vs SEO: Optimizing for AI Search Engines"
- "Intent Signals: From Keyword to Conversion"

### Output Assets
- Long-form guide (2,500-4,000 words)
- Companion FAQ section (5-10 questions)
- Infographic data points
- Schema markup for featured snippets

---

## Use Case 2: Case Studies

### Goal
Build compelling case studies showing flowintent.com's impact with real data and competitor comparisons.

### Plugin Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   DATAFORSEO    │────▶│   FIRECRAWL     │────▶│   PERPLEXITY    │
│ Domain metrics  │     │ Crawl client    │     │ Industry stats  │
│ Traffic history │     │ site structure  │     │ Benchmarks      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Key Tools for Case Studies

| Tool | What It Provides | Case Study Value |
|------|------------------|------------------|
| `dataforseo_labs_google_domain_rank_overview` | Domain authority, traffic estimates | "Before/After" metrics |
| `dataforseo_labs_google_historical_rank_overview` | Ranking history over time | Growth trajectory charts |
| `dataforseo_labs_google_ranked_keywords` | All keywords a domain ranks for | Keyword portfolio growth |
| `dataforseo_labs_bulk_traffic_estimation` | Traffic estimates for competitors | Competitive benchmarking |
| `keywords_data_google_trends_explore` | Search trend data | Market timing context |
| `firecrawl_crawl` | Full site content extraction | Technical audit data |
| Perplexity `sonar-pro` | Industry statistics | Third-party validation |

### Case Study Template

```markdown
# How [Client] Increased Organic Traffic 340% with Intent-Based SEO

## The Challenge
[Use DataForSEO historical data to show starting position]

## The Solution
[Document the intent mapping strategy used]

## The Results
- Traffic: [dataforseo_labs_bulk_traffic_estimation]
- Keywords: [dataforseo_labs_google_ranked_keywords count]
- Domain Authority: [domain_rank_overview metrics]

## Industry Comparison
[Use Perplexity to find industry benchmarks]
[Use dataforseo_labs_google_competitors_domain for direct comparisons]
```

### Metrics to Extract

| Metric | DataForSEO Tool | Visual |
|--------|-----------------|--------|
| Organic traffic growth | `historical_rank_overview` | Line chart |
| Keyword count growth | `ranked_keywords` with date filters | Bar chart |
| Domain rank change | `domain_rank_overview` | Before/after cards |
| Competitor gap closed | `domain_intersection` | Venn diagram |

---

## Use Case 3: Pricing Page & User Monetization

### Goal
Build a data-driven pricing strategy based on competitor analysis and market positioning.

### Competitive Pricing Research

| Tool | Use For |
|------|---------|
| `firecrawl_extract` | Extract pricing tables from competitor sites |
| `firecrawl_search` | Find "[competitor] pricing" pages |
| Perplexity `sonar-pro` | Research "SaaS pricing models for intent tools" |
| `dataforseo_labs_google_serp_competitors` | Find who competes for "intent marketing software" |

### Workflow: Build Pricing Page

```
1. COMPETITOR DISCOVERY
   └─▶ dataforseo_labs_google_serp_competitors
       Query: "user intent software"
       Output: List of 10-20 competitors

2. PRICING EXTRACTION
   └─▶ firecrawl_extract (for each competitor)
       URLs: [competitor]/pricing
       Schema: {
         "plans": [{ "name": "", "price": "", "features": [] }]
       }
       Output: Structured pricing data

3. MARKET RESEARCH
   └─▶ Perplexity sonar-pro
       Query: "SaaS pricing benchmarks 2026 marketing tools"
       Output: Industry averages, ARPU data

4. FEATURE COMPARISON
   └─▶ firecrawl_crawl (competitor sites)
       Extract feature lists from marketing pages
       
   └─▶ jina sort_by_relevance
       Rank features by importance to your audience
```

### Pricing Tier Suggestions Based on Intent Market

| Tier | Target | Features to Highlight |
|------|--------|----------------------|
| **Free/Starter** | Solo creators | Basic intent detection, 100 queries/mo |
| **Pro** | SMB marketers | Full intent mapping, competitor tracking |
| **Agency** | Marketing agencies | White-label, client dashboards, API access |
| **Enterprise** | Large brands | Custom models, dedicated support, SLAs |

### Tools for Ongoing Price Optimization

```javascript
// Monitor competitor pricing changes
firecrawl_scrape({
  url: "https://competitor.com/pricing",
  maxAge: 86400 * 7 // Cache for 7 days, detect weekly changes
})

// Track market demand signals
keywords_data_google_trends_explore({
  keywords: ["intent marketing", "user intent tools"],
  time_range: "past_12_months"
})
```

---

## Use Case 4: Developer Portfolio

### Goal
Create a technical portfolio showcasing your platform's capabilities, API documentation, and integration examples.

### Portfolio Components to Build

| Component | Plugins to Use | Content Type |
|-----------|----------------|--------------|
| API Documentation | All MCPs | Interactive docs |
| Integration Guides | Firecrawl, Jina | Step-by-step tutorials |
| Performance Metrics | DataForSEO | Benchmark data |
| Code Examples | All | GitHub-style snippets |

### Technical Showcase Ideas

#### 1. "Build an Intent Classifier in 10 Lines"
```typescript
// Show Perplexity + DataForSEO integration
const intent = await dataforseo_labs_search_intent({
  keywords: ["best running shoes", "nike stock price", "how to tie shoelaces"],
  language_code: "en"
})

// Returns: commercial, navigational, informational
```

#### 2. "Real-Time SERP Monitoring"
```typescript
// Showcase DataForSEO capabilities
const serp = await serp_organic_live_advanced({
  keyword: "user intent marketing",
  location_name: "United States",
  device: "mobile"
})
```

#### 3. "Content Gap Analysis"
```typescript
// Multi-tool workflow
const myKeywords = await dataforseo_labs_google_ranked_keywords({
  target: "flowintent.com"
})
const competitorKeywords = await dataforseo_labs_google_ranked_keywords({
  target: "competitor.com"
})
const gaps = await dataforseo_labs_google_domain_intersection({
  targets: ["flowintent.com", "competitor.com"]
})
```

### Portfolio Page Structure

```
flowintent.com/developers/
├── /overview          → Platform capabilities summary
├── /api-reference     → Full tool documentation
├── /guides/
│   ├── /keyword-research    → DataForSEO tutorials
│   ├── /content-extraction  → Firecrawl/Jina guides
│   └── /research-automation → Perplexity workflows
├── /examples/
│   ├── /seo-audit          → End-to-end audit script
│   ├── /competitor-analysis → Multi-tool analysis
│   └── /content-generation  → Full pipeline example
└── /changelog         → API version history
```

---

## Quick Reference: All 70+ Tools

### DataForSEO (48 Tools)

<details>
<summary>SERP Analysis (7 tools)</summary>

| Tool | Description |
|------|-------------|
| `serp_organic_live_advanced` | Real-time SERP results |
| `serp_locations` | Available SERP locations |
| `serp_youtube_organic_live_advanced` | YouTube search results |
| `serp_youtube_locations` | YouTube locations |
| `serp_youtube_video_info_live_advanced` | Video metadata |
| `serp_youtube_video_comments_live_advanced` | Video comments |
| `serp_youtube_video_subtitles_live_advanced` | Video subtitles |

</details>

<details>
<summary>Keyword Research (16 tools)</summary>

| Tool | Description |
|------|-------------|
| `dataforseo_labs_google_keyword_overview` | Keyword metrics (CPC, volume, intent) |
| `dataforseo_labs_google_keyword_ideas` | Generate keyword ideas |
| `dataforseo_labs_google_keyword_suggestions` | Keyword suggestions |
| `dataforseo_labs_google_related_keywords` | Related keywords |
| `dataforseo_labs_bulk_keyword_difficulty` | Difficulty scores (0-100) |
| `dataforseo_labs_search_intent` | Intent classification |
| `dataforseo_labs_google_historical_keyword_data` | Historical metrics |
| `keywords_data_google_ads_search_volume` | Google Ads volume |
| `keywords_data_google_trends_explore` | Google Trends data |
| `keywords_data_google_trends_categories` | Trends categories |
| `keywords_data_dataforseo_trends_explore` | DataForSEO Trends |
| `keywords_data_dataforseo_trends_demography` | Demographic trends |
| `keywords_data_dataforseo_trends_subregion_interests` | Regional trends |
| `ai_optimization_keyword_data_locations_and_languages` | AI optimization locations |
| `ai_optimization_keyword_data_search_volume` | AI search volume |

</details>

<details>
<summary>Domain Analysis (11 tools)</summary>

| Tool | Description |
|------|-------------|
| `dataforseo_labs_google_domain_rank_overview` | Domain metrics |
| `dataforseo_labs_google_ranked_keywords` | Ranking keywords |
| `dataforseo_labs_google_competitors_domain` | Competitor domains |
| `dataforseo_labs_google_keywords_for_site` | Site keywords |
| `dataforseo_labs_google_subdomains` | Subdomain data |
| `dataforseo_labs_google_relevant_pages` | Relevant pages |
| `dataforseo_labs_google_historical_rank_overview` | Historical ranking |
| `dataforseo_labs_bulk_traffic_estimation` | Traffic estimates |
| `dataforseo_labs_google_domain_intersection` | Keyword overlap |
| `dataforseo_labs_google_page_intersection` | Page keyword overlap |
| `dataforseo_labs_google_top_searches` | Top searches |

</details>

<details>
<summary>On-Page & Content (6 tools)</summary>

| Tool | Description |
|------|-------------|
| `on_page_lighthouse` | Lighthouse audit |
| `on_page_instant_pages` | Page analysis |
| `on_page_content_parsing` | Content parsing |
| `content_analysis_search` | Content citations |
| `content_analysis_summary` | Content summary |
| `content_analysis_phrase_trends` | Phrase trends |

</details>

<details>
<summary>Business Data (6 tools)</summary>

| Tool | Description |
|------|-------------|
| `domain_analytics_whois_overview` | WHOIS data |
| `domain_analytics_whois_available_filters` | WHOIS filters |
| `domain_analytics_technologies_domain_technologies` | Tech stack detection |
| `domain_analytics_technologies_available_filters` | Tech filters |
| `business_data_business_listings_search` | Business listings |
| `dataforseo_labs_google_serp_competitors` | SERP competitors |

</details>

### Jina AI (15 Tools)

| Tool | Category | Description |
|------|----------|-------------|
| `search_web` | Search | Web search with citations |
| `parallel_search_web` | Search | Batch web search (up to 5) |
| `search_arxiv` | Search | Academic paper search |
| `parallel_search_arxiv` | Search | Batch arXiv search |
| `search_images` | Search | Image search |
| `read_url` | Extract | URL to markdown |
| `parallel_read_url` | Extract | Batch URL extraction |
| `capture_screenshot_url` | Extract | Screenshot capture |
| `guess_datetime_url` | Extract | Page date detection |
| `expand_query` | Query | Query expansion |
| `sort_by_relevance` | AI | Rerank by relevance |
| `deduplicate_strings` | AI | Semantic deduplication |
| `deduplicate_images` | AI | Image deduplication |
| `primer` | Utility | Session context |
| `show_api_key` | Utility | API key info |

### Firecrawl (6 Tools)

| Tool | Description | Key Feature |
|------|-------------|-------------|
| `firecrawl_scrape` | Single page scrape | Fastest, most reliable |
| `firecrawl_search` | Web search + optional scrape | Combine discovery + extraction |
| `firecrawl_crawl` | Multi-page crawl | Full site extraction |
| `firecrawl_map` | Discover all URLs | Sitemap alternative |
| `firecrawl_extract` | LLM-powered extraction | Structured data from pages |
| `firecrawl_check_crawl_status` | Check crawl job | Monitor long-running crawls |

### Perplexity (4 Modes)

| Model | Use Case | Cost/1K tokens |
|-------|----------|----------------|
| `sonar` | Basic search | $0.001 |
| `sonar-pro` | Standard research | $0.003 |
| `sonar-reasoning` | Reasoning tasks | N/A |
| `sonar-reasoning-pro` | Deep research | $0.005 |

---

## Monetization Opportunities

### Based on Your Plugin Stack

| Revenue Model | How to Implement | Tools Required |
|---------------|------------------|----------------|
| **SEO Audits as a Service** | Automated site audits | DataForSEO (Lighthouse, domain analysis) |
| **Competitor Reports** | Monthly competitor tracking | DataForSEO + Firecrawl |
| **Content Briefs** | AI-generated writing briefs | All plugins + ContentWriterAgent |
| **Keyword Research Reports** | On-demand keyword analysis | DataForSEO (keywords + intent) |
| **API Access Tiers** | Expose tools via your API | All MCPs with rate limiting |
| **White-Label Platform** | Resell to agencies | Full platform licensing |

### Suggested Pricing Anchors

Based on competitor analysis capabilities:

| Feature | Monthly Value | Justification |
|---------|---------------|---------------|
| Keyword research (1000 queries) | $49-99 | DataForSEO costs ~$0.01-0.03/query |
| Competitor tracking (5 domains) | $79-149 | Ongoing monitoring value |
| Content briefs (10/month) | $99-199 | Time savings for writers |
| Full API access | $299-499 | Developer/agency tier |

---

## Getting Started

### 1. Environment Setup

```bash
# Required API keys
DATAFORSEO_USERNAME=your_username
DATAFORSEO_PASSWORD=your_password
JINA_API_KEY=your_jina_key
FIRECRAWL_API_KEY=your_firecrawl_key
PERPLEXITY_API_KEY=your_perplexity_key
```

### 2. Run Your First Workflow

```typescript
// Example: Full keyword research for a flowintent.com topic
import { getDataForSEOTools } from '@/lib/mcp/dataforseo-client'
import { searchWithPerplexity } from '@/lib/external-apis/perplexity'

// 1. Research the topic
const research = await searchWithPerplexity({
  query: "user intent optimization best practices 2026",
  model: "sonar-pro"
})

// 2. Get keyword metrics
const keywords = await tools.dataforseo_labs_google_keyword_ideas({
  keywords: ["user intent", "intent mapping"],
  location_name: "United States",
  language_code: "en",
  limit: 50
})

// 3. Classify intent
const intents = await tools.dataforseo_labs_search_intent({
  keywords: keywords.map(k => k.keyword),
  language_code: "en"
})
```

### 3. Next Steps

1. **Build your first guide** using the SEO/AEO workflow above
2. **Create a case study** with real DataForSEO metrics
3. **Set up competitor monitoring** with scheduled Firecrawl jobs
4. **Launch your pricing page** after competitor analysis

---

## Support

- **MCP Documentation**: See `lib/mcp/` for implementation details
- **Agent Registry**: See `lib/agents/registry.ts` for tool configurations
- **Tool Assembler**: See `lib/chat/tool-assembler.ts` for agent-tool mapping

---

*Last updated: January 2026*
