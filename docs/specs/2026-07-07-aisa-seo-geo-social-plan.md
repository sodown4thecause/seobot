# AIsa SEO, GEO, Social, and Research Integration Plan

Generated: 2026-07-07
Branch: `codex/aisa-seo-geo-social-plan`

## Objective

Add AIsa-backed live data to FlowIntent's AI SDK 7 chatbot while preserving the existing mode model and keeping all AI model inference on FlowIntent-controlled providers:

- SEO mode: native DataForSEO backlinks and backlink-gap workflows.
- GEO / AEO mode measurement: use AIsa/DataForSEO probes for ChatGPT, Gemini, Google AI Overviews, Perplexity, and other supported AI-search surfaces.
- GEO / AEO mode synthesis: use Vercel AI Gateway and the Perplexity API only for FlowIntent's own generated analysis and summaries.
- Social mode: new first-class mode for X/Twitter, Reddit, and searchable social/listening sources.
- Onboarding/RAG: ingest user-owned Google Search Console context when connected.
- Research memory: run fortnightly Perplexity deep research for SEO/GEO industry updates, then chunk and embed into mode-scoped RAG.

Do not expose AIsa API keys to clients. Store keys only in server env.

## Provider Boundary

AIsa must not be used as FlowIntent's chatbot inference provider in production. It may be used for DataForSEO AI-search measurement probes where the purpose is to observe external answer surfaces, citations, mentions, and share of voice.

Allowed AIsa usage:

- DataForSEO SEO data, including keywords, SERPs, backlinks, content analysis, and Google AI Overview SERP blocks.
- DataForSEO AI Optimization probes into ChatGPT, Gemini, Google AI Overviews, Perplexity, and other supported AI-search surfaces.
- X/Twitter, Reddit, or other social/search data endpoints.
- Non-generative data retrieval, enrichment, and source discovery.

Disallowed AIsa usage:

- Any endpoint used to generate FlowIntent's own assistant answers, summaries, content drafts, classifications, or research synthesis.
- Treating `ai_optimization/*/llm_responses/*` output as the chatbot response instead of measurement evidence.
- AIsa-hosted chat completions or AIsa model gateway endpoints.

Allowed model providers:

- Vercel AI Gateway for ChatGPT/OpenAI-family, Gemini, Claude, DeepSeek, and other model probes supported by the Gateway.
- Perplexity API for Perplexity-native answers, citations, and deep research.

Implication for GEO:

- Google AI Overviews should be measured from DataForSEO SERP data via AIsa.
- ChatGPT, Gemini, Perplexity, and other supported AI-search surfaces can be measured through AIsa/DataForSEO probe endpoints when available.
- Perplexity API and Vercel AI Gateway remain the providers for FlowIntent's own explanatory synthesis, follow-up analysis, and any generated prose shown as assistant output.

## Current Codebase Fit

Relevant existing hooks:

- `lib/chat/modes.ts`: three current modes: `seo`, `geo`, `content`.
- `lib/agents/agent-router.ts`: mode routing and system prompts; SEO currently references `n8n_backlinks`.
- `lib/chat/tool-assembler.ts`: loads MCP tools and custom tools by agent type.
- `lib/chat/stream-builder.ts`: AI SDK 7 streaming and tool execution.
- `lib/chat/seo-aeo-context.ts`: injects business profile and mode-scoped RAG.
- `lib/db/schema.ts`: already has `agent_documents.mode`, `research_jobs`, `geo_runs`, `geo_prompts`, `api_usage_events`.
- `app/api/rag/ingest/route.ts` and `lib/rag/weekly-ingestion.ts`: existing scheduled RAG ingestion foundation.

Important correction: the project now uses AI SDK 7 (`ai@7.0.15`), though some docs/comments still mention AI SDK 6.

## Verified AIsa Endpoints and Production Decision

These were tested successfully with live AIsa auth.

### ChatGPT AI Optimization Probe - Verified, Allowed for Measurement

Endpoint:

```text
POST https://api.aisa.one/apis/v1/dataforseo/ai_optimization/chat_gpt/llm_responses/live
```

Payload:

```json
[
  {
    "user_prompt": "What are the best AI SEO tools?",
    "model_name": "gpt-4o-mini"
  }
]
```

Notes:

- `model_name` is required.
- `prompt`, `keyword`, and `user_prompt` without `model_name` were rejected.
- Successful response returned `status_code: 20000`, model `gpt-4o-mini-2024-07-18`, and token/cost fields.
- Production decision: allowed only as a DataForSEO measurement probe for ChatGPT-like answer visibility. Do not use this response as FlowIntent's own assistant output or content generation source.

### Google AI Overviews

Endpoint:

```text
POST https://api.aisa.one/apis/v1/dataforseo/serp/google/organic/live/advanced
```

Payload:

```json
[
  {
    "keyword": "best ai seo tools",
    "location_code": 2840,
    "language_code": "en",
    "device": "desktop",
    "os": "windows"
  }
]
```

Notes:

- Successful response returned `item_types` including `ai_overview`.
- The `items` array contained an `ai_overview` object with markdown and cited sources.

### SERP AI Summary

Endpoint:

```text
POST https://api.aisa.one/apis/v1/dataforseo/serp/ai_summary
```

Payload:

```json
[
  {
    "task_id": "<google-serp-task-id>"
  }
]
```

Notes:

- Works after a Google SERP task.
- Useful for summarizing AIO/organic result evidence into a compact artifact.

### X/Twitter

Verified example:

```text
GET https://api.aisa.one/apis/v1/twitter/user/info?userName=OpenAI
```

Notes:

- Returned a live profile payload.
- Need to enumerate/test Twitter search endpoints before implementation.

## Architecture

Add an AIsa server-side integration layer:

```text
lib/services/aisa/
  client.ts              # auth, fetch, timeout, retry, response validation
  dataforseo.ts          # typed DataForSEO proxy helpers
  geo.ts                 # LLM/AIO visibility helpers
  social.ts              # Twitter/Reddit/social search helpers
  normalizers.ts         # compact response shapes for tools/UI/RAG
  schemas.ts             # zod request/response schemas
```

Environment:

```text
AISA_API_KEY=
AISA_BASE_URL=https://api.aisa.one
AISA_TIMEOUT_MS=90000
```

Implementation rules:

- Server-only imports.
- Never pass raw response bodies directly into the model when they are large.
- Normalize cost, task id, provider status, citations, mentioned brands, domains, and source URLs.
- Log usage to `api_usage_events` with `provider = 'aisa'`.
- Use strict tool schemas so the model cannot spray arbitrary endpoints.

## SEO Mode

Replace the older `n8n_backlinks` SEO-mode dependency with native AIsa/DataForSEO backlink tools, while keeping a fallback if needed.

Tools to add:

- `seo_backlinks_summary`
- `seo_backlinks_list`
- `seo_referring_domains`
- `seo_backlink_anchors`
- `seo_backlink_competitors`
- `seo_backlink_domain_intersection`
- `seo_backlink_page_intersection`
- `seo_bulk_spam_score`

Likely AIsa proxy path pattern:

```text
/apis/v1/dataforseo/backlinks/<function>
```

Discovery task:

- Test exact paths and payloads for `summary`, `backlinks`, `referring_domains`, `anchors`, `competitors`, `domain_intersection`, `page_intersection`, and `bulk_spam_score`.
- Capture examples in tests/fixtures without secrets.

Router/tool changes:

- In `lib/agents/agent-router.ts`, replace `n8n_backlinks` in `SEO_TOOLS` with native backlink tool names.
- In `lib/chat/tool-assembler.ts`, keep `createBacklinksTool` as `legacy_n8n_backlinks` fallback or remove after native tools are stable.
- Add backlink summary requirements to SEO prompt, but make DataForSEO native tools the primary path.

Best-practice workflow:

1. Summary: backlink totals, referring domains, dofollow/nofollow mix, spam score distribution.
2. Evidence fan-out: fetch anchors, referring domains, sample backlinks, competitor overlap in parallel where possible.
3. Normalize: dedupe referring domains, classify link type/source quality.
4. Report: issue, impact, evidence, fix, priority.

## GEO / AEO Mode

Add live GEO visibility tools behind GEO mode without routing model inference through AIsa.

Tools to add:

- `geo_aisa_probe_chatgpt`
- `geo_aisa_probe_gemini`
- `geo_aisa_probe_perplexity`
- `geo_aisa_probe_google_ai_overview`
- `geo_gateway_probe_openai` for fallback/control comparisons
- `geo_gateway_probe_gemini` for fallback/control comparisons
- `geo_gateway_probe_claude` for fallback/control comparisons
- `geo_gateway_probe_deepseek` for fallback/control comparisons
- `geo_perplexity_answer` for direct Perplexity API comparison
- `geo_ai_overview_google`
- `geo_ai_summary_google_serp`
- `geo_llm_mentions_search`
- `geo_llm_mentions_top_domains`
- `geo_llm_mentions_top_pages`
- `geo_llm_mentions_aggregate_metrics`

Known working:

- ChatGPT DataForSEO probe: `ai_optimization/chat_gpt/llm_responses/live`
- Google AI Overviews: `serp/google/organic/live/advanced` plus `ai_overview` item
- Google AI summary: `serp/ai_summary`
- Perplexity API: already available through `PERPLEXITY_API_KEY` / `searchWithPerplexity`
- Vercel AI Gateway: already used in `lib/chat/stream-builder.ts`

Discovery task:

- Discover exact AIsa/DataForSEO AI Optimization probe paths and required payloads for Gemini, Perplexity, and any additional supported AI-search surfaces.
- Discover which Vercel AI Gateway model IDs should be used for fallback/control probes across OpenAI-family, Gemini, Claude, DeepSeek, and other configured models.
- Label results by source:
  - `dataforseo_probe`: AIsa/DataForSEO measurement of an external AI/search surface.
  - `direct_api_probe`: Perplexity API or other direct provider API.
  - `gateway_control_probe`: Vercel AI Gateway model-family comparison, not necessarily consumer search visibility.
- Map engine support to `GEO_ENABLED_ENGINES`.

Fan-out method:

1. Input: brand, website, competitors, topic/query, location/language.
2. Query expansion: generate 3 to 5 buyer/search prompts from the topic.
3. Engine fan-out: run selected probes in parallel with concurrency limits.
   - ChatGPT, Gemini, Perplexity, Google AI Overviews: AIsa/DataForSEO probes where available.
   - Perplexity: direct Perplexity API as a comparison and richer citation source.
   - OpenAI/ChatGPT-family, Gemini, Claude, DeepSeek: Vercel AI Gateway fallback/control probes.
4. Normalize each engine into:
   - engine
   - prompt/query
   - brandMentioned
   - competitorMentions
   - sentiment
   - citedUrls
   - citedDomains
   - responseExcerpt
   - providerCost
5. Persist to `geo_runs`, including `provider` and `surfaceType` metadata:
   - `provider`: `aisa`, `vercel_gateway`, or `perplexity`
   - `surfaceType`: `dataforseo_probe`, `google_ai_overview`, `perplexity_answer`, or `model_family_probe`
6. Return share of voice and citation gaps.

This follows Elmo's core model: track prompts, engines, citations, competitor benchmarks, and historical visibility.

## New Social Mode

Add `social` as a first-class chatbot mode.

Code changes:

- `lib/chat/modes.ts`: add `social` to `CHAT_MODES`, UI config, labels, and a new accent.
- `lib/agents/constants.ts`: add `SOCIAL`.
- `lib/agents/agent-router.ts`: add `SOCIAL_TOOLS`, `getSocialSystemPrompt`, and mode routing.
- `lib/chat/tool-assembler.ts`: load social tools for `agent === 'social'`.
- `components/chat/ai-chat-interface.tsx`: add mode-specific hero/workflow panel and suggestions.
- RAG migration: update `agent_documents_mode_check` to allow `social`.

Social tools:

- `social_x_profile`
- `social_x_search`
- `social_x_tweet_search`
- `social_x_brand_mentions`
- `social_reddit_search`
- `social_reddit_subreddit_details`
- `social_reddit_thread_analysis`
- `social_web_mentions_search`
- `social_discussion_fanout`

Data sources:

- AIsa Twitter endpoints for X/Twitter.
- AIsa Reddit endpoints if available.
- Existing `/reddit-gap` logic and Reddit-related AIsa endpoints for Reddit.
- Firecrawl for forum/community pages that need JS-rendered extraction.
- Jina for clean page reading and semantic dedupe.
- Exa if the env key is configured and a server-side client exists or is added.

Social workflow:

1. Detect brand/topic and target communities.
2. Fan out across X/Twitter, Reddit, and web discussion search.
3. Cluster posts by intent: pain point, competitor comparison, question, complaint, feature request, buying signal.
4. Extract representative quotes, URLs, authors only where allowed, engagement metrics, and sentiment.
5. Produce content opportunities and outreach/reply suggestions.
6. Save high-value findings as artifacts and optionally into `agent_documents` with `mode = 'social'`.

## Google Search Console Onboarding and RAG

Feasibility: yes, but it requires user OAuth consent or a connected Google Search Console integration. AIsa does not remove the need for user authorization to access a user's private Search Console property.

Plan:

1. Add Google OAuth scopes for Search Console:
   - `https://www.googleapis.com/auth/webmasters.readonly`
2. During onboarding, after website URL is saved:
   - ask user to connect Search Console
   - list verified properties
   - match property to `businessProfiles.websiteUrl`
3. Pull compact context:
   - top queries by clicks/impressions
   - pages with high impressions/low CTR
   - positions 4 to 20 opportunities
   - query/page pairs by country/device
   - rich result or indexing issues where available
4. Persist user-specific data:
   - summarized metrics to a new `search_console_snapshots` table
   - embeddings to `agent_documents` with `source_type = 'search_console'`, `mode = 'seo'`, `userId` support added if needed
5. Retrieval:
   - update RAG lookup to include global mode docs plus user-specific docs
   - make user docs higher priority than generic industry research

Schema additions likely needed:

- Add `userId` nullable column to `agent_documents`, or create `user_agent_documents`.
- Add `search_console_connections` for token/account/property metadata.
- Add `search_console_snapshots` for normalized query/page metrics.

Security:

- Encrypt refresh tokens or use Better Auth account storage if it supports encrypted provider tokens.
- Never store raw OAuth tokens in `agent_documents`.
- Do not blend one user's Search Console data into global RAG.

## Fortnightly Deep Research

Change weekly generic research to a fortnightly deeper research pipeline for SEO/GEO industry updates.

Schedule:

- Add `/api/cron/fortnightly-industry-research`.
- Run every 14 days through Vercel Cron or Inngest.
- Keep existing weekly endpoints during transition, then consolidate.

Research sources:

- Perplexity deep research via the Perplexity API.
- Vercel AI Gateway for synthesis, classification, extraction, and non-Perplexity model-family comparison.
- Firecrawl/Jina to fetch cited white papers, case studies, docs, and credible articles.
- DataForSEO content/keyword trend endpoints when the topic needs search-demand validation.

Research fan-out:

1. Generate research questions for SEO, GEO/AEO, AI Overviews, LLM citation behavior, content quality, link building, and social/search behavior.
2. Run Perplexity in parallel with strict per-topic budgets.
3. Fetch cited sources.
4. Score sources:
   - primary research/docs > case studies > reputable industry analysis > commentary
   - prefer recency, clear methodology, named authors, and original data
5. Produce a canonical summary with source URLs and extracted claims.
6. Chunk and embed.

Chunking strategy:

- Use structure-aware chunks from Markdown headings.
- Target 350 to 700 tokens per chunk.
- Overlap 50 to 100 tokens only when a section spans concepts.
- Store claim-level metadata:
  - topic
  - mode
  - source URL
  - publisher
  - published date if known
  - captured date
  - confidence/source tier
  - query that found it
- Dedupe by URL plus normalized title/content hash.

Embedding strategy:

- Continue using 1536-dimension embeddings to match existing pgvector schema.
- Add hybrid retrieval re-ranking:
  - vector similarity
  - keyword/entity match
  - recency boost for SEO/GEO news
  - source-tier boost for primary studies/docs
- Expire or down-rank stale news after 180 days, but keep canonical evergreen frameworks.

## Artifacts and UI

Add structured artifacts for:

- Backlink profile summary
- GEO engine visibility report
- Social listening report
- Search Console opportunity report
- Fortnightly industry research digest

Prefer compact normalized JSON so the existing `components/chat/tool-ui` pattern can render tables, citation lists, and action cards.

## Phased Delivery

### Phase 1: AIsa Client and Env - Implemented 2026-07-07

- Add server-only AIsa client.
- Add env validation.
- Add response/cost normalization.
- Add unit tests with mocked fetch.

Implementation:

- `lib/services/aisa/client.ts`
- `lib/services/aisa/dataforseo.ts`
- `lib/services/aisa/geo.ts`
- `lib/services/aisa/social.ts`
- `lib/services/aisa/normalizers.ts`
- `lib/services/aisa/schemas.ts`
- `tests/unit/services/aisa-client.test.ts`

### Phase 2: SEO Backlinks - Implemented 2026-07-07

- Discover and test exact AIsa backlink proxy paths.
- Add native backlink tools.
- Update SEO mode routing and prompt.
- Keep `n8n_backlinks` fallback until parity is proven.

Implementation:

- Verified AIsa/DataForSEO paths:
  - `/apis/v1/dataforseo/backlinks/summary/live`
  - `/apis/v1/dataforseo/backlinks/backlinks/live`
  - `/apis/v1/dataforseo/backlinks/referring_domains/live`
  - `/apis/v1/dataforseo/backlinks/anchors/live`
- Added service wrappers in `lib/services/aisa/dataforseo.ts`.
- Added backlink summary/list normalizers in `lib/services/aisa/normalizers.ts`.
- Added SEO mode AI SDK tools in `lib/chat/tool-assembler.ts`:
  - `aisa_backlinks_summary`
  - `aisa_backlinks_list`
  - `aisa_referring_domains`
  - `aisa_backlink_anchors`
- Hardened AIsa backlink tool responses so DataForSEO task errors return `success: false` and expose the provider status message instead of being masked as successful tool output.
- Renamed the old webhook tool exposure to `legacy_n8n_backlinks`.
- Updated `lib/agents/agent-router.ts` and `lib/agents/intent-tool-router.ts` to prefer AIsa/DataForSEO backlinks.
- Updated backlink artifact mapping to include the new tool names.
- Updated inline and Workspace backlink renderers so AIsa summary/list/referring-domain/anchor response shapes produce usable counts and sample rows.

### Phase 3: GEO Engine Fan-Out - Chat Scanner Implemented 2026-07-07

- Add verified AIsa/DataForSEO probes first: ChatGPT `llm_responses`, Google organic AIO, and SERP AI summary.
- Discover and add Gemini and Perplexity AIsa/DataForSEO probe paths.
- Add Perplexity API answer/citation tools for direct comparison and richer citations.
- Add Vercel AI Gateway model-family control probes for OpenAI-family, Gemini, Claude, DeepSeek, and any other configured Gateway models.
- Ensure AIsa/DataForSEO probe outputs are always normalized as measurement evidence, never assistant-generated prose.
- Add concurrent multi-engine scan tool.
- Persist normalized results to `geo_runs`.

Implementation completed:

- Updated `lib/geo/brand-tracker.ts` so chat `geo_brand_scan` uses AIsa/DataForSEO probes instead of direct DataForSEO Basic auth.
- Added generic `aiOptimizationLlmResponseProbe` in `lib/services/aisa/dataforseo.ts`.
- Hardened `normalizeAiProbeResult` for DataForSEO `message.sections` and annotations.
- Verified AIsa/DataForSEO probe paths:
  - `/apis/v1/dataforseo/ai_optimization/chat_gpt/llm_responses/live`
  - `/apis/v1/dataforseo/ai_optimization/gemini/llm_responses/live`
  - `/apis/v1/dataforseo/ai_optimization/perplexity/llm_responses/live`
  - `/apis/v1/dataforseo/ai_optimization/claude/llm_responses/live`
  - `/apis/v1/dataforseo/serp/google/organic/live/advanced`
- Verified working model names:
  - ChatGPT probe: `gpt-4o-mini`
  - Gemini probe: `gemini-2.5-flash`
  - Perplexity probe: `sonar`
  - Claude probe: `claude-haiku-4-5-20251001`

Phase 3 control probe slice implemented on 2026-07-07:

- Added `lib/geo/control-probes.ts`.
- Added `geo_perplexity_direct_probe` for direct Perplexity API comparison with citations.
- Added `geo_gateway_control_probe` for Vercel AI Gateway model-family comparison.
- Updated GEO mode routing and prompt guidance to label these as non-canonical controls and use AIsa/DataForSEO first.
- Added focused coverage in `tests/unit/geo/control-probes.test.ts`.

Phase 3 `/api/geo/runs` adapter slice implemented on 2026-07-07:

- Added `lib/geo/aisa-adapter.ts` as the canonical GEO engine adapter.
- Updated `lib/geo/adapters.ts` so `/api/geo/runs` and scheduled research use AIsa/DataForSEO probes instead of the OneGlanse/VPS facade.
- Kept `lib/geo/oneglanse-client.ts` as unused legacy code for now; it is no longer the adapter execution path.
- Added focused unit coverage in `tests/unit/geo/aisa-adapter.test.ts` for missing AIsa credentials, ChatGPT, Gemini, Claude, Perplexity, Google AI Overview, and DataForSEO task errors.
- Updated `geo_brand_scan` so authenticated chat scans persist per-engine rows into `geo_runs`, matching the Elmo-style historical visibility model without using the VPS facade.
- Promoted `geo_brand_scan` to a live `citation-tracker` artifact so scan output can be viewed and saved from the chat artifact panel.
- Verified with:
  - `npx vitest run tests/unit/geo/aisa-adapter.test.ts tests/unit/services/aisa-client.test.ts tests/unit/geo/geo-execution-tools.test.ts`
  - `npm run typecheck`

### Phase 4: Social Mode - Initial Implementation 2026-07-07

- Add `social` mode everywhere the current mode union is used.
- Add AIsa X/Twitter tools.
- Add Reddit/social search fan-out via AIsa, Firecrawl, Jina, and Exa when configured.
- Add social mode RAG namespace and artifacts.

Implementation completed:

- Added `social` to `lib/chat/modes.ts`, `lib/chat/mode-skills.ts`, `components/chat/chat-mode-selector.tsx`, and chat empty-state quick starts.
- Added `AGENT_IDS.SOCIAL`, Social mode routing, and a dedicated read-only social intelligence system prompt in `lib/agents/agent-router.ts`.
- Added `lib/social/tools.ts` with:
  - `aisa_x_profile`
  - `aisa_x_search`
  - `reddit_social_search`
- Added `searchTwitter` wrapper in `lib/services/aisa/social.ts` using `/apis/v1/twitter/search`.
- Updated `lib/chat/tool-assembler.ts` so Social mode loads the social tools plus Firecrawl and Jina MCP tools for wider social-web discovery.
- Added a dedicated Social mode empty-state screen in `components/chat/ai-chat-interface.tsx`.
- Added `components/chat/tool-ui/social-listening-result.tsx` and registered `social-listening` as a live artifact for `aisa_x_search` and `reddit_social_search`.
- Added a safe no-op for `social` in `lib/rag/weekly-ingestion.ts` until the fortnightly research-memory implementation lands.
- Added coverage in `tests/unit/social/tools.test.ts`, `tests/unit/chat/modes.test.ts`, and `tests/unit/agents/agent-router.test.ts`.

Live AIsa X/Twitter verification on 2026-07-08:

- `GET /apis/v1/twitter/user/info?userName=OpenAI` works and returns `status`, `msg`, and `data`.
- The guessed X/Twitter search path `/apis/v1/twitter/search` returns 404.
- Common alternate search paths also returned 404:
  - `/apis/v1/twitter/tweet/search`
  - `/apis/v1/twitter/tweets/search`
  - `/apis/v1/twitter/search/tweets`
  - `/apis/v1/twitter/timeline/search`
- Updated `runAisaTwitterSearch()` to return a structured `success: false` tool result for 404s instead of throwing through the chat stream.

Remaining Phase 4 work:

- Obtain the exact AIsa relay path for X/Twitter search from AIsa support or generated skill source, then update `lib/services/aisa/social.ts`.
- Add richer multi-source social report synthesis that can combine X/Twitter, Reddit, Firecrawl, Jina, and future Exa results into one saved artifact.
- Add Exa social-web fan-out where `EXA_API_KEY` is configured.

### Phase 5: Search Console Onboarding - RAG Foundation Implemented 2026-07-07

- Add Google OAuth/Search Console connection flow.
- Add property matching and onboarding prompt.
- Add snapshot tables and user-specific RAG ingestion.
- Update RAG retrieval to isolate user-specific context.

Feasibility decision:

- This is possible, but requires explicit user OAuth consent for Search Console read access.
- AIsa does not bypass Google Search Console authorization because GSC is private first-party data.

Implementation completed:

- Added `drizzle/0009_social_mode_user_rag.sql`:
  - expands `agent_documents_mode_check` to include `social`
  - adds a Social-mode HNSW index
  - adds indexes for `metadata->>'userId'` user-scoped retrieval
- Updated `lib/rag/ingest.ts` so ingested docs can be tagged with `userId` and Social docs use a Social agent type.
- Updated `lib/chat/seo-aeo-context.ts` to retrieve authenticated user Search Console RAG chunks (`sourceType = 'search_console'`) alongside global mode docs, while labeling them as private first-party context.
- Added `lib/search-console/rag.ts`:
  - normalized Search Console query/page row type
  - compact Markdown snapshot builder
  - `ingestSearchConsoleSnapshot()` helper that stores user-scoped SEO RAG
- Added coverage in `tests/unit/search-console/rag.test.ts`.

Phase 5 server-side connection slice implemented on 2026-07-07:

- Added `lib/search-console/oauth.ts` with the Google Search Console read-only OAuth scope list.
- Added `components/search-console/connect-button.tsx` as a reusable consent trigger that requests Search Console scope without changing normal Google sign-in.
- Added `lib/search-console/client.ts`:
  - verifies the connected Google account has `webmasters.readonly`
  - refreshes expired Google access tokens server-side when a refresh token is available
  - lists Search Console properties
  - queries Search Analytics rows
- Added protected routes:
  - `GET /api/search-console/properties`
  - `POST /api/search-console/snapshot`
- The snapshot route maps Search Analytics rows into the existing user-scoped `search_console` RAG ingestion helper.
- Added focused coverage in `tests/unit/search-console/client.test.ts`.

Phase 5 dashboard wiring implemented on 2026-07-07:

- Added `components/search-console/property-importer.tsx`:
  - loads verified Search Console properties for the signed-in user
  - lets the user pick a property and date range
  - imports the selected snapshot into private SEO RAG
  - keeps reconnect/consent as an explicit user action
- Added the Search Console panel to `app/dashboard/business/page.tsx` without introducing an onboarding gate.

Remaining Phase 5 work:

- Add a route/client action that can explicitly re-request consent if Google does not return a refresh token.
- Decide whether to add dedicated `search_console_connections` and `search_console_snapshots` tables for audit/history beyond the RAG snapshot helper.

### Phase 6: Fortnightly Research Memory - Initial Implementation 2026-07-07

- Add fortnightly cron/Inngest job.
- Replace weekly shallow summaries with deeper source-backed research.
- Add structure-aware chunker, source scoring, dedupe, and recency-aware retrieval.

Implementation completed:

- Added `lib/research/fortnightly-industry.ts`.
- Added `/api/cron/fortnightly-industry-research`.
- Added Vercel cron entry for the 1st and 15th of each month.
- Added Perplexity API fan-out for SEO, GEO/AEO, Content, and Social mode research packets.
- Added Gateway synthesis through the existing research summarizer.
- Added mode-scoped RAG ingestion with `sourceType = 'fortnightly_industry_research'`.
- Added opt-in Markdown-section chunking in `lib/rag/ingest.ts` for retrieval-friendly research chunks.
- Added citation URL deduping and research packet metadata in ingested document metadata/raw JSON.
- Added `drizzle/0010_research_jobs_all_modes.sql` so `research_jobs.mode` accepts `seo`, `geo`, `content`, and `social`.
- Added focused coverage in `tests/unit/research/fortnightly-industry.test.ts`.

Remaining Phase 6 work:

- Fetch and score full cited source pages with Firecrawl/Jina when configured.
- Add URL/title/content hash dedupe before inserting new RAG chunks.
- Add retrieval-time recency/source-tier boosting.
- Consider Inngest or another scheduler if exact rolling 14-day cadence is required instead of twice-monthly Vercel Cron.

### Phase 7: Verification and Cost Controls

- Add tests for tools, normalizers, mode routing, and RAG isolation.
- Add rate limits and monthly cost guardrails by user and provider.
- Add provider telemetry to Langfuse and `api_usage_events`.
- Add fixtures for AIsa response shapes without secrets.

Phase 7 telemetry slice implemented on 2026-07-08:

- Updated `lib/analytics/api-tracker.ts` so external API usage is inserted into `api_usage_events` instead of only logging to console.
- Added `aisa` as a tracked external service.
- Threaded authenticated `userId` into AIsa-backed SEO backlink tools and Social mode X/Twitter tools.
- Added per-platform `api_usage_events` rows for chat `geo_brand_scan` results, including provider cost when DataForSEO returns it.

Remaining Phase 7 work:

- Add explicit monthly spend gates before expensive fan-out calls.
- Add AIsa response fixtures for X/Twitter search after the live endpoint shape is verified.
- Add provider telemetry to Langfuse spans where useful.

## Risks and Open Questions

- AIsa endpoint coverage for social, backlink, SERP, citation data, and DataForSEO AI Optimization probes must be verified; do not assume path names.
- Vercel AI Gateway model-family probes may not perfectly match consumer ChatGPT, Gemini, Claude, or Grok search products. Label them honestly unless the underlying provider/API supports equivalent retrieval.
- Search Console requires user OAuth consent; it cannot be fetched just from a domain.
- Social data terms and rate limits need review before exposing broad scraping/search.
- `agent_documents` is currently global; user-specific Search Console RAG needs schema isolation before ingestion.
- Some code comments/docs still say AI SDK 6; update them during implementation to avoid drift.

## Reference Patterns Adopted

From `AgriciDaniel/codex-seo`:

- Fan-out specialist workflows.
- Deterministic evidence artifacts.
- Separate backlink, GEO, Search Console, Firecrawl, and DataForSEO workflows.
- Reports grounded in tool evidence rather than model-only advice.

From `elmohq/elmo`:

- Prompt tracking per engine.
- Mention/citation/competitor benchmarking.
- Historical runs and share-of-voice style metrics.
- Self-owned visibility data with auditable calculations.

From `ultimate-seo`:

- Data before advice.
- Bulk and batched DataForSEO calls where possible.
- Backlink profile workflow: summary, referring domains, anchors, spam signals, competitor gap.
- GEO workflow: LLM response checks, citation/source analysis, top domains/pages, and content actions.
