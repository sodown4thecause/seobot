---
name: seobot-mode-producer
description: Produce SEO Mode, GEO Mode, or Content Mode intelligence artifacts for SEOBOT using compact MCP facades and AI SDK 6 stream UI contracts.
---

# SEOBOT Mode Producer

## When to Use
- Use this skill to create the primary user-facing artifact after the supervisor has selected a runtime mode.
- Use it for SEO analysis, GEO/AI visibility intelligence, content briefs, content gap outputs, and generative UI-ready data.
- Do not use it for independent approval; send outputs to `seobot-artifact-reviewer`.

## Required Inputs
- `_workspace/01_supervisor_task-brief.md`
- `_workspace/02_mcp_facade-plan.md` when external data or MCP tools are needed
- User audience, site/domain/topic, market, language, and freshness needs
- Artifact contract: stream node type, component mapping, attachment expectations, and persistence target

## Workflow
1. Confirm the runtime mode and restate the artifact contract in the output header.
2. Gather only the data needed for the selected mode through approved facades or existing app services.
3. Produce the artifact in `_workspace/03_producer_artifact.md`.
4. Include evidence blocks with source URLs, provider names, freshness, and confidence.
5. Attach UI node mapping and normalized data shape before any prose recommendations.
6. Send the artifact to the reviewer.

## Mode Production Rules
- `SEO Mode`: prioritize search demand, ranking opportunity, technical blockers, SERP evidence, and measurable traffic impact.
- `GEO Mode`: prioritize AI answer inclusion, citation likelihood, entity clarity, platform-specific evidence, and answer-market positioning.
- `Content Mode`: prioritize user intent, information gain, outline quality, source sufficiency, E-E-A-T signals, and editorial usability.

## AI SDK 6 Stream UI Contract
Every produced artifact must map to one or more standard stream nodes:

- `text`: concise narrative, analysis, explanation, or recommendation rendered by the standard response component.
- `tool-invocation`: facade execution status and normalized result metadata.
- `data`: structured payload for existing generative UI components such as `KeywordMetrics`, `SerpResults`, `DomainAnalytics`, `AIPlatformMetrics`, `AISearchMetrics`, `ContentGapMatrix`, `ContentStrategy`, or `CitationRecommendations`.
- `attachment`: downloadable or persisted assets such as CSV, JSON, markdown brief, image, or report file with `name`, `contentType`, `size`, and `url` or storage id.
- `artifact`: saved library item compatible with `components/chat/artifacts/*` and `lib/artifacts/artifact-store.ts`.

## Outputs
- `_workspace/03_producer_artifact.md`
- Normalized component payload examples for each selected UI node
- Source/evidence ledger
- Known limitations and assumptions

## Validation
- The artifact states its runtime mode.
- Every claim that depends on live data has provenance or is marked as inference.
- Component payloads use existing SEOBOT generative UI names when possible.
- Attachments are declared only when the app can persist or render them through existing artifact/library patterns.
