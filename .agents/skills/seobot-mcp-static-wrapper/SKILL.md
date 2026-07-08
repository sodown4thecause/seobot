---
name: seobot-mcp-static-wrapper
description: Design SEOBOT static MCP facade wrappers that expose compact mode-aware tools while keeping 100+ endpoint schemas out of model context.
---

# SEOBOT MCP Static Wrapper

## When to Use
- Use this skill when a task requires MCP endpoint selection, generated MCP bindings, or provider expansion.
- Use it when 100+ DataForSEO, Jina, Firecrawl, Reddit, Supadata, or related endpoints could cause context bloat.
- Do not use it to directly generate user-facing content; produce a facade plan for the supervisor or producer.

## Required Inputs
- Target runtime mode: `seo`, `geo`, or `content`.
- Existing wrapper paths under `lib/mcp/*`.
- Candidate provider families and endpoint categories.
- Desired output node contracts for the chat stream or artifact layer.

## Static Wrapper Pattern
Use a three-layer wrapper:

1. Static endpoint catalog: a checked-in manifest or typed constant that stores provider, endpoint id, capability tags, required inputs, output shape, cost/rate hints, and freshness policy. This catalog is read by code, not pasted into prompts.
2. Mode facade tools: a small model-facing set of tools, normally fewer than twelve, such as `researchKeywordUniverse`, `inspectSerp`, `measureAiVisibility`, `buildContentGapMatrix`, and `fetchCitationCandidates`.
3. Endpoint executors: provider-specific wrappers in `lib/mcp/{provider}/` that handle auth, caching, retries, validation, logging, and response normalization.

## Facade Rules
- Never expose raw generated endpoint lists to the model.
- Prefer one facade per user intent, not one facade per vendor endpoint.
- Keep facade input schemas semantic and stable; translate to provider payloads behind the wrapper.
- Return normalized, UI-ready data with provenance, freshness, and provider metadata.
- Route by mode first, then intent, then provider availability.

## Mode Facade Inventory
- `SEO Mode`: keyword universe, SERP inspection, rank/traffic estimate, on-page crawl summary, backlink prospect summary, schema opportunity, competitor overlap.
- `GEO Mode`: AI visibility snapshot, citation opportunity, platform mention comparison, answer gap analysis, entity clarity audit, prompt-set evaluation.
- `Content Mode`: content gap matrix, outline brief, topical authority map, content quality audit, freshness refresh plan, source pack.

## Outputs
- `_workspace/02_mcp_facade-plan.md` with selected facades, excluded endpoints, provider fallback order, and data contracts.
- Optional implementation notes for `lib/mcp/static-catalog.ts`, `lib/chat/tool-assembler.ts`, or `lib/agents/tools.ts`.

## Validation
- The facade plan names no more than twelve active model-facing tools for a run.
- Each facade lists its underlying endpoint families without copying large schemas.
- The plan preserves existing anti-pattern rules: never import generated `mcps/` bindings directly and never hardcode secrets.
- Normalized outputs include `source`, `provider`, `freshness`, `confidence`, and `rawRef` or equivalent trace metadata.
