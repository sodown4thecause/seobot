---
name: seobot-supervisor
description: Coordinate SEOBOT AI SEO/GEO/content intelligence work across runtime modes, MCP facade selection, producer handoffs, and reviewer gates.
---

# SEOBOT Supervisor

## When to Use
- Use this skill for cross-agent planning, routing, and integration in the SEOBOT Next.js app.
- Use it when work touches chat orchestration, mode routing, MCP tool selection, generative UI artifacts, or multiple SEO/GEO/content intelligence surfaces.
- Do not use it as a content writer or low-level MCP endpoint author; delegate those phases to the producer or static-wrapper skill.

## Required Inputs
- User request and target runtime mode: `seo`, `geo`, or `content`.
- Relevant repo surface: `app/api/chat/route.ts`, `lib/chat/*`, `lib/agents/*`, `lib/mcp/*`, `components/chat/generative-ui/*`, and `components/chat/artifacts/*`.
- Desired artifact type, audience, and persistence requirements.
- Any endpoint/provider constraints, such as DataForSEO, Jina, Firecrawl, Perplexity, RAG, or generated AI SDK tools.

## Workflow
1. Classify the request into one primary runtime mode.
2. Create `_workspace/01_supervisor_task-brief.md` with objective, mode, candidate facade tools, expected stream UI nodes, and acceptance criteria.
3. If endpoint scope is broad, invoke the static wrapper architect to choose facade tools instead of loading raw endpoint schemas into the active prompt.
4. Assign production to `seobot-mode-producer` with the task brief and the artifact contract.
5. Assign review to `seobot-artifact-reviewer` with the original request, producer output, and artifact contract.
6. Allow at most two producer revision loops. Escalate to the user only when mode intent, source authority, or product behavior cannot be inferred safely.
7. Write `_workspace/04_supervisor_integration-report.md` with final files, verification, residual risks, and follow-up work.

## Runtime Modes
- `SEO Mode`: search ranking, keyword intelligence, SERP analysis, technical audit, on-page optimization, schema, links, and traffic opportunity work.
- `GEO Mode`: generative engine optimization, AI answer visibility, brand/entity inclusion, citation surfaces, model/platform metrics, and answer-market comparison.
- `Content Mode`: briefs, outlines, drafts, rewrite plans, content gap analysis, editorial QA, E-E-A-T, content refreshes, and reusable content intelligence.

## Handoff Outputs
- `_workspace/01_supervisor_task-brief.md`
- `_workspace/02_mcp_facade-plan.md` when endpoint routing matters
- `_workspace/03_producer_artifact.md`
- `_workspace/03_reviewer_findings.md`
- `_workspace/04_supervisor_integration-report.md`

## Validation
- The selected mode is explicit and only one mode owns the primary artifact.
- The active prompt never receives a dump of 100+ MCP endpoint schemas.
- The producer output declares its AI SDK 6 stream UI node mapping before implementation or delivery.
- The reviewer can return only `pass`, `fix`, or `redo`.
- Repo references use existing SEOBOT paths and wrappers, especially `lib/mcp/*` rather than generated bindings directly.
