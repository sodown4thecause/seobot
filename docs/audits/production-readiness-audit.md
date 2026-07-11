# FlowIntent Production Readiness Audit

## Scope and evidence date

This evidence snapshot covers `origin/main`, requested open PRs #83, #82, #81, #79, #78, #76, #75, and #74, and the merged baseline represented by PRs #80, #77, and #72. Evidence was captured on 2026-07-12 in the isolated `codex/production-readiness-pr-reconciliation` worktree. The main checkout was not modified. Secrets, credentials, review bodies, and private comment text are intentionally excluded.

## Verified baseline

- `origin/main` = `8251e5e` (`Add AIsa SEO GEO and social integrations (#80)`).
- The immediately preceding merged product baseline is `7e3e7a7` (`Workspace, artifact registry, GEO Elmo integration, and docs sync (#77)`); PR #72 is represented in main history by merge commit `2acd730`.
- The isolated branch is `codex/production-readiness-pr-reconciliation`, at `22aa793`, two commits ahead of `origin/main` before this audit commit.
- `origin/pr-83`, `origin/pr-82`, `origin/pr-81`, `origin/pr-79`, `origin/pr-78`, `origin/pr-76`, `origin/pr-75`, and `origin/pr-74` were fetched successfully.
- All eight requested PRs are open. Connector metadata reports `mergeable: false` for each; this is recorded as connector metadata, not as an independently reproduced merge result.
- The connector exposed PR metadata, changed filenames, reviews, and review threads. It did not expose a reliable CI/check-state field in the returned PR metadata. Therefore check state is explicitly `Unavailable from connector` below; no green/red conclusion is inferred.

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

## Pull-request reconciliation

| PR | Branch | Purpose | Changed areas | Mergeability | Overlap | Unique valuable files | Stale/superseded files | Tests/checks | Recommended action |
|---|---|---|---|---|---|---|---|---|---|
| #83 | `rescue/mtjz-skills-and-planning` | Rescue agent skills, planning docs, CI, harness contracts, and profile RAG from an orphaned worktree. | 206 files; 34,420 additions; primarily `.agents/skills` (190), `.planning`, plus harness/profile-RAG/lib/test files. | Connector: non-mergeable; open. | Base `58d6751`; largely outside product code, but touches current vector-search and chat contracts. | `lib/onboarding/profile-rag.ts`, `lib/chat/harness-contracts.ts`, `tests/unit/chat/harness-contracts.test.ts`, `docs/harness/team-spec.md`, `.github/workflows/ci.yml`. | Most rescued skills/planning material is additive but unvalidated; any auth/old-chat assumptions must be treated as stale. | 9 reviews; 3 unresolved threads, all active. Check state unavailable from connector. | Do not merge wholesale. Review and cherry-pick or reimplement narrowly selected assets after validating ownership and CI. |
| #82 | `badlands-rattler` | Broad repository cleanup, documentation moves, GEO companion/deployment changes, and review fixes. | 177 files; 12,925 additions; 1,215 deletions across app, components, lib, services, scripts, docs, migrations, and tests. | Connector: non-mergeable; open. | Base `610cf73`; overlaps #77/#80 and many current product files. | Candidate deployment/migration hardening and selected docs only, subject to current-main review. | Large file moves, archived legacy content, old auth/UI snapshots, and broad cleanup are stale or conflict-prone. | 11 reviews; 21 unresolved threads, 20 active. Check state unavailable from connector. | Reject wholesale merge. Split into independently reviewable current-baseline patches. |
| #81 | `feat/platform-modes-workspace-docs-sync` | pnpm migration, Magic UI landing redesign, chat polish, and post-#77 cleanup. | 154 files; 23,778 additions; 42,046 deletions across app, lib, components, content, tests, observability, and package files. | Connector: non-mergeable; open. | Base `7e3e7a7`; heavily overlaps #79 and current main/#80. | Only current-baseline-compatible isolated fixes may be valuable; candidate areas include observability and dependency metadata. | Broad deletions, old package-manager transition, duplicated landing/chat work, and files already changed by #80. | 11 reviews; 82 unresolved threads, 71 active. Check state unavailable from connector. | Superseded as a branch. Mine specific fixes only after re-diffing against `origin/main`. |
| #79 | `feat/phase-3b-chat-polish` | pnpm/Magic UI/landing/chat polish plan and review fixes. | 160 files; 23,895 additions; 42,098 deletions across the same broad app/lib/components surface as #81. | Connector: non-mergeable; open. | Base `7e3e7a7`; near-duplicate of #81 and overlaps #80. | Potentially isolated chat/tool or observability fixes, if still absent on main. | Broad plan output, duplicate content moves, old landing/UI changes, and stale package/config edits. | 18 reviews; 27 unresolved threads, 26 active. Check state unavailable from connector. | Duplicate/superseded. Do not merge; extract only verified current-main deltas. |
| #78 | `cursor/chatbot-test-cursor-ui-67cb` | Cursor-style UI/docs, repository cleanup, and chatbot UX fixes. | 99 files; 1,765 additions; 1,045 deletions across docs, UI, chat, artifacts, services, and tests. | Connector: non-mergeable; open. | Base `7e3e7a7`; overlaps #77 and current workspace/chat files. | Candidate focused tests and tool-error/timeout handling, subject to current code review. | Legacy migration/archive moves, old auth pages, deleted TUI files, and broad docs cleanup are stale. | 4 reviews; 3 unresolved threads, all active. Check state unavailable from connector. | Split and rebase any desired UX or test fix; reject the historical cleanup bundle. |
| #76 | `cursor/platform-modes-alignment-e7f8` | Align SEO, GEO/AEO, and Content modes across landing and dashboard. | 32 files; 1,581 additions; 1,123 deletions across app, components, lib, docs, deployment, and tests. | Connector: non-mergeable; open. | Base `610cf73`; its core purpose is superseded by merged #77 and #80. | Possibly useful deployment/docs or narrowly scoped tests after comparison. | Mode UI, auth/config, landing, and conversation changes are stale relative to current main. | 21 reviews; 12 unresolved threads, 11 active. Check state unavailable from connector. | Superseded. Do not merge as-is; retain only current-main-compatible fixes. |
| #75 | `fix/google-login-dashboard-access` | Stop dashboard redirect to Polar checkout and expand admin allowlist. | 3 files; 8 additions; 6 deletions in dashboard layout, admin auth, and one test. | Connector: non-mergeable; open. | Base `610cf73`; dashboard access behavior overlaps merged #72 and current main. | Potentially the normalized admin allowlist change, if absent from current main. | Layout paywall removal may duplicate or conflict with current billing policy. | 6 reviews; 1 unresolved thread, but it is outdated; no active unresolved threads. Check state unavailable from connector. | Compare against current `lib/auth/admin.ts` and dashboard policy; cherry-pick only a confirmed missing fix. |
| #74 | `cursor/setup-dev-environment-e0f1` | Document Cursor Cloud development setup in `AGENTS.md`. | 1 file; 49 additions. | Connector: non-mergeable; open. | Base `610cf73`; documentation may be stale against current repo conventions. | The setup caveats may be useful as a rewritten, sanitized developer guide. | Any secret names/operational claims require revalidation; do not copy credentials or private environment details. | 3 reviews; 0 unresolved threads. Check state unavailable from connector. | Do not merge blindly; rewrite only validated, non-secret documentation if still needed. |

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
