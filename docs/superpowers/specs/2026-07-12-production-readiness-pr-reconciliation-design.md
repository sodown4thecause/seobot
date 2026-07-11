# FlowIntent Production Readiness and PR Reconciliation Design

## Goal

Reconcile the open FlowIntent pull requests against the current `origin/main` baseline, review their actual code and unresolved review threads, port only production-relevant changes into one clean branch, and leave the repository in a validated state before adding CI, deterministic E2E, Autonoma, or broader VPS work.

## Scope

This work covers:

- review of open PRs #83, #82, #81, #79, #78, #76, #75, and #74;
- comparison with merged PRs #80, #77, #72, and the current default branch;
- a per-PR reconciliation table with evidence, overlap, findings, and disposition;
- selective fixes for validated P0/P1/P2 production issues;
- pnpm and Node-version consistency in code, scripts, docs, and test configuration;
- deliberate removal of Sentry where it is still present, while preserving the verified PostHog and Langfuse/OpenTelemetry responsibilities;
- canonical README and audit documentation updates;
- focused lint, typecheck, unit/integration, and production-build validation when the dependency installation and environment permit it.

The following are explicitly deferred until this baseline is production-ready:

- GitHub Actions CI and E2E workflow construction;
- deterministic Playwright identity and storage-state implementation;
- browser exploration reports;
- Autonoma deployment or VPS mutation;
- Redis/Iris implementation and the final performance/cost test harness.

## Baseline constraints

- Work starts from `origin/main` at the current repository baseline, not from the dirty local checkout.
- The existing dirty checkout remains untouched; it contains user-owned Sentry deletions and unrelated instrumentation/configuration edits.
- The package manager target is pnpm 11.5.0, using the existing `pnpm-lock.yaml` and frozen installs.
- The application target is Node.js >=22, Next.js 16, React 19, and `ai@7.0.15`; stale AI SDK 6 references are documentation or compatibility defects to classify and correct, not a reason to downgrade the application.
- Canonical persistence and authentication remain Neon PostgreSQL/Drizzle and Better Auth.
- No test or validation step may connect to or mutate the production database.
- No secret, test cookie, authorization header, or private provider response may enter a commit, log, trace, screenshot, video, or report.
- Sentry removal must be complete across dependencies, config files, instrumentation, environment examples, and docs before it is reported as complete.

## Review and reconciliation protocol

For each open PR:

1. Record title, branch, base/head SHA, state, changed-file count, commits, checks, and review-thread state.
2. Read the changed filenames and inspect the actual patches for application, database, deployment, authentication, observability, and package-manager changes.
3. Re-check unresolved review comments against the current head. Automated comments are evidence to verify, not authoritative instructions.
4. Classify each change as retain, port after fix, reference only, or superseded.
5. Record a recommended action: merge after rebase, cherry-pick selected commits, manually port selected files, close as superseded, or retain only as reference.
6. Apply selected fixes on this clean reconciliation branch with small commits grouped by one production concern.
7. Run the focused validation for that concern and preserve the result in the audit.
8. Post concise, evidence-backed review comments to the relevant PRs. Do not approve a PR whose remaining changes are untested, overlapping, stale, or unsafe.

## Initial PR disposition hypothesis

These are starting hypotheses to confirm during the review, not final outcomes:

| PR | Initial direction | Reason |
|---|---|---|
| #75 | Port or merge after validation | Narrow Better Auth/dashboard access fix with a focused test surface. Verify that removing the layout paywall preserves API-level subscription gates and that the admin allowlist is safe. |
| #78 | Manually port selected reliability fixes | Provider-error sanitization, tool timeouts, artifact normalization, and mode-switch behavior may be valuable; the UI restyle and archived migration payload should not be imported wholesale. |
| #76 | Close as superseded/reference | Its mode alignment and GEO work overlap with merged #77 and #80. Port only any current-main regression it uniquely fixes. |
| #79 | Do not merge wholesale; port only verified deltas | It combines pnpm, a large landing redesign, observability, SDK migration, and removals. Current main already contains parts of the pnpm/SDK baseline, while the branch has a large stale diff and unresolved behavior risk. |
| #81 | Do not merge wholesale; use as comparison source | It overlaps heavily with #79 and includes package-lock/npm-era artifacts, large deletions, and broad observability/UI changes. Port only changes that survive current-main comparison and validation. |
| #82 | Selective port only | It combines cleanup, GEO, chat persistence, deployment, auth, and documentation. Existing review evidence includes production blockers that require independent verification before any adoption. |
| #83 | Reference or selective port only | The rescued skills/planning payload is not a production application requirement. Profile-RAG code must not be adopted until ownership filtering and actual wiring are proven. |
| #74 | Close as reference or port corrected facts | It is documentation-only and contains setup/build claims that must be reconciled with the current repository rather than merged as-is. |

## Production-hardening priorities

The review will prioritize correctness and security in this order:

1. authentication, authorization, tenant isolation, and cross-conversation data integrity;
2. migrations and deployment scripts that can fail startup or expose services;
3. provider/tool failures that can hang, leak raw errors, or corrupt artifact state;
4. environment validation and release configuration;
5. package-manager and canonical documentation consistency;
6. non-blocking UX, accessibility, and refactoring improvements.

P0 and P1 findings block reconciliation. P2 findings are fixed when small and directly related to the selected change; otherwise they are recorded with an owner and follow-up disposition. No PR is considered fixed solely because a review thread was marked resolved.

## pnpm and Sentry decisions

The reconciliation branch will normalize the repository around pnpm:

- README, AGENTS files, tests README, deployment docs, and durable specs use pnpm commands;
- Playwright and scripts do not invoke npm or `npm ci`;
- package-manager metadata and the lockfile remain authoritative;
- any package-lock or npm-only artifact introduced by an open PR is excluded unless a concrete compatibility reason is documented.

Sentry is not a target observability owner. The branch will remove Sentry dependencies and configuration only after verifying that no runtime import, wrapper, source-map upload, environment variable, or documentation reference remains. PostHog remains the product analytics/error-context owner, Langfuse remains the LLM trace/cost/quality owner, and Vercel/OpenTelemetry remains the request/runtime tracing owner.

## Deliverables

- `docs/audits/production-readiness-audit.md` with subsystem status, file evidence, PR reconciliation, verified findings, and unresolved blockers;
- canonical README and affected contributor/deployment docs updated to the actual pnpm/Node/AI SDK/auth/database/deployment stack;
- a clean reconciliation branch with small, reviewable commits and focused regression tests for every behavior change;
- GitHub review comments and disposition links for the open PRs;
- a handoff list separating completed PR fixes from deferred CI/E2E and operations work.

## Acceptance criteria for this phase

- Every requested open PR has an evidence-backed disposition.
- No selected change remains with an unverified P0/P1 review finding.
- Sentry is either fully removed or the audit states the exact remaining blocker.
- pnpm is used consistently in canonical docs and active configuration.
- Focused tests, typecheck, lint, and production build results are recorded honestly; failures are not hidden behind fallback commands.
- The branch is suitable as the base for the later CI/E2E production-readiness phase, but CI/E2E are not claimed complete in this phase.
