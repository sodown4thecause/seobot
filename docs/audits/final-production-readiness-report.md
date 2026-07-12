# FlowIntent Final Production-Readiness Report

Date: 2026-07-12
Branch: `codex/production-readiness-pr-reconciliation`
Draft PR: [#84](https://github.com/sodown4thecause/seobot/pull/84)

## 1. Executive summary

The current-main reconciliation is complete for the reviewed PR work, but
FlowIntent is not production-ready. Sentry was removed, pnpm and active
architecture documentation were normalized, strict production environment
validation was added, and selected security/reliability fixes from PRs #75,
#78, and #82 were ported and independently reviewed. The release remains
blocked by an uncompleted production build/typecheck baseline and by deferred
CI, deterministic E2E, production smoke, provider-contract, browser,
Autonoma, VPS, backup/restore, and branch-protection work.

## 2. Verified architecture

- Vercel: Next.js 16 / React 19 application, API routes, AI SDK 7 streaming,
  Better Auth integration, PostHog/Langfuse instrumentation, and lightweight
  orchestration.
- Neon: PostgreSQL and Drizzle-managed product data, including user/workspace,
  conversation, artifact, and vector-capable records where already used.
- VPS: geomode/companion services and other supporting services are separate
  from the Vercel application. No VPS mutation was performed in this audit.
- Billing: Polar. Auth: Better Auth with Google. Public brand: FlowIntent.
- Package manager: pnpm 11.5.0. Node package engine: >=22.

## 3. Work completed

- Captured default-branch and open-PR evidence for #83, #82, #81, #79, #78,
  #76, #75, and #74, including metadata, reviews, and changed-file inventories.
- Removed Sentry package/configuration/instrumentation references while
  preserving Langfuse/OpenTelemetry behavior.
- Made production environment validation fail closed and documented relaxed
  local validation.
- Normalized active pnpm, Node, AI SDK 7, Better Auth, Neon/Drizzle, Vercel,
  VPS, and four-mode product documentation.
- Ported reviewed PR #75 dashboard/admin guard coverage, PR #78 chatbot
  reliability fixes, and PR #82 security/reliability blockers.
- Added focused regression coverage for observability ownership, environment
  validation, provider errors, tool timeout cancellation, artifacts, retry,
  dashboard subscription gates, message IDs, GEO fallback/robots, Elmo IDs,
  companion safeguards, and account-linking/message persistence security.
- Added GitHub review comments to all requested PRs and opened draft PR #84.

## 4. Work not completed

- No CI or E2E workflows were added, by user direction.
- No deterministic Better Auth Playwright identities/storage state were
  provisioned.
- No production smoke, Preview URL E2E, browser exploratory report, or
  accessibility baseline was delivered.
- No Autonoma evaluation/deployment decision was completed.
- No VPS inspection, backup/restore test, Uptime Kuma deployment, or Docker
  hardening deployment was performed.
- No Redis/Iris identification, cache ADR, or durable agent-memory comparison
  was completed.
- No provider contract suite, k6 baseline, cost ceiling, or performance budget
  was completed.
- No branch-protection or required-check configuration was changed.

## 5. Remaining blockers

1. Full TypeScript validation timed out without a result.
2. `pnpm build` was blocked before Next.js compilation by
   `ERR_PNPM_IGNORED_BUILDS`; the safe placeholder build therefore has no
   production-build result.
3. CI/E2E and production smoke are absent and must be implemented before any
   production-readiness claim.
4. VPS, Autonoma, provider, backup/restore, tenant-isolation, and rollback
   evidence is missing.

## 6. Test evidence

- Direct local Vitest focused suite: 12 files, 44 tests passed.
- Local environment validation: passed.
- Production environment validation with mandatory values absent: failed as
  expected, confirming fail-closed behavior.
- Focused ESLint: exit code 0 with warnings for three unused imports and two
  ignored-file warnings.
- Full TypeScript: timed out after approximately 124 seconds.
- No production database or production credential was used.

## 7. CI run links

- [Draft PR #84](https://github.com/sodown4thecause/seobot/pull/84)
- No CI run link is claimed: CI workflows were intentionally deferred and the
  connector did not expose reliable historical check state for the audited PRs.

## 8. Browser report

`docs/audits/codex-browser-e2e-report.md` was not created. Browser exploration
is deferred until deterministic authentication, Preview testing, and safe
synthetic test data are established.

## 9. Security findings

Addressed in this branch: Sentry removal, production env fail-closed behavior,
account-link verification, conversation-scoped message persistence, loopback
companion binding, companion body/trends bounds, robots matching, and
collision-resistant Elmo IDs.

Still unverified: tenant isolation under integration concurrency, SSRF/upload/
prompt-injection boundaries, webhook replay protection, CSP/cookies/CSRF,
admin-route coverage, dependency scanning, secret scanning, and restore-tested
backup procedures.

## 10. Performance findings

No production or staging performance baseline was completed. p50/p95/p99,
connection pressure, memory, external-call count, model tokens, cache hit rate,
and workflow spend remain unknown.

## 11. Cost findings

No provider-contract or cost-ceiling suite was run. Focused tests used no real
provider calls. Provider budgets, model routing safeguards, and per-user/
workspace/global spend evidence remain incomplete.

## 12. VPS state

VPS state was not inspected or changed during this phase. Services, ports,
firewall, TLS, backups, monitoring, resources, and Autonoma capacity remain
unknown and must be inspected through the supplied secure channel before any
deployment decision.

## 13. Autonoma decision

No deployment decision yet. Autonoma must remain optional and cannot replace
merge-blocking Playwright tests. Evaluate licence, single-host support,
resource/dependency requirements, isolation, credentials, model-call cost,
artifacts, backups, and GitHub status-check integration before deployment.

## 14. Redis/memory decision

No Redis Iris implementation was added because the product/link was not
identified. Redis must not become the durable memory store; any future cache
design must preserve Neon/Hindsight durable records, tenant boundaries, TTLs,
privacy classification, invalidation, and stampede controls.

## 15. Docker decision

No FlowIntent Docker image was added. Keep the Next.js application on Vercel;
use Docker only for hardened auxiliary VPS services after inspection and
resource benchmarking.

## 16. Release recommendation

**Not ready.** The branch is suitable for review as a reconciliation and
hardening draft, not for production release. The next release gate requires a
successful production build/typecheck, CI, deterministic authenticated E2E,
Preview and production smoke, security/performance/cost evidence, and the
remaining Autonoma/VPS/backup/rollback decisions.
