# FlowIntent Production Readiness Audit

## Scope and evidence date

This evidence snapshot covers `origin/main`, requested open PRs #83, #82, #81, #79, #78, #76, #75, and #74, and the merged baseline represented by PRs #80, #77, and #72. Evidence was captured on 2026-07-12 in the isolated `codex/production-readiness-pr-reconciliation` worktree. The main checkout was not modified. Secrets, credentials, review bodies, and private comment text are intentionally excluded.

## Verified baseline

- `origin/main` = `8251e5e` (`Add AIsa SEO GEO and social integrations (#80)`).
- The immediately preceding merged product baseline is `7e3e7a7` (`Workspace, artifact registry, GEO Elmo integration, and docs sync (#77)`); PR #72 is represented in main history by merge commit `2acd730`.
- The isolated branch is `codex/production-readiness-pr-reconciliation`, at `22aa793` before this fix commit.
- `origin/pr-83`, `origin/pr-82`, `origin/pr-81`, `origin/pr-79`, `origin/pr-78`, `origin/pr-76`, `origin/pr-75`, and `origin/pr-74` were fetched successfully.
- Verified runtime/package baseline from the isolated checkout: pnpm `11.5.0` (`packageManager: pnpm@11.5.0`), frozen lockfile (validated with `pnpm install --frozen-lockfile --lockfile-only`, using `pnpm-lock.yaml` lockfileVersion `9.0`), Node `>=22` (package engine; runtime observed as `v24.14.0`), Next `16.0.10`, React `19.2.3`, and `ai` `^7.0.15`.
- All eight requested PRs are open. Connector metadata reports `mergeable: false` for each; this is recorded as connector metadata, not as an independently reproduced merge result.
- The connector exposed PR metadata, changed filenames, reviews, and review threads. It did not expose a reliable CI/check-state field in the returned PR metadata. Therefore check state is explicitly unavailable below; no green/red conclusion is inferred.

## Subsystem status

| Subsystem | Status | Evidence | Risk / next action |
|---|---|---|---|
| SEO, GEO/AEO, and Content mode alignment | Implemented | Merged PR #77; PR #76 is an older open implementation branch with the same mode, routing, copy, and deployment areas. | Reconcile only valuable deltas from #76; do not merge the stale branch wholesale. |
| Workspace and artifact flow | Implemented | Merged PR #77; current main contains workspace/artifact-related files. | Validate production behavior separately; this task captures repository evidence only. |
| AIsa SEO/GEO/social integrations | Implemented | Current `origin/main` commit #80. | Preserve #80 as the baseline when evaluating all older branches. |
| Better Auth dashboard access | Implemented | PR #72 is merged in main history; PR #75 is an older open follow-up affecting dashboard access and admin allowlisting. | Compare #75 against current main before selecting any small unique change. |
| Profile RAG and user-scoped vector retrieval | Documented but missing | PR #83 uniquely adds `lib/onboarding/profile-rag.ts` and changes `lib/db/vector-search.ts`; these files are not part of the current main baseline. | Review data ownership, cleanup, migrations, and tests before production use. |
| Harness contracts and team specification | Documented but missing | PR #83 uniquely adds `lib/chat/harness-contracts.ts`, its unit test, and `docs/harness/team-spec.md`. | Treat as a candidate import, not as production wiring. |
| Repository CI workflow | Documented but missing | PR #83 adds `.github/workflows/ci.yml`; it is not in the verified main baseline. | Inspect workflow permissions, dependency manager, and required secrets before adoption. |
| Observability hardening from #81/#79 | Partially implemented | #81/#79 contain Sentry, Langfuse, usage, and analytics changes, but both are based on pre-#77 main and overlap current files. | Extract current-baseline-compatible fixes only; verify runtime configuration and tests. |
| GEO companion/deployment stack | Partially implemented | Current main includes the merged #77 GEO foundation; #82 carries a large cleanup/redeployment surface with unresolved review threads. | Reconcile migrations and deployment scripts independently before shipping. |
| Production test/check evidence | Used but untested | PR descriptions and connector reviews contain historical claims, but no current connector check-state field was available and no application test suite was required for this evidence-capture task. | Later tasks must run current typecheck, focused tests, build, and deployment checks. |

## Pull-request evidence ledger

The table below records connector-backed metadata. `changed files`, additions/deletions, commit count, review count, and review dates are connector fields; the exact changed-file inventories immediately below are regenerated locally from the fetched refs. All requested PRs were reported open and `mergeable=false`. The connector did not return a reliable CI/check-state field, so that field remains unavailable rather than inferred.

| PR | Exact title | Branch | Head SHA | Base SHA | State | Changed files | Additions / deletions | Commits | Reviews | Review dates (UTC) | Check-state limitation |
|---|---|---|---|---|---|---:|---:|---:|---:|---|---|
| #83 | chore: rescue agent skills library (190 files), planning docs, and unique modules from orphaned worktree | `rescue/mtjz-skills-and-planning` | `179e4656747542cd517d6bcf969384ffb7282a31` | `7e3e7a78102c9e2240518e06f7d1067d21cb06ed` | open | 206 | +34420 / -27 | 2 | 9 | 2026-07-08T03:16:01Z, 2026-07-08T03:18:06Z, 2026-07-08T03:20:03Z, 2026-07-09T13:08:34Z, 2026-07-09T13:10:03Z, 2026-07-09T13:10:30Z, 2026-07-09T13:10:31Z, 2026-07-09T13:10:32Z, 2026-07-09T13:11:09Z | Connector: mergeable=false; CI/check state unavailable |
| #82 | chore: repo cleanup - doc reorganization, asset moves, AGENTS.md reference files | `badlands-rattler` | `eb258c1d992bf562c4a90b4db4a97d32ad5d8351` | `7e3e7a78102c9e2240518e06f7d1067d21cb06ed` | open | 177 | +12925 / -1215 | 11 | 11 | 2026-07-08T03:14:02Z, 2026-07-08T03:16:04Z, 2026-07-08T03:17:28Z, 2026-07-08T03:30:02Z, 2026-07-09T14:17:50Z, 2026-07-09T14:21:37Z, 2026-07-09T14:21:37Z, 2026-07-09T14:21:38Z, 2026-07-09T14:21:39Z, 2026-07-09T14:25:53Z, 2026-07-09T14:30:48Z | Connector: mergeable=false; CI/check state unavailable |
| #81 | feat: post-#77 cleanup, pnpm migration, Magic UI landing redesign | `feat/platform-modes-workspace-docs-sync` | `77b327ace5eeabb527b186655665d660f8d8d72d` | `7e3e7a78102c9e2240518e06f7d1067d21cb06ed` | open | 154 | +23778 / -42046 | 23 | 11 | 2026-07-08T03:12:55Z, 2026-07-08T03:14:56Z, 2026-07-08T03:20:16Z, 2026-07-08T03:22:41Z, 2026-07-08T03:24:26Z, 2026-07-08T03:25:40Z, 2026-07-09T14:28:41Z, 2026-07-09T14:31:39Z, 2026-07-09T14:31:40Z, 2026-07-09T14:33:55Z, 2026-07-09T14:37:26Z | Connector: mergeable=false; CI/check state unavailable |
| #79 | feat: complete pnpm, Magic UI, landing, and chat polish plan | `feat/phase-3b-chat-polish` | `0f1f9f7faa15f78820f603c41d0448a2a45f8c71` | `7e3e7a78102c9e2240518e06f7d1067d21cb06ed` | open | 160 | +23895 / -42098 | 24 | 18 | 2026-07-07T12:42:33Z, 2026-07-07T12:52:00Z, 2026-07-07T12:52:49Z, 2026-07-07T13:03:35Z, 2026-07-09T14:51:15Z, 2026-07-09T14:53:17Z, 2026-07-09T14:53:18Z, 2026-07-09T14:53:32Z, 2026-07-09T14:53:35Z, 2026-07-09T14:53:38Z, 2026-07-09T14:53:41Z, 2026-07-09T14:53:44Z, 2026-07-09T14:53:47Z, 2026-07-09T14:53:52Z, 2026-07-09T14:53:53Z, 2026-07-09T14:56:41Z, 2026-07-09T14:58:54Z, 2026-07-09T14:59:23Z | Connector: mergeable=false; CI/check state unavailable |
| #78 | Cursor-style UI, AGENTS.md architecture docs, repo cleanup, and chatbot UX fixes | `cursor/chatbot-test-cursor-ui-67cb` | `0c672807cc29a6f708a2f71e81ec65eba1e03e60` | `7e3e7a78102c9e2240518e06f7d1067d21cb06ed` | open | 99 | +1765 / -1045 | 6 | 4 | 2026-07-06T09:35:47Z, 2026-07-09T15:03:53Z, 2026-07-10T03:31:02Z, 2026-07-10T03:38:07Z | Connector: mergeable=false; CI/check state unavailable |
| #76 | Align SEO, GEO/AEO, and Content modes across landing and dashboard | `cursor/platform-modes-alignment-e7f8` | `b31250b62e210f6e8c35ce64ccb53d5eba44dacd` | `610cf736c357fe4ac3c370a823c77f49c8a9c833` | open | 32 | +1581 / -1123 | 8 | 21 | 2026-07-04T04:26:57Z, 2026-07-04T04:28:45Z, 2026-07-04T04:31:52Z, 2026-07-04T04:35:11Z, 2026-07-04T04:55:56Z, 2026-07-04T04:57:46Z, 2026-07-04T04:57:48Z, 2026-07-04T04:57:49Z, 2026-07-04T04:59:28Z, 2026-07-04T05:02:40Z, 2026-07-04T05:04:30Z, 2026-07-04T05:49:03Z, 2026-07-04T05:50:49Z, 2026-07-04T05:50:51Z, 2026-07-04T05:50:52Z, 2026-07-04T05:51:20Z, 2026-07-04T05:53:37Z, 2026-07-04T05:55:04Z, 2026-07-09T15:09:15Z, 2026-07-09T15:11:23Z, 2026-07-09T15:11:59Z | Connector: mergeable=false; CI/check state unavailable |
| #75 | fix(auth): stop bouncing signed-in users from dashboard to Polar checkout | `fix/google-login-dashboard-access` | `50c464b5a48584da8ac38fe73df4070a8473f158` | `610cf736c357fe4ac3c370a823c77f49c8a9c833` | open | 3 | +8 / -6 | 2 | 6 | 2026-07-04T02:41:52Z, 2026-07-04T02:43:09Z, 2026-07-04T02:44:25Z, 2026-07-04T02:47:30Z, 2026-07-04T02:51:26Z, 2026-07-04T02:57:01Z | Connector: mergeable=false; CI/check state unavailable |
| #74 | docs(agents): document Cursor Cloud dev environment setup | `cursor/setup-dev-environment-e0f1` | `d9f612e2c5bf659f55a3aa540eb1623c24136c6e` | `610cf736c357fe4ac3c370a823c77f49c8a9c833` | open | 1 | +49 / -0 | 2 | 3 | 2026-07-10T03:30:59Z, 2026-07-10T03:32:58Z, 2026-07-10T03:33:06Z | Connector: mergeable=false; CI/check state unavailable |

## Per-PR changed-file inventories

Each block is the direct output of `git diff --name-status origin/main...origin/pr-N` in this worktree. Status letters are Git's `A`, `M`, `D`, and rename/copy forms; this preserves the evidence needed to audit overlap and adds/modifications/deletions.

<details><summary>PR #83: 206 changed files</summary>

```text
A	.agents/skills/ai-sdk/SKILL.md
A	.agents/skills/ai-sdk/references/ai-gateway.md
A	.agents/skills/ai-sdk/references/common-errors.md
A	.agents/skills/ai-seo/SKILL.md
A	.agents/skills/ai-seo/references/content-patterns.md
A	.agents/skills/ai-seo/references/platform-ranking-factors.md
A	.agents/skills/better-auth-best-practices/SKILL.md
A	.agents/skills/better-auth-security-best-practices/SKILL.md
A	.agents/skills/competitor-alternatives/SKILL.md
A	.agents/skills/competitor-alternatives/references/content-architecture.md
A	.agents/skills/competitor-alternatives/references/templates.md
A	.agents/skills/content-experimentation-best-practices/SKILL.md
A	.agents/skills/content-experimentation-best-practices/resources/cms-integration.md
A	.agents/skills/content-experimentation-best-practices/resources/common-pitfalls.md
A	.agents/skills/content-experimentation-best-practices/resources/experiment-design.md
A	.agents/skills/content-experimentation-best-practices/resources/statistical-foundations.md
A	.agents/skills/content-modeling-best-practices/SKILL.md
A	.agents/skills/content-modeling-best-practices/resources/content-reuse.md
A	.agents/skills/content-modeling-best-practices/resources/reference-vs-embedding.md
A	.agents/skills/content-modeling-best-practices/resources/separation-of-concerns.md
A	.agents/skills/content-modeling-best-practices/resources/taxonomy-classification.md
A	.agents/skills/content-strategy/SKILL.md
A	.agents/skills/copy-editing/SKILL.md
A	.agents/skills/copy-editing/references/plain-english-alternatives.md
A	.agents/skills/copywriting/SKILL.md
A	.agents/skills/copywriting/references/copy-frameworks.md
A	.agents/skills/copywriting/references/natural-transitions.md
A	.agents/skills/create-auth-skill/SKILL.md
A	.agents/skills/create-promo-video/SKILL.md
A	.agents/skills/create-promo-video/references/REMOTION-TIPS.md
A	.agents/skills/dataforseo-ai-optimization-api/SKILL.md
A	.agents/skills/dataforseo-ai-optimization-api/references/REFERENCE.md
A	.agents/skills/dataforseo-app-data-api/SKILL.md
A	.agents/skills/dataforseo-app-data-api/references/REFERENCE.md
A	.agents/skills/dataforseo-backlinks-api/SKILL.md
A	.agents/skills/dataforseo-backlinks-api/references/REFERENCE.md
A	.agents/skills/dataforseo-business-data-api/SKILL.md
A	.agents/skills/dataforseo-business-data-api/references/REFERENCE.md
A	.agents/skills/dataforseo-content-analysis-api/SKILL.md
A	.agents/skills/dataforseo-content-analysis-api/references/REFERENCE.md
A	.agents/skills/dataforseo-content-generation-api/SKILL.md
A	.agents/skills/dataforseo-content-generation-api/references/REFERENCE.md
A	.agents/skills/dataforseo-domain-analytics-api/SKILL.md
A	.agents/skills/dataforseo-domain-analytics-api/references/REFERENCE.md
A	.agents/skills/dataforseo-keywords-data-api/SKILL.md
A	.agents/skills/dataforseo-keywords-data-api/references/REFERENCE.md
A	.agents/skills/dataforseo-labs-api/SKILL.md
A	.agents/skills/dataforseo-labs-api/references/REFERENCE.md
A	.agents/skills/dataforseo-merchant-api/SKILL.md
A	.agents/skills/dataforseo-merchant-api/references/REFERENCE.md
A	.agents/skills/dataforseo-onpage-api/SKILL.md
A	.agents/skills/dataforseo-onpage-api/references/REFERENCE.md
A	.agents/skills/dataforseo-serp-api/SKILL.md
A	.agents/skills/dataforseo-serp-api/references/REFERENCE.md
A	.agents/skills/e2e-testing-patterns/SKILL.md
A	.agents/skills/e2e-testing-patterns/resources/implementation-playbook.md
A	.agents/skills/email-and-password-best-practices/SKILL.md
A	.agents/skills/free-tool-strategy/SKILL.md
A	.agents/skills/free-tool-strategy/references/tool-types.md
A	.agents/skills/internal-linking-optimizer/SKILL.md
A	.agents/skills/internal-linking-optimizer/references/link-architecture-patterns.md
A	.agents/skills/launch-strategy/SKILL.md
A	.agents/skills/managing-tech-debt/SKILL.md
A	.agents/skills/managing-tech-debt/references/guest-insights.md
A	.agents/skills/marketing-ideas/SKILL.md
A	.agents/skills/marketing-ideas/references/ideas-by-category.md
A	.agents/skills/marketing-psychology/SKILL.md
A	.agents/skills/organization-best-practices/SKILL.md
A	.agents/skills/product-marketing-context/SKILL.md
A	.agents/skills/programmatic-seo/SKILL.md
A	.agents/skills/programmatic-seo/references/playbooks.md
A	.agents/skills/remotion/README.md
A	.agents/skills/remotion/SKILL.md
A	.agents/skills/remotion/examples/WalkthroughComposition.tsx
A	.agents/skills/remotion/examples/screens.json
A	.agents/skills/remotion/resources/composition-checklist.md
A	.agents/skills/remotion/resources/screen-slide-template.tsx
A	.agents/skills/remotion/scripts/download-stitch-asset.sh
A	.agents/skills/repo-cleanup/SKILL.md
A	.agents/skills/repo-cleanup/references/archive-sprint.md
A	.agents/skills/repo-cleanup/references/code-cleanup.md
A	.agents/skills/repo-cleanup/references/deps-cleanup.md
A	.agents/skills/repo-cleanup/references/docs-cleanup.md
A	.agents/skills/repo-cleanup/references/test-cleanup.md
A	.agents/skills/sanity-best-practices/SKILL.md
A	.agents/skills/sanity-best-practices/references/angular.md
A	.agents/skills/sanity-best-practices/references/app-sdk.md
A	.agents/skills/sanity-best-practices/references/astro.md
A	.agents/skills/sanity-best-practices/references/blueprints.md
A	.agents/skills/sanity-best-practices/references/get-started.md
A	.agents/skills/sanity-best-practices/references/groq.md
A	.agents/skills/sanity-best-practices/references/hydrogen.md
A	.agents/skills/sanity-best-practices/references/image.md
A	.agents/skills/sanity-best-practices/references/localization.md
A	.agents/skills/sanity-best-practices/references/migration-html-import.md
A	.agents/skills/sanity-best-practices/references/migration.md
A	.agents/skills/sanity-best-practices/references/nextjs.md
A	.agents/skills/sanity-best-practices/references/nuxt.md
A	.agents/skills/sanity-best-practices/references/page-builder.md
A	.agents/skills/sanity-best-practices/references/portable-text.md
A	.agents/skills/sanity-best-practices/references/project-structure.md
A	.agents/skills/sanity-best-practices/references/remix.md
A	.agents/skills/sanity-best-practices/references/schema.md
A	.agents/skills/sanity-best-practices/references/seo.md
A	.agents/skills/sanity-best-practices/references/studio-structure.md
A	.agents/skills/sanity-best-practices/references/svelte.md
A	.agents/skills/sanity-best-practices/references/typegen.md
A	.agents/skills/sanity-best-practices/references/visual-editing.md
A	.agents/skills/schema-markup/SKILL.md
A	.agents/skills/schema-markup/references/schema-examples.md
A	.agents/skills/seo-aeo-best-practices/SKILL.md
A	.agents/skills/seo-aeo-best-practices/resources/aeo-considerations.md
A	.agents/skills/seo-aeo-best-practices/resources/eeat-principles.md
A	.agents/skills/seo-aeo-best-practices/resources/structured-data.md
A	.agents/skills/seo-aeo-best-practices/resources/technical-seo.md
A	.agents/skills/seo-audit/SKILL.md
A	.agents/skills/seo-audit/evals/evals.json
A	.agents/skills/seo-audit/references/ai-writing-detection.md
A	.agents/skills/seobot-artifact-reviewer/SKILL.md
A	.agents/skills/seobot-mcp-static-wrapper/SKILL.md
A	.agents/skills/seobot-mode-producer/SKILL.md
A	.agents/skills/seobot-supervisor/SKILL.md
A	.agents/skills/site-architecture/SKILL.md
A	.agents/skills/site-architecture/references/mermaid-templates.md
A	.agents/skills/site-architecture/references/navigation-patterns.md
A	.agents/skills/site-architecture/references/site-type-templates.md
A	.agents/skills/social-content/SKILL.md
A	.agents/skills/social-content/references/platforms.md
A	.agents/skills/social-content/references/post-templates.md
A	.agents/skills/social-content/references/reverse-engineering.md
A	.agents/skills/two-factor-authentication-best-practices/SKILL.md
A	.agents/skills/vercel-react-best-practices/AGENTS.md
A	.agents/skills/vercel-react-best-practices/SKILL.md
A	.agents/skills/vercel-react-best-practices/rules/advanced-event-handler-refs.md
A	.agents/skills/vercel-react-best-practices/rules/advanced-init-once.md
A	.agents/skills/vercel-react-best-practices/rules/advanced-use-latest.md
A	.agents/skills/vercel-react-best-practices/rules/async-api-routes.md
A	.agents/skills/vercel-react-best-practices/rules/async-defer-await.md
A	.agents/skills/vercel-react-best-practices/rules/async-dependencies.md
A	.agents/skills/vercel-react-best-practices/rules/async-parallel.md
A	.agents/skills/vercel-react-best-practices/rules/async-suspense-boundaries.md
A	.agents/skills/vercel-react-best-practices/rules/bundle-barrel-imports.md
A	.agents/skills/vercel-react-best-practices/rules/bundle-conditional.md
A	.agents/skills/vercel-react-best-practices/rules/bundle-defer-third-party.md
A	.agents/skills/vercel-react-best-practices/rules/bundle-dynamic-imports.md
A	.agents/skills/vercel-react-best-practices/rules/bundle-preload.md
A	.agents/skills/vercel-react-best-practices/rules/client-event-listeners.md
A	.agents/skills/vercel-react-best-practices/rules/client-localstorage-schema.md
A	.agents/skills/vercel-react-best-practices/rules/client-passive-event-listeners.md
A	.agents/skills/vercel-react-best-practices/rules/client-swr-dedup.md
A	.agents/skills/vercel-react-best-practices/rules/js-batch-dom-css.md
A	.agents/skills/vercel-react-best-practices/rules/js-cache-function-results.md
A	.agents/skills/vercel-react-best-practices/rules/js-cache-property-access.md
A	.agents/skills/vercel-react-best-practices/rules/js-cache-storage.md
A	.agents/skills/vercel-react-best-practices/rules/js-combine-iterations.md
A	.agents/skills/vercel-react-best-practices/rules/js-early-exit.md
A	.agents/skills/vercel-react-best-practices/rules/js-hoist-regexp.md
A	.agents/skills/vercel-react-best-practices/rules/js-index-maps.md
A	.agents/skills/vercel-react-best-practices/rules/js-length-check-first.md
A	.agents/skills/vercel-react-best-practices/rules/js-min-max-loop.md
A	.agents/skills/vercel-react-best-practices/rules/js-set-map-lookups.md
A	.agents/skills/vercel-react-best-practices/rules/js-tosorted-immutable.md
A	.agents/skills/vercel-react-best-practices/rules/rendering-activity.md
A	.agents/skills/vercel-react-best-practices/rules/rendering-animate-svg-wrapper.md
A	.agents/skills/vercel-react-best-practices/rules/rendering-conditional-render.md
A	.agents/skills/vercel-react-best-practices/rules/rendering-content-visibility.md
A	.agents/skills/vercel-react-best-practices/rules/rendering-hoist-jsx.md
A	.agents/skills/vercel-react-best-practices/rules/rendering-hydration-no-flicker.md
A	.agents/skills/vercel-react-best-practices/rules/rendering-hydration-suppress-warning.md
A	.agents/skills/vercel-react-best-practices/rules/rendering-svg-precision.md
A	.agents/skills/vercel-react-best-practices/rules/rendering-usetransition-loading.md
A	.agents/skills/vercel-react-best-practices/rules/rerender-defer-reads.md
A	.agents/skills/vercel-react-best-practices/rules/rerender-dependencies.md
A	.agents/skills/vercel-react-best-practices/rules/rerender-derived-state-no-effect.md
A	.agents/skills/vercel-react-best-practices/rules/rerender-derived-state.md
A	.agents/skills/vercel-react-best-practices/rules/rerender-functional-setstate.md
A	.agents/skills/vercel-react-best-practices/rules/rerender-lazy-state-init.md
A	.agents/skills/vercel-react-best-practices/rules/rerender-memo-with-default-value.md
A	.agents/skills/vercel-react-best-practices/rules/rerender-memo.md
A	.agents/skills/vercel-react-best-practices/rules/rerender-move-effect-to-event.md
A	.agents/skills/vercel-react-best-practices/rules/rerender-simple-expression-in-memo.md
A	.agents/skills/vercel-react-best-practices/rules/rerender-transitions.md
A	.agents/skills/vercel-react-best-practices/rules/rerender-use-ref-transient-values.md
A	.agents/skills/vercel-react-best-practices/rules/server-after-nonblocking.md
A	.agents/skills/vercel-react-best-practices/rules/server-auth-actions.md
A	.agents/skills/vercel-react-best-practices/rules/server-cache-lru.md
A	.agents/skills/vercel-react-best-practices/rules/server-cache-react.md
A	.agents/skills/vercel-react-best-practices/rules/server-dedup-props.md
A	.agents/skills/vercel-react-best-practices/rules/server-parallel-fetching.md
A	.agents/skills/vercel-react-best-practices/rules/server-serialization.md
A	.github/workflows/ci.yml
M	.gitignore
A	.pi/npm/.gitignore
A	.pi/settings.json
M	.planning/STATE.md
M	.planning/codebase/ARCHITECTURE.md
M	.planning/codebase/CONVENTIONS.md
M	.planning/codebase/INTEGRATIONS.md
M	.planning/codebase/STACK.md
M	.planning/codebase/STRUCTURE.md
M	.planning/codebase/TESTING.md
A	docs/harness/team-spec.md
A	lib/chat/harness-contracts.ts
M	lib/db/vector-search.ts
A	lib/onboarding/profile-rag.ts
A	tests/unit/chat/harness-contracts.test.ts
```

</details>
<details><summary>PR #82: 177 changed files</summary>

```text
M	.env.example
A	.github/AGENTS.md
M	.gitignore
M	AGENTS.md
D	GEMINI.md
M	README.md
M	app/AGENTS.md
M	app/api/auth/[...all]/route.ts
M	app/api/chat/route.ts
M	app/api/content-zone/brief/route.ts
M	app/api/conversations/route.ts
A	app/api/geo/digest/[date]/route.ts
A	app/api/geo/digest/latest/route.ts
A	app/api/geo/health/route.ts
A	app/api/geo/trends/route.ts
A	app/api/library/route.ts
M	app/api/library/save/route.ts
M	app/case-studies/[slug]/page.tsx
M	app/case-studies/page.tsx
M	app/dashboard/aeo/page.tsx
M	app/dashboard/client-layout.tsx
M	app/dashboard/content-zone/page.tsx
M	app/dashboard/content/zone/page.tsx
A	app/dashboard/workspace/page.tsx
M	app/login/[[...rest]]/page.tsx
M	app/page.tsx
M	app/sign-in/[[...sign-in]]/page.tsx
D	build-output.txt
M	components/AGENTS.md
A	components/artifacts/artifact-panel.tsx
A	components/artifacts/artifact-renderer.tsx
A	components/artifacts/save-to-workspace-button.tsx
M	components/auth/GoogleAuthButton.tsx
M	components/auth/LoginForm.tsx
M	components/chat/ai-chat-interface.tsx
M	components/chat/chat-mode-context.tsx
M	components/chat/chat-mode-selector.tsx
A	components/chat/dashboard-chat-mode-sync.tsx
A	components/chat/generative-ui/registry.tsx
M	components/chat/generative-ui/save-to-library-button.tsx
M	components/chat/modern-chat.tsx
A	components/chat/tool-ui/crawlability-audit-result.tsx
A	components/chat/tool-ui/geo-brand-scan-results.tsx
A	components/chat/tool-ui/geo-fix-plan-result.tsx
A	components/chat/tool-ui/schema-markup-result.tsx
M	components/dashboard/sidebar.tsx
M	components/landing/landing-faq-section.tsx
M	components/landing/landing-page-client.tsx
A	components/landing/mode-skill-picker.tsx
M	components/providers/agent-provider.tsx
A	components/workspace/artifact-preview-card.tsx
A	components/workspace/workspace-browser.tsx
A	content/AGENTS.md
A	docs/AGENTS.md
R100	SEO_AEO Chatbot Insights Research.md	docs/SEO_AEO Chatbot Insights Research.md
A	docs/architecture/geo-elmo-cloakbrowser-azure.md
A	docs/deployment/geomode-vultr.md
R100	feature-guide.md	docs/feature-guide.md
M	docs/geo-mode.md
R100	nextphase.md	docs/nextphase.md
A	docs/specs/2026-06-12-geomode-geo-tracking-design.md
A	docs/specs/geo-seo-content-engine-prd.md
A	docs/specs/platform-modes-alignment.md
A	docs/specs/platform-modes.md
A	drizzle/0007_geo_tracking.sql
A	drizzle/0008_elmo_brand_id.sql
A	drizzle/AGENTS.md
A	hooks/AGENTS.md
M	lib/AGENTS.md
M	lib/agents/agent-router.ts
M	lib/analytics/success-metrics.ts
M	lib/artifacts/artifact-store.ts
A	lib/artifacts/build-save-payload.ts
A	lib/artifacts/preview.ts
A	lib/artifacts/registry.ts
A	lib/artifacts/sync-from-messages.ts
A	lib/artifacts/types.ts
M	lib/auth-config.ts
M	lib/auth/admin.ts
A	lib/auth/errors.ts
A	lib/case-studies.ts
A	lib/chat/conversation-mode.ts
A	lib/chat/data-part-normalizers.ts
A	lib/chat/generative-ui-types.ts
M	lib/chat/index.ts
M	lib/chat/intent-classifier.ts
M	lib/chat/message-handler.ts
A	lib/chat/mode-skills.ts
M	lib/chat/modes.ts
M	lib/chat/persistence.ts
M	lib/chat/storage.ts
M	lib/chat/stream-builder.ts
M	lib/chat/tool-assembler.ts
A	lib/chat/ui-message-types.ts
M	lib/config/env.ts
M	lib/db/schema.ts
M	lib/faq.ts
M	lib/geo/adapters.ts
M	lib/geo/brand-tracker.ts
A	lib/geo/crawlability-audit.ts
A	lib/geo/digest-service.ts
A	lib/geo/digest-store.ts
A	lib/geo/digest-tool.ts
A	lib/geo/digest-types.ts
A	lib/geo/elmo-client.ts
A	lib/geo/elmo-provisioning.ts
A	lib/geo/elmo-tools.ts
A	lib/geo/fix-generator.ts
A	lib/geo/geo-api-client.ts
A	lib/geo/recommended-fixes.ts
A	lib/geo/schema-markup-tool.ts
A	lib/media/stock-footage.ts
A	lib/product/elevator-pitch.ts
M	lib/redis/rate-limit.ts
A	public/AGENTS.md
R100	design.png	public/images/design.png
A	public/marketing/flowintent-modes-hero.png
A	scripts/AGENTS.md
A	scripts/apply-geo-tracking-migration.ts
A	scripts/deploy/cloudflared-geo.example.yml
A	scripts/deploy/elmo-manual-init.sh
A	scripts/deploy/geomode-companion-compose.override.yml
A	scripts/deploy/geomode-companion-redeploy.py
A	scripts/deploy/geomode-vps-bringup.py
A	scripts/deploy/geomode-vps-configure.py
A	scripts/deploy/geomode-vultr-bootstrap.sh
A	scripts/deploy/geomode-vultr-remote.ps1
A	scripts/deploy/geomode-vultr.env.example
A	scripts/deploy/patch-cloudflared-host-network-vps.sh
A	scripts/deploy/patch-cloudflared-ingress-vps.sh
A	scripts/deploy/patch-cloudflared-vps.sh
A	scripts/deploy/vultr-inject-ssh-key.ps1
A	scripts/deploy/vultr-inject-ssh-key.sh
A	scripts/verify-geo-tracking-sync.ts
A	services/AGENTS.md
A	services/geomode-companion/Dockerfile
A	services/geomode-companion/README.md
A	services/geomode-companion/migrations/001_companion_schema.sql
A	services/geomode-companion/migrations/002_elmo_summary_views.sql
A	services/geomode-companion/package.json
A	services/geomode-companion/src/api/server.ts
A	services/geomode-companion/src/cli/run-pipeline-once.ts
A	services/geomode-companion/src/config.ts
A	services/geomode-companion/src/contracts/digest.ts
A	services/geomode-companion/src/db/local.ts
A	services/geomode-companion/src/index.ts
A	services/geomode-companion/src/jobs/collector.ts
A	services/geomode-companion/src/jobs/digest-builder.test.ts
A	services/geomode-companion/src/jobs/digest-builder.ts
A	services/geomode-companion/src/jobs/neon-sync.ts
A	services/geomode-companion/src/jobs/suggestions.ts
A	services/geomode-companion/tsconfig.json
A	services/geomode-tui/config.example.json
A	services/geomode-tui/package.json
A	services/geomode-tui/src/config.ts
A	services/geomode-tui/src/digest-view.tsx
A	services/geomode-tui/src/index.tsx
A	services/geomode-tui/tsconfig.json
A	supabase/AGENTS.md
A	tests/AGENTS.md
A	tests/fixtures/dashboard-mode-qa.json
M	tests/setup.ts
A	tests/unit/artifacts/build-save-payload.test.ts
A	tests/unit/artifacts/preview.test.ts
A	tests/unit/artifacts/registry.test.ts
A	tests/unit/chat/conversation-mode.test.ts
M	tests/unit/chat/conversations-route.test.ts
A	tests/unit/chat/data-part-normalizers.test.ts
A	tests/unit/chat/modes.test.ts
M	tests/unit/dashboard-subscription-guard.test.ts
A	tests/unit/geo/elmo-client.test.ts
A	tests/unit/geo/elmo-provisioning.test.ts
A	tests/unit/geo/geo-execution-tools.test.ts
A	tests/unit/geo/suggestions-contract.test.ts
A	tests/unit/product/elevator-pitch.test.ts
M	tsconfig.json
A	types/AGENTS.md
```

</details>
<details><summary>PR #81: 154 changed files</summary>

```text
A	.npmrc
D	SEO_AEO Chatbot Insights Research.md
M	app/api/admin/usage/route.ts
A	app/api/agents.md
M	app/api/analyze-website/route.ts
M	app/api/brand-voice/extract/route.ts
M	app/api/chat/route.ts
M	app/api/content/generate/route.ts
M	app/api/image/generate/route.ts
M	app/api/images/generate/route.ts
M	app/api/onboarding/analyze-website/route.ts
A	app/api/usage/summary/route.ts
A	app/api/webhooks/langfuse/route.ts
A	app/audit/results/[id]/layout.tsx
M	app/blog/[slug]/page.tsx
M	app/blog/page.tsx
A	app/dashboard/agents.md
D	app/dashboard/blog/[slug]/page.tsx
D	app/dashboard/blog/page.tsx
M	app/dashboard/client-layout.tsx
M	app/globals.css
A	app/images/layout.tsx
M	app/layout.tsx
M	app/reddit-gap/results/[id]/page.tsx
M	app/robots.ts
D	build-output.txt
A	components/chat/agents.md
M	components/chat/ai-chat-interface.tsx
M	components/chat/chat-mode-context.tsx
M	components/chat/generative-ui/save-to-library-button.tsx
A	components/dashboard/agents.md
A	components/dashboard/usage-summary-card.tsx
M	components/landing/landing-page-client.tsx
A	components/landing/sections/features-bento.tsx
A	components/landing/sections/final-cta.tsx
A	components/landing/sections/hero.tsx
A	components/landing/sections/social-proof-marquee.tsx
A	components/landing/sections/stats-strip.tsx
D	components/local-seo/local-seo-dashboard.tsx
A	components/magicui/animated-shiny-text.tsx
A	components/magicui/bento-grid.tsx
A	components/magicui/border-beam.tsx
A	components/magicui/border-glow.tsx
A	components/magicui/grid-pattern.tsx
A	components/magicui/marquee.tsx
A	components/magicui/meteors.tsx
A	components/magicui/shimmer-button.tsx
D	components/podcast/podcast-transcriber.tsx
A	components/providers/analytics-provider.tsx
A	components/providers/posthog-identify.tsx
M	components/user-mode/adaptive-dashboard.tsx
M	components/user-mode/mode-selection-dialog.tsx
D	components/video/video-seo-analyzer.tsx
D	components/white-label/white-label-dashboard.tsx
A	components/workspace/agents.md
A	content/agents.md
D	content/blog/ai-content-calendar-generator-free.md
D	content/blog/ai-copywriting-tool-free.md
D	content/blog/ai-email-marketing-startups.md
D	content/blog/ai-email-subject-line-generator-tools.md
D	content/blog/ai-meta-description-generator-free-tools.md
D	content/blog/ai-social-media-post-generator.md
D	content/blog/ai-social-media-scheduler-small-business.md
D	content/blog/ai-social-scheduling-tools.md
D	content/blog/free-ai-blog-post-generator.md
D	content/blog/free-ai-content-generator.md
D	content/blog/free-ai-press-release-generator-tools.md
D	design.png
A	docs/agents.md
A	docs/superpowers/plans/2026-07-07-pnpm-migration-magic-ui.md
A	docs/superpowers/specs/2026-07-07-pnpm-migration-magic-ui-design.md
A	drizzle/agents.md
A	hooks/agents.md
M	hooks/use-mode-adaptations.ts
A	instrumentation-client.ts
A	instrumentation.ts
M	lib/ab-testing/ab-testing-service.ts
M	lib/agents/agent-router.ts
A	lib/agents/agents.md
M	lib/agents/content-writer-agent.ts
M	lib/agents/eeat-qa-agent.ts
M	lib/agents/enhanced-image-agent.ts
M	lib/agents/rag-writer-orchestrator.ts
M	lib/agents/research-agent.ts
M	lib/agents/tools.ts
M	lib/ai/ai-search-optimizer.ts
M	lib/ai/content-gap-analyzer.ts
M	lib/ai/dataforseo-tools.ts
M	lib/ai/domain-keyword-profiler.ts
M	lib/ai/gateway-provider.ts
M	lib/ai/keyword-trend-analyzer.ts
A	lib/ai/manual-tool-execution.ts
M	lib/ai/tool-schema-validator-v6.ts
M	lib/ai/tool-schema-validator.ts
A	lib/analytics/posthog-server.ts
A	lib/analytics/product-events.ts
M	lib/analytics/usage-logger.ts
M	lib/audit/extraction-agent.ts
M	lib/audit/judge-agent.ts
A	lib/chat/agents.md
M	lib/chat/orchestrator.ts
M	lib/chat/stream-builder.ts
M	lib/collaboration/team-service.ts
M	lib/competitor/competitor-alerts-service.ts
M	lib/config/env.ts
M	lib/content-zone/brief.ts
M	lib/errors/logger.ts
M	lib/external-apis/humanization-service.ts
A	lib/geo/agents.md
M	lib/llm/adapters/gemini.ts
D	lib/local-seo/local-seo-service.ts
M	lib/mcp/deepwiki-client.ts
A	lib/observability/app-logger.ts
A	lib/observability/flush-traces.ts
A	lib/observability/langfuse-ops.ts
A	lib/observability/langfuse-tracing.ts
M	lib/observability/langfuse.ts
D	lib/podcast/podcast-service.ts
M	lib/sandbox/code-mode.ts
M	lib/schema/schema-markup-service.ts
D	lib/tutorials/data/local-seo-guide.ts
M	lib/tutorials/index.ts
M	lib/tutorials/milestone-service.ts
D	lib/video/video-seo-service.ts
D	lib/white-label/white-label-service.ts
A	lib/workflows/agents.md
D	lib/workflows/definitions/local-seo-campaign.ts
M	lib/workflows/engine.ts
M	lib/workflows/registry.ts
M	next.config.ts
D	opencode.json
D	package-lock.json
M	package.json
A	pnpm-lock.yaml
A	pnpm-workspace.yaml
D	proxy.ts
A	public/agents.md
A	scripts/agents.md
A	sentry.client.config.ts
A	sentry.edge.config.ts
A	sentry.server.config.ts
A	services/agents.md
A	supabase/agents.md
A	tests/agents.md
M	tests/integration/landing-to-audit-cta.test.ts
M	tests/integration/rate-limit-api.test.ts
M	tests/setup.ts
M	tests/unit/chat/intent-classifier.test.ts
M	tests/unit/content-page-metadata.test.ts
M	tests/unit/dashboard/dashboard-routes.test.tsx
D	tests/unit/dashboard/overview-redirect.test.tsx
M	tests/unit/dashboard/sidebar-navigation.test.tsx
A	types/agents.md
M	types/user-mode.ts
```

</details>
<details><summary>PR #79: 160 changed files</summary>

```text
A	.npmrc
D	SEO_AEO Chatbot Insights Research.md
M	app/api/admin/usage/route.ts
A	app/api/agents.md
M	app/api/analyze-website/route.ts
M	app/api/brand-voice/extract/route.ts
M	app/api/chat/route.ts
M	app/api/content/generate/route.ts
M	app/api/image/generate/route.ts
M	app/api/images/generate/route.ts
M	app/api/onboarding/analyze-website/route.ts
A	app/api/usage/summary/route.ts
A	app/api/webhooks/langfuse/route.ts
A	app/audit/results/[id]/layout.tsx
M	app/blog/[slug]/page.tsx
M	app/blog/page.tsx
A	app/dashboard/agents.md
D	app/dashboard/blog/[slug]/page.tsx
D	app/dashboard/blog/page.tsx
M	app/dashboard/client-layout.tsx
M	app/globals.css
A	app/images/layout.tsx
M	app/layout.tsx
M	app/reddit-gap/results/[id]/page.tsx
M	app/robots.ts
D	build-output.txt
A	components/chat/agents.md
M	components/chat/ai-chat-interface.tsx
M	components/chat/chat-mode-context.tsx
M	components/chat/generative-ui/save-to-library-button.tsx
A	components/chat/message-bubble.tsx
A	components/dashboard/agents.md
A	components/dashboard/usage-summary-card.tsx
M	components/landing/landing-page-client.tsx
A	components/landing/sections/features-bento.tsx
A	components/landing/sections/final-cta.tsx
A	components/landing/sections/hero.tsx
A	components/landing/sections/social-proof-marquee.tsx
A	components/landing/sections/stats-strip.tsx
D	components/local-seo/local-seo-dashboard.tsx
A	components/magicui/animated-shiny-text.tsx
A	components/magicui/bento-grid.tsx
A	components/magicui/border-beam.tsx
A	components/magicui/border-glow.tsx
A	components/magicui/grid-pattern.tsx
A	components/magicui/marquee.tsx
A	components/magicui/meteors.tsx
A	components/magicui/shimmer-button.tsx
D	components/podcast/podcast-transcriber.tsx
A	components/providers/analytics-provider.tsx
A	components/providers/posthog-identify.tsx
M	components/user-mode/adaptive-dashboard.tsx
M	components/user-mode/mode-selection-dialog.tsx
D	components/video/video-seo-analyzer.tsx
D	components/white-label/white-label-dashboard.tsx
A	components/workspace/agents.md
A	content/agents.md
D	content/blog/ai-content-calendar-generator-free.md
D	content/blog/ai-copywriting-tool-free.md
D	content/blog/ai-email-marketing-startups.md
D	content/blog/ai-email-subject-line-generator-tools.md
D	content/blog/ai-meta-description-generator-free-tools.md
D	content/blog/ai-social-media-post-generator.md
D	content/blog/ai-social-media-scheduler-small-business.md
D	content/blog/ai-social-scheduling-tools.md
D	content/blog/free-ai-blog-post-generator.md
D	content/blog/free-ai-content-generator.md
D	content/blog/free-ai-press-release-generator-tools.md
D	design.png
A	docs/agents.md
A	docs/superpowers/plans/2026-07-07-pnpm-migration-magic-ui.md
A	docs/superpowers/specs/2026-07-07-pnpm-migration-magic-ui-design.md
A	drizzle/agents.md
A	hooks/agents.md
M	hooks/use-mode-adaptations.ts
A	instrumentation-client.ts
A	instrumentation.ts
M	lib/ab-testing/ab-testing-service.ts
M	lib/agents/agent-router.ts
A	lib/agents/agents.md
M	lib/agents/content-writer-agent.ts
M	lib/agents/eeat-qa-agent.ts
M	lib/agents/enhanced-image-agent.ts
M	lib/agents/rag-writer-orchestrator.ts
M	lib/agents/research-agent.ts
M	lib/agents/seo-aeo-agent.ts
M	lib/agents/seo-aeo-syntax-agent.ts
M	lib/agents/tools.ts
M	lib/ai/ai-search-optimizer.ts
M	lib/ai/content-gap-analyzer.ts
M	lib/ai/dataforseo-tools.ts
M	lib/ai/domain-keyword-profiler.ts
M	lib/ai/gateway-provider.ts
M	lib/ai/keyword-trend-analyzer.ts
A	lib/ai/manual-tool-execution.ts
M	lib/ai/tool-schema-validator-v6.ts
M	lib/ai/tool-schema-validator.ts
A	lib/analytics/posthog-server.ts
A	lib/analytics/product-events.ts
M	lib/analytics/usage-logger.ts
M	lib/audit/extraction-agent.ts
M	lib/audit/judge-agent.ts
A	lib/chat/agents.md
M	lib/chat/orchestrator.ts
M	lib/chat/stream-builder.ts
M	lib/collaboration/team-service.ts
M	lib/competitor/competitor-alerts-service.ts
M	lib/config/env.ts
M	lib/content-zone/brief.ts
M	lib/errors/logger.ts
M	lib/external-apis/humanization-service.ts
A	lib/geo/agents.md
M	lib/llm/adapters/gemini.ts
M	lib/llm/adapters/grok.ts
M	lib/llm/adapters/perplexity.ts
D	lib/local-seo/local-seo-service.ts
M	lib/mcp/deepwiki-client.ts
A	lib/observability/app-logger.ts
A	lib/observability/flush-traces.ts
A	lib/observability/langfuse-ops.ts
A	lib/observability/langfuse-tracing.ts
M	lib/observability/langfuse.ts
D	lib/podcast/podcast-service.ts
M	lib/sandbox/code-mode.ts
M	lib/schema/schema-markup-service.ts
D	lib/tutorials/data/local-seo-guide.ts
M	lib/tutorials/index.ts
M	lib/tutorials/milestone-service.ts
D	lib/video/video-seo-service.ts
D	lib/white-label/white-label-service.ts
A	lib/workflows/agents.md
D	lib/workflows/definitions/local-seo-campaign.ts
M	lib/workflows/engine.ts
M	lib/workflows/registry.ts
M	next.config.ts
D	opencode.json
D	package-lock.json
M	package.json
A	pnpm-lock.yaml
A	pnpm-workspace.yaml
D	proxy.ts
A	public/agents.md
A	scripts/agents.md
A	sentry.client.config.ts
A	sentry.edge.config.ts
A	sentry.server.config.ts
A	services/agents.md
A	supabase/agents.md
A	tests/agents.md
M	tests/integration/landing-to-audit-cta.test.ts
M	tests/integration/rate-limit-api.test.ts
M	tests/setup.ts
M	tests/unit/chat/intent-classifier.test.ts
A	tests/unit/chat/message-bubble.test.tsx
M	tests/unit/content-page-metadata.test.ts
M	tests/unit/dashboard/dashboard-routes.test.tsx
D	tests/unit/dashboard/overview-redirect.test.tsx
M	tests/unit/dashboard/sidebar-navigation.test.tsx
A	types/agents.md
M	types/user-mode.ts
```

</details>
<details><summary>PR #78: 99 changed files</summary>

```text
M	AGENTS.md
D	GEMINI.md
M	app/AGENTS.md
M	app/globals.css
M	app/layout.tsx
M	app/login/[[...rest]]/page.tsx
M	app/sign-in/[[...sign-in]]/page.tsx
M	app/sign-up/[[...sign-up]]/page.tsx
M	app/signup/[[...rest]]/page.tsx
D	build-output.txt
M	components/AGENTS.md
M	components/artifacts/artifact-renderer.tsx
M	components/auth/LoginForm.tsx
M	components/auth/SignupForm.tsx
M	components/chat/ai-chat-interface.tsx
M	components/chat/artifacts/toast-artifact.tsx
M	components/chat/chat-input.tsx
M	components/chat/tool-ui/serp-table.tsx
A	components/chat/tool-ui/tool-error-card.tsx
M	components/dashboard/sidebar.tsx
M	components/landing/landing-faq-section.tsx
M	components/landing/landing-page-client.tsx
M	components/landing/mode-skill-picker.tsx
M	components/navbar.tsx
D	design.png
R100	supabase/migrations/001_initial_schema.sql	docs/archive/supabase-migrations/001_initial_schema.sql
R100	supabase/migrations/002_competitor_monitoring.sql	docs/archive/supabase-migrations/002_competitor_monitoring.sql
R100	supabase/migrations/003_framework_policies.sql	docs/archive/supabase-migrations/003_framework_policies.sql
R100	supabase/migrations/20240101000004_phase6_image_generation.sql	docs/archive/supabase-migrations/20240101000004_phase6_image_generation.sql
R100	supabase/migrations/20240101000005_phase7_video_seo.sql	docs/archive/supabase-migrations/20240101000005_phase7_video_seo.sql
R100	supabase/migrations/20240116000000_admin_knowledge_base_and_analytics.sql	docs/archive/supabase-migrations/20240116000000_admin_knowledge_base_and_analytics.sql
R100	supabase/migrations/20250105000000_backfill_costs.sql	docs/archive/supabase-migrations/20250105000000_backfill_costs.sql
R100	supabase/migrations/20250105000001_conversations_library_archive.sql	docs/archive/supabase-migrations/20250105000001_conversations_library_archive.sql
R100	supabase/migrations/20250106000000_supabase_advisor_fixes.sql	docs/archive/supabase-migrations/20250106000000_supabase_advisor_fixes.sql
R100	supabase/migrations/20250118000001_add_tutorial_progress_tables.sql	docs/archive/supabase-migrations/20250118000001_add_tutorial_progress_tables.sql
R100	supabase/migrations/20250118000002_add_user_achievements_tables.sql	docs/archive/supabase-migrations/20250118000002_add_user_achievements_tables.sql
R100	supabase/migrations/20250118000003_add_chat_context_table.sql	docs/archive/supabase-migrations/20250118000003_add_chat_context_table.sql
R100	supabase/migrations/20250118000004_add_workflow_persistence_tables.sql	docs/archive/supabase-migrations/20250118000004_add_workflow_persistence_tables.sql
R100	supabase/migrations/20251119000007_fix_agent_documents_complete.sql	docs/archive/supabase-migrations/20251119000007_fix_agent_documents_complete.sql
R100	supabase/migrations/20251119000008_update_vector_dimensions.sql	docs/archive/supabase-migrations/20251119000008_update_vector_dimensions.sql
R100	supabase/migrations/20251120000001_add_learning_loop_tables.sql	docs/archive/supabase-migrations/20251120000001_add_learning_loop_tables.sql
R100	supabase/migrations/20251122000001_fix_rag_complete.sql	docs/archive/supabase-migrations/20251122000001_fix_rag_complete.sql
R100	supabase/migrations/20251122000002_add_seo_research_docs.sql	docs/archive/supabase-migrations/20251122000002_add_seo_research_docs.sql
R100	supabase/migrations/20251208000001_check_is_admin_function.sql	docs/archive/supabase-migrations/20251208000001_check_is_admin_function.sql
R100	supabase/migrations/20251211000000_add_metadata_to_agent_documents.sql	docs/archive/supabase-migrations/20251211000000_add_metadata_to_agent_documents.sql
R100	supabase/migrations/20251211000001_beta_guardrails.sql	docs/archive/supabase-migrations/20251211000001_beta_guardrails.sql
R100	supabase/migrations/20251217000001_add_unique_constraint_agent_documents.sql	docs/archive/supabase-migrations/20251217000001_add_unique_constraint_agent_documents.sql
R100	supabase/migrations/20251217000002_rename_locations_to_location.sql	docs/archive/supabase-migrations/20251217000002_rename_locations_to_location.sql
R100	supabase/migrations/20251217000003_user_mode_system.sql	docs/archive/supabase-migrations/20251217000003_user_mode_system.sql
R100	supabase/migrations/20260118000001_add_users_table.sql	docs/archive/supabase-migrations/20260118000001_add_users_table.sql
R100	supabase/migrations/20260130000001_aeo_citation_tracking.sql	docs/archive/supabase-migrations/20260130000001_aeo_citation_tracking.sql
R100	supabase/migrations/20260130000002_campaign_analytics.sql	docs/archive/supabase-migrations/20260130000002_campaign_analytics.sql
R100	supabase/migrations/20260225_create_ai_visibility_audits.sql	docs/archive/supabase-migrations/20260225_create_ai_visibility_audits.sql
R100	supabase/migrations/20260418000000_reddit_gap_audits.sql	docs/archive/supabase-migrations/20260418000000_reddit_gap_audits.sql
R100	supabase/migrations/20260418000001_neon_rls_policies.sql	docs/archive/supabase-migrations/20260418000001_neon_rls_policies.sql
R100	content/blog/ai-content-calendar-generator-free.md	docs/content-drafts/blog/ai-content-calendar-generator-free.md
R100	content/blog/ai-copywriting-tool-free.md	docs/content-drafts/blog/ai-copywriting-tool-free.md
R100	content/blog/ai-email-marketing-startups.md	docs/content-drafts/blog/ai-email-marketing-startups.md
R100	content/blog/ai-email-subject-line-generator-tools.md	docs/content-drafts/blog/ai-email-subject-line-generator-tools.md
R100	content/blog/ai-meta-description-generator-free-tools.md	docs/content-drafts/blog/ai-meta-description-generator-free-tools.md
R100	content/blog/ai-social-media-post-generator.md	docs/content-drafts/blog/ai-social-media-post-generator.md
R100	content/blog/ai-social-media-scheduler-small-business.md	docs/content-drafts/blog/ai-social-media-scheduler-small-business.md
R100	content/blog/ai-social-scheduling-tools.md	docs/content-drafts/blog/ai-social-scheduling-tools.md
R100	content/blog/free-ai-blog-post-generator.md	docs/content-drafts/blog/free-ai-blog-post-generator.md
R100	content/blog/free-ai-content-generator.md	docs/content-drafts/blog/free-ai-content-generator.md
R100	content/blog/free-ai-press-release-generator-tools.md	docs/content-drafts/blog/free-ai-press-release-generator-tools.md
R100	content/guides/choosing-ai-marketing-tools.md	docs/content-drafts/guides/choosing-ai-marketing-tools.md
R100	content/guides/what-is-answer-engine-optimization-aeo.md	docs/content-drafts/guides/what-is-answer-engine-optimization-aeo.md
R100	feature-guide.md	docs/feature-guide.md
R100	nextphase.md	docs/nextphase.md
R100	SEO_AEO Chatbot Insights Research.md	docs/research/seo-aeo-chatbot-insights.md
A	docs/specs/2026-07-06-chatbot-ux-findings.md
M	docs/supabase-hardening.md
D	hooks/use-clerk-load-guard.ts
M	lib/AGENTS.md
M	lib/analytics/success-metrics.ts
A	lib/artifacts/normalize-keyword-data.ts
M	lib/artifacts/registry.ts
M	lib/artifacts/sync-from-messages.ts
M	lib/chat/intent-classifier.ts
M	lib/chat/stream-builder.ts
M	lib/chat/tool-assembler.ts
A	lib/chat/tool-timeout.ts
A	lib/errors/provider-errors.ts
M	mcps/AGENTS.md
D	opencode.json
D	scripts/apply-migration.ts
D	services/geomode-tui/config.example.json
D	services/geomode-tui/package.json
D	services/geomode-tui/src/config.ts
D	services/geomode-tui/src/digest-view.tsx
D	services/geomode-tui/src/index.tsx
D	services/geomode-tui/tsconfig.json
M	tailwind.config.js
A	tests/unit/artifacts/normalize-keyword-data.test.ts
A	tests/unit/artifacts/sync-from-messages.test.ts
A	tests/unit/chat/tool-timeout.test.ts
A	tests/unit/errors/provider-errors.test.ts
D	types/chat.ts
```

</details>
<details><summary>PR #76: 32 changed files</summary>

```text
M	app/api/auth/[...all]/route.ts
M	app/api/content-zone/brief/route.ts
M	app/api/conversations/route.ts
M	app/dashboard/aeo/page.tsx
M	app/dashboard/client-layout.tsx
M	app/dashboard/content-zone/page.tsx
M	app/dashboard/content/page.tsx
M	app/dashboard/content/zone/page.tsx
M	components/chat/ai-chat-interface.tsx
M	components/chat/chat-mode-context.tsx
M	components/chat/chat-mode-selector.tsx
A	components/chat/dashboard-chat-mode-sync.tsx
M	components/dashboard/sidebar.tsx
M	components/landing/landing-faq-section.tsx
M	components/landing/landing-page-client.tsx
M	components/providers/agent-provider.tsx
A	docs/deployment/geomode-vultr.md
M	docs/geo-mode.md
A	docs/specs/2026-06-12-geomode-geo-tracking-design.md
A	docs/specs/platform-modes-alignment.md
A	docs/specs/platform-modes.md
M	lib/auth-config.ts
A	lib/chat/conversation-mode.ts
M	lib/chat/modes.ts
M	lib/config/env.ts
M	lib/faq.ts
A	lib/product/elevator-pitch.ts
A	scripts/deploy/geomode-vultr-bootstrap.sh
A	tests/unit/chat/conversation-mode.test.ts
M	tests/unit/chat/conversations-route.test.ts
A	tests/unit/chat/modes.test.ts
A	tests/unit/product/elevator-pitch.test.ts
```

</details>
<details><summary>PR #75: 3 changed files</summary>

```text
M	app/dashboard/layout.tsx
M	lib/auth/admin.ts
M	tests/unit/dashboard-subscription-guard.test.ts
```

</details>
<details><summary>PR #74: 1 changed files</summary>

```text
M	AGENTS.md
```

</details>
## Findings by severity

- **Unsafe for production:** #81, #79, #82, and #83 are broad, stale-base bundles with connector-reported non-mergeability and active unresolved review threads. Their changed-file counts and deletions make wholesale merge unsafe without decomposition.
- **Partially implemented:** The merged main baseline contains the product-mode, workspace/artifact, GEO foundation, auth, and AIsa work, but the open PRs contain competing follow-up fixes and cleanup that have not been reconciled onto current main.
- **Documented but missing:** PR #83 contains potentially valuable CI, harness-contract, and profile-RAG assets that are not present in the current main baseline. Their presence in an open PR is not evidence of production integration.
- **Duplicate:** #79 and #81 substantially target the same pre-#80 product surface; #76's core mode-alignment intent is superseded by #77/#80. #82 and #78 also include broad cleanup that overlaps already-merged or current files.
- **Evidence limitation:** Connector-only CI/check details were unavailable. Review counts, dates, unresolved-thread counts, and mergeability are connector observations; they are not substituted with invented status.

## Deferred work

- Rebase or reimplement selected changes from #75, #78, #82, and #83 on current `origin/main`.
- Decide whether profile RAG and vector-search changes meet tenant-isolation, cleanup, migration, and test requirements.
- Validate the #83 CI workflow against the repository's actual package manager and required environment.
- Run current typecheck, focused unit tests, full tests where feasible, production build, and deployment checks in later reconciliation tasks.
- Reconcile observability changes from #81/#79 against the current Sentry/Langfuse/telemetry configuration without restoring deleted or superseded files.
- Rewrite any useful #74 setup documentation without secret material and with current auth/database instructions.

## Evidence log

Commands and sources used:

```powershell
git fetch origin main
83,82,81,79,78,76,75,74 | ForEach-Object { git fetch origin "pull/$($_)/head:refs/remotes/origin/pr-$($_)" }
git status --short --branch
git diff --stat "origin/main...origin/pr-$($_)"
git diff --name-status "origin/main...origin/pr-$($_)"
git log --oneline --decorate -20 origin/main
git diff --shortstat "origin/main...origin/pr-$($_)"
git rev-list --count "origin/main..origin/pr-$($_)"
git merge-base origin/main "origin/pr-$($_)"
```

Connector calls used for each requested PR in `sodown4thecause/seobot`: `github_get_pr_info`, `github_list_pr_changed_filenames`, `github_list_pull_request_reviews`, and `github_list_pull_request_review_threads`. Connector results were reduced to metadata, filenames, review states/dates, and unresolved-thread paths/counts; review bodies and credentials were not copied. CI/check state was not present in the returned metadata and remains an explicit limitation.

## Task 1 review-fix details and test results

- Expanded the PR reconciliation evidence with exact connector metadata for #83, #82, #81, #79, #78, #76, #75, and #74: title, branch, head/base SHA, state, changed-file count, additions/deletions, commit count, review count, review dates, and the connector/check-state limitation.
- Added direct per-PR `git diff --name-status origin/main...origin/pr-N` inventories from the fetched local refs; each inventory count matches the connector changed-file count.
- Added the verified package/runtime baseline: pnpm 11.5.0, frozen lockfile, Node >=22, Next 16.0.10, React 19.2.3, and ai ^7.0.15.
- Validation commands and results:

```text
node --version -> v24.14.0
pnpm --version -> 11.5.0
package.json inspection -> Node >=22; pnpm@11.5.0; next 16.0.10; react ^19.2.3; ai ^7.0.15
pnpm-lock.yaml inspection -> lockfileVersion: '9.0'
pnpm install --frozen-lockfile --lockfile-only -> Done in 5.4s using pnpm v11.5.0
git diff --check -> passed
```

CI/check state remains unavailable from the connector and is not inferred.

## Task 1 reconciliation review fix

- Restored the per-PR reconciliation decision table for #83, #82, #81, #79, #78, #76, #75, and #74 in `docs/audits/production-readiness-audit.md`, with purpose, changed areas, mergeability, default-branch overlap, cross-PR overlap, unique valuable files, stale/superseded files, tests run, and recommended action.
- Preserved the existing exact metadata ledger and per-file inventories; the #82 title is recorded in plain ASCII as `chore: repo cleanup - doc reorganization, asset moves, AGENTS.md reference files` to avoid mojibake.
- No application code or test fixtures were changed. Validation: `git diff --check` and targeted metadata/inventory checks passed; connector CI/check state remains unavailable and no PR test suite was rerun.
