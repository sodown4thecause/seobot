---
name: seobot-artifact-reviewer
description: Review SEOBOT SEO/GEO/content intelligence artifacts for mode fit, evidence quality, static-wrapper compliance, and AI SDK 6 UI node contracts.
---

# SEOBOT Artifact Reviewer

## When to Use
- Use this skill after `seobot-mode-producer` creates an artifact.
- Use it for quality gates before chat stream payloads, report artifacts, content intelligence, or MCP-driven analysis ship to users.
- Do not use it to rewrite the artifact unless the supervisor requests a bounded revision.

## Required Inputs
- Original user request
- `_workspace/01_supervisor_task-brief.md`
- `_workspace/02_mcp_facade-plan.md` when relevant
- `_workspace/03_producer_artifact.md`
- Applicable runtime mode and artifact contract

## Review Workflow
1. Check runtime mode fit: SEO, GEO, or Content must be explicit and internally consistent.
2. Check MCP containment: facade tools should be compact, static-wrapper-compliant, and free of raw 100+ endpoint prompt dumps.
3. Check evidence: live-data claims require source/provider/freshness; unsupported claims must be marked as assumptions.
4. Check UI contract: stream nodes must map to standard AI SDK 6 parts and existing SEOBOT components or attachments.
5. Check user value: recommendations must be specific, prioritized, and suitable for the user's requested audience.
6. Write `_workspace/03_reviewer_findings.md` with status `pass`, `fix`, or `redo`.

## Review Statuses
- `pass`: ready to integrate; only minor non-blocking notes remain.
- `fix`: targeted corrections are needed; producer should revise the existing artifact.
- `redo`: mode, evidence, endpoint use, or UI contract is directionally wrong; supervisor should regenerate the artifact from the brief.

## Blocking Criteria
- Runtime mode is missing or mixed without explanation.
- Raw MCP endpoint schemas or generated bindings are exposed directly to the model-facing layer.
- Artifact lacks an AI SDK 6 stream UI node mapping.
- Structured data cannot be rendered by the named component or attachment path.
- Recommendations rely on unverifiable live data without provenance.

## Outputs
- `_workspace/03_reviewer_findings.md`
- Optional targeted patch list for producer revision
- Final approval note for `_workspace/04_supervisor_integration-report.md`

## Validation
- Findings cite the exact section or payload field they evaluate.
- Status is one of `pass`, `fix`, or `redo`.
- The reviewer does not introduce new scope unless it is required to satisfy the original contract.
