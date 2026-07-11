# FlowIntent Production Readiness and PR Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile the open FlowIntent PRs against `origin/main`, fix verified production blockers, remove Sentry, normalize pnpm and canonical documentation, and produce an evidence-backed audit before starting CI/E2E work.

**Architecture:** Work in the isolated `codex/production-readiness-pr-reconciliation` branch based on `origin/main`. Review PRs connector-first, port only validated changes into small commits, keep Neon/Drizzle, Better Auth, Polar, PostHog, Langfuse/OpenTelemetry, and Vercel as the canonical architecture, and defer CI/E2E, Autonoma, VPS mutation, and Redis implementation.

**Tech Stack:** Next.js 16.0.10, React 19.2.3, Vercel AI SDK 7 (`ai@7.0.15`), Node.js >=22, pnpm 11.5.0, TypeScript, Vitest, Drizzle ORM, Neon PostgreSQL, Better Auth, Polar, PostHog, Langfuse/OpenTelemetry, Vercel.

## Global Constraints

- The package manager target is pnpm 11.5.0, using the existing `pnpm-lock.yaml` and frozen installs.
- The application target is Node.js >=22, Next.js 16, React 19, and `ai@7.0.15`; stale AI SDK 6 references are documentation or compatibility defects to classify and correct, not a reason to downgrade the application.
- Canonical persistence and authentication remain Neon PostgreSQL/Drizzle and Better Auth.
- No test or validation step may connect to or mutate the production database.
- No secret, test cookie, authorization header, or private provider response may enter a commit, log, trace, screenshot, video, or report.
- Sentry removal must be complete across dependencies, config files, instrumentation, environment examples, and docs before it is reported as complete.
- CI/E2E workflow construction, deterministic Playwright identities, browser reports, Autonoma deployment, VPS mutation, Redis/Iris implementation, and the final production-readiness release decision are deferred until this plan is complete.
- Preserve unrelated dirty edits in `C:\Users\install\Documents\seobot\seobot`; all implementation happens in `C:\Users\install\Documents\seobot\seobot\.worktrees\production-readiness-pr-reconciliation`.

---

### Task 1: Capture repository and PR evidence

**Files:**
- Create: `docs/audits/production-readiness-audit.md`
- Modify: none in application code
- Test: Git and GitHub evidence commands below

**Interfaces:**
- Consumes: `origin/main`, PRs #83/#82/#81/#79/#78/#76/#75/#74, merged PRs #80/#77/#72, and current repository files.
- Produces: the audit evidence table used by every later task and the final reconciliation decisions.

- [ ] **Step 1: Refresh the baseline refs without touching the dirty checkout**

Run from the isolated worktree:

```powershell
git fetch origin main
83,82,81,79,78,76,75,74 | ForEach-Object {
  git fetch origin "pull/$($_)/head:refs/remotes/origin/pr-$($_)"
}
git status --short --branch
```

Expected: `origin/main` is current, each `origin/pr-N` ref exists, and the isolated worktree is clean on `codex/production-readiness-pr-reconciliation`.

- [ ] **Step 2: Record local and connector-backed PR metadata**

Use the GitHub connector for `github_get_pr_info`, `github_list_pr_changed_filenames`, `github_list_pull_request_reviews`, and `github_list_pull_request_review_threads` for each requested PR. Record title, branch, head SHA, base SHA, state, changed files, commits, check state, unresolved threads, and review dates. Do not copy secrets or full private comments into the audit.

- [ ] **Step 3: Compare every requested PR with the current main baseline**

Run:

```powershell
83,82,81,79,78,76,75,74 | ForEach-Object {
  git diff --stat "origin/main...origin/pr-$($_)"
  git diff --name-status "origin/main...origin/pr-$($_)"
}
git log --oneline --decorate -20 origin/main
```

Expected: a per-PR changed-area inventory that distinguishes already-merged work from unique changes.

- [ ] **Step 4: Write the initial audit sections**

Create `docs/audits/production-readiness-audit.md` with these sections:

```markdown
# FlowIntent Production Readiness Audit

## Scope and evidence date
## Verified baseline
## Subsystem status
| Subsystem | Status | Evidence | Risk / next action |
|---|---|---|---|
## Pull-request reconciliation
| PR | Branch | Purpose | Changed areas | Mergeability | Overlap | Unique valuable files | Stale/superseded files | Tests/checks | Recommended action |
|---|---|---|---|---|---|---|---|---|---|
## Findings by severity
## Deferred work
## Evidence log
```

Use only these statuses: Implemented, Partially implemented, Configured but unused, Used but untested, Documented but missing, Deprecated, Duplicate, Blocked, Unsafe for production, or Verified complete.

- [ ] **Step 5: Validate and commit the evidence snapshot**

```powershell
git diff --check
git status --short
git add -f docs/audits/production-readiness-audit.md
git commit -m "docs: capture production readiness baseline"
```

Expected: no whitespace errors and only the audit file changed.

---

### Task 2: Remove Sentry and preserve the remaining observability boundary

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `instrumentation.ts`
- Delete: `instrumentation-client.ts`
- Delete: `sentry.client.config.ts`
- Delete: `sentry.edge.config.ts`
- Delete: `sentry.server.config.ts`
- Modify: `next.config.ts`
- Modify: `lib/errors/logger.ts`
- Modify: `lib/config/env.ts`
- Modify: `.env.example`
- Test: `tests/unit/observability/observability-ownership.test.ts`

**Interfaces:**
- Consumes: existing `appLogger`, PostHog, and Langfuse/OpenTelemetry modules.
- Produces: a build-time and runtime observability path with no Sentry package, import, config, or environment contract.

- [ ] **Step 1: Add a static ownership regression test**

Create `tests/unit/observability/observability-ownership.test.ts`:

```ts
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('observability ownership', () => {
  it('does not retain Sentry references in active runtime files', async () => {
    const files = ['instrumentation.ts', 'next.config.ts', 'lib/errors/logger.ts', 'lib/config/env.ts', '.env.example']
    const contents = await Promise.all(files.map((file) => readFile(file, 'utf8')))
    expect(contents.join('\n')).not.toMatch(/sentry|@sentry/i)
  })
})
```

Run `pnpm exec vitest run tests/unit/observability/observability-ownership.test.ts`; it must fail before removal because active files contain Sentry references.

- [ ] **Step 2: Remove Sentry from instrumentation and error logging**

In `instrumentation.ts`, remove the Sentry import, server/edge dynamic imports, and `onRequestError` export. Preserve Node-only Langfuse registration and pass the existing `config.baseUrl` into `LangfuseSpanProcessor`. In `lib/errors/logger.ts`, delete the dynamic Sentry capture block and keep structured `appLogger` calls.

- [ ] **Step 3: Remove the build wrapper, package, files, and environment keys**

Change `next.config.ts` to export `nextConfig` directly. Run `pnpm remove @sentry/nextjs`. Delete the three Sentry config files and `instrumentation-client.ts`. Remove `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, and `NEXT_PUBLIC_SENTRY_DSN` from schemas and `.env.example`.

- [ ] **Step 4: Validate and commit**

```powershell
pnpm exec vitest run tests/unit/observability/observability-ownership.test.ts
pnpm typecheck
rg -n --glob '!node_modules/**' --glob '!.next/**' 'Sentry|sentry|@sentry|SENTRY_' .
git diff --check
git add package.json pnpm-lock.yaml instrumentation.ts next.config.ts lib/errors/logger.ts lib/config/env.ts .env.example tests/unit/observability/observability-ownership.test.ts
git add -u instrumentation-client.ts sentry.client.config.ts sentry.edge.config.ts sentry.server.config.ts
git commit -m "chore: remove Sentry and consolidate observability"
```

Expected: the test and typecheck pass; active runtime/config/env files contain no Sentry references.

---

### Task 3: Make production environment validation fail closed

**Files:**
- Modify: `scripts/validate-env.ts`
- Modify: `lib/config/env.ts`
- Modify: `package.json`
- Modify: `.env.example`
- Create: `tests/unit/config/validate-env.test.ts`

**Interfaces:**
- Consumes: `NodeJS.ProcessEnv` and the existing Zod environment schema.
- Produces: `validateEnvironment(env, mode)` returning `{ errors: string[]; warnings: string[] }`, with `mode` equal to `'local'` or `'production'`.

- [ ] **Step 1: Define the validation result contract and failing tests**

Add to `scripts/validate-env.ts`:

```ts
export type EnvValidationMode = 'local' | 'production'
export interface EnvValidationResult {
  errors: string[]
  warnings: string[]
}
```

Create `tests/unit/config/validate-env.test.ts` with these assertions:

```ts
import { describe, expect, it } from 'vitest'
import { validateEnvironment } from '@/scripts/validate-env'

const validProductionEnv = {
  DATABASE_URL: 'https://db.example.test/production',
  BETTER_AUTH_SECRET: 'test-secret-with-more-than-32-characters',
  BETTER_AUTH_URL: 'https://flowintent.com',
  NEXT_PUBLIC_SITE_URL: 'https://flowintent.com',
  CRON_SECRET: 'cron-secret-with-more-than-16-characters',
  GOOGLE_CLIENT_ID: 'google-client-id',
  GOOGLE_CLIENT_SECRET: 'google-client-secret',
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'google-client-id',
  POLAR_ACCESS_TOKEN: 'polar-token',
  POLAR_PRODUCT_ID: 'polar-product',
  POLAR_WEBHOOK_SECRET: 'polar-webhook-secret',
  AI_GATEWAY_API_KEY: 'gateway-key',
  DATAFORSEO_USERNAME: 'dataforseo-user',
  DATAFORSEO_PASSWORD: 'dataforseo-password',
}

describe('validateEnvironment', () => {
  it('accepts a complete production contract', () => {
    expect(validateEnvironment(validProductionEnv, 'production').errors).toEqual([])
  })

  it('rejects missing production values', () => {
    expect(validateEnvironment({}, 'production').errors).toEqual(expect.arrayContaining([
      'Missing required variable: DATABASE_URL',
      'Missing required variable: BETTER_AUTH_SECRET',
      'Missing required variable: CRON_SECRET',
    ]))
  })

  it('allows local development without production integrations', () => {
    expect(validateEnvironment({}, 'local').errors).toEqual([])
  })
})
```

Run `pnpm exec vitest run tests/unit/config/validate-env.test.ts`; it must fail before the exported function and production mode exist.

- [ ] **Step 2: Implement the production contract**

Require every production variable in this exact list: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `POLAR_ACCESS_TOKEN`, `POLAR_PRODUCT_ID`, and `POLAR_WEBHOOK_SECRET`. Require at least one model key from `AI_GATEWAY_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `XAI_API_KEY`, or `PERPLEXITY_API_KEY`, and require both DataForSEO credentials. Reject empty strings and placeholder URLs. Local mode validates shape but does not enforce the production list.

- [ ] **Step 3: Wire strict mode into prebuild**

Set the package scripts to:

```json
{
  "validate:env": "tsx scripts/validate-env.ts",
  "validate:env:local": "tsx scripts/validate-env.ts --mode local",
  "prebuild": "pnpm validate:env --mode production"
}
```

Parse `--mode local` and `--mode production`, defaulting to production for builds. Document the relaxed local command in `.env.example`.

- [ ] **Step 4: Validate and commit**

```powershell
pnpm exec vitest run tests/unit/config/validate-env.test.ts
pnpm validate:env --mode local
pnpm typecheck
git diff --check
git add scripts/validate-env.ts lib/config/env.ts package.json .env.example tests/unit/config/validate-env.test.ts
git commit -m "fix: fail production builds on invalid environment"
```

Expected: local mode succeeds without production secrets and `pnpm build` cannot swallow production validation failures.

---

### Task 4: Normalize pnpm, Node, AI SDK, and canonical architecture documentation

**Files:**
- Modify: `README.md`, `AGENTS.md`, `tests/README.md`, `playwright.config.ts`, `package.json`, `.env.example`
- Modify: `app/privacy/page.tsx`, `lib/faq.ts`, `lib/product/elevator-pitch.ts`
- Modify: `docs/specs/platform-modes.md`, `docs/guided-workflows.md`, `docs/langfuse-setup.md`, `docs/langfuse-checklist.md`, `docs/directus-verification-report.md`, `docs/code-review-summary.md`
- Test: repository-wide search assertions below

**Interfaces:**
- Consumes: current package metadata and canonical architecture in `AGENTS.md`.
- Produces: one setup contract stating Node >=22, pnpm 11.5.0, AI SDK 7, Better Auth, Neon/Drizzle, Vercel, and supporting VPS services.

- [ ] **Step 1: Correct active package commands**

Change `playwright.config.ts` to `command: 'pnpm dev'`. Change `package.json` scripts that invoke `npx tsx` or `npx mcp` to `pnpm exec tsx` or `pnpm exec mcp`. Do not add npm scripts.

- [ ] **Step 2: Rewrite canonical setup and product docs**

Update README prerequisites and setup to state Node.js 22+, pnpm 11.5.0, Neon PostgreSQL/Drizzle, Better Auth with Google OAuth, Next.js 16, React 19, Vercel AI SDK 7, Vercel hosting, and VPS geomode services. Replace canonical `npm install`, `npm run`, and `npm ci` instructions with pnpm equivalents. Replace user-facing AI SDK 6 claims with AI SDK 7.

- [ ] **Step 3: Remove stale live architecture claims**

Update privacy copy from Supabase to Neon/Drizzle and Upstash where accurate. Update `lib/faq.ts`, `lib/product/elevator-pitch.ts`, `docs/specs/platform-modes.md`, and `docs/guided-workflows.md` to AI SDK 7. Mark historical Supabase/Clerk/Sanity documents as reference-only in the audit rather than presenting them as active architecture. Keep compatibility filenames such as `tool-schema-validator-v6.ts` unchanged until usage is proven.

- [ ] **Step 4: Verify and commit**

```powershell
rg -n --glob '!node_modules/**' --glob '!.next/**' --glob '!pnpm-lock.yaml' 'npm (install|ci|run)|AI SDK 6|Supabase|Clerk|Sanity' README.md AGENTS.md tests docs app lib package.json playwright.config.ts .env.example
pnpm lint
pnpm typecheck
git diff --check
git add README.md AGENTS.md tests/README.md playwright.config.ts package.json .env.example app/privacy/page.tsx lib/faq.ts lib/product/elevator-pitch.ts docs/specs/platform-modes.md docs/guided-workflows.md docs/langfuse-setup.md docs/langfuse-checklist.md docs/directus-verification-report.md docs/code-review-summary.md
git commit -m "docs: normalize pnpm and production architecture"
```

Expected: active setup/configuration uses pnpm; remaining legacy matches have an explicit audit disposition.

---

### Task 5: Review and port the narrow Better Auth fix from PR #75

**Files:**
- Modify: `app/dashboard/layout.tsx`, `lib/auth/admin.ts`, `tests/unit/dashboard-subscription-guard.test.ts`
- Test: `tests/unit/pricing-flow.test.ts`, `tests/unit/polar-webhook.test.ts`

**Interfaces:**
- Consumes: PR #75 patch and current subscription guards.
- Produces: authenticated users reach the dashboard without a layout-level Polar redirect while premium API routes remain subscription-gated.

- [ ] **Step 1: Inspect the patch and guard call sites**

```powershell
git diff origin/main...origin/pr-75 -- app/dashboard/layout.tsx lib/auth/admin.ts tests/unit/dashboard-subscription-guard.test.ts
rg -n 'requireSubscription|requireApiSubscription|isAdminEmail|ADMIN_EMAIL' app lib tests
```

- [ ] **Step 2: Add regression assertions**

Ensure the dashboard test proves the layout no longer calls `requireSubscription`, premium API routes still call `requireApiSubscription`, and admin lookups accept `LIAM@FLOWINTENT.COM` and `LIAM.WILSON1990@GMAIL.COM`.

- [ ] **Step 3: Port the smallest safe change**

Remove only `requireSubscription('/billing/checkout')` from the dashboard layout. Normalize all admin allowlist entries with `.map((email) => email.toLowerCase())` and lowercase the lookup input. Keep API-level gates unchanged.

- [ ] **Step 4: Validate and commit**

```powershell
pnpm exec vitest run tests/unit/dashboard-subscription-guard.test.ts tests/unit/pricing-flow.test.ts tests/unit/polar-webhook.test.ts
pnpm typecheck
git diff --check
git add app/dashboard/layout.tsx lib/auth/admin.ts tests/unit/dashboard-subscription-guard.test.ts
git commit -m "fix: keep authenticated users out of the checkout redirect loop"
```

Use `github_add_review_to_pr` with `action: "COMMENT"` on PR #75 to record the validated port and remaining concerns.

---

### Task 6: Review and selectively port PR #78 chatbot reliability fixes

**Files:**
- Port only after patch inspection: `lib/errors/provider-errors.ts`, `lib/chat/tool-timeout.ts`, `lib/artifacts/normalize-keyword-data.ts`
- Modify if selected: `lib/chat/stream-builder.ts`, `lib/chat/tool-assembler.ts`, `components/chat/ai-chat-interface.tsx`, `components/chat/tool-ui/serp-table.tsx`, `components/chat/tool-ui/tool-error-card.tsx`, `components/chat/artifacts/toast-artifact.tsx`
- Create or port tests: `tests/unit/errors/provider-errors.test.ts`, `tests/unit/chat/tool-timeout.test.ts`, `tests/unit/artifacts/normalize-keyword-data.test.ts`

**Interfaces:**
- Consumes: PR #78 provider-error, tool-timeout, artifact-normalization, and start-fresh behavior.
- Produces: safe stable provider errors, bounded tool execution, correct artifact normalization, and no duplicate retry message.

- [ ] **Step 1: Read exact patches and exclude unrelated payloads**

```powershell
git diff origin/main...origin/pr-78 -- lib/errors/provider-errors.ts lib/chat/tool-timeout.ts lib/artifacts/normalize-keyword-data.ts lib/chat/stream-builder.ts lib/chat/tool-assembler.ts components/chat/ai-chat-interface.tsx
```

Exclude the Cursor-style global restyle and archived Supabase migrations.

- [ ] **Step 2: Add failure-focused tests**

Require tests for provider rate-limit classification, a five-millisecond tool timeout returning `{ status: 'error' }`, empty keyword artifact normalization, and retrying a failed user submission without appending a duplicate user message.

- [ ] **Step 3: Port minimal implementations using AI SDK 7**

Expose only stable error codes, safe messages, and retryability. Clear timeout handles in resolve and reject paths. Preserve current AI SDK 7 stream and tool interfaces; do not reintroduce `experimental_*` APIs.

- [ ] **Step 4: Validate, commit, and review**

```powershell
pnpm exec vitest run tests/unit/errors/provider-errors.test.ts tests/unit/chat/tool-timeout.test.ts tests/unit/artifacts/normalize-keyword-data.test.ts tests/unit/artifacts/registry.test.ts tests/unit/chat/message-handler.test.ts
pnpm typecheck
git diff --check
git add lib/errors lib/chat lib/artifacts components/chat tests/unit
git commit -m "fix: bound chatbot tool failures and sanitize provider errors"
```

Post a `COMMENT` review on PR #78 describing ported and excluded changes.

---

### Task 7: Fix verified security and reliability blockers from PR #82

**Files:**
- Modify: `services/geomode-companion/migrations/002_elmo_summary_views.sql`, `lib/chat/persistence.ts`, `services/geomode-companion/src/api/server.ts`, `lib/geo/digest-service.ts`, `lib/geo/crawlability-audit.ts`, `lib/geo/elmo-provisioning.ts`, `lib/auth-config.ts`, `components/chat/ai-chat-interface.tsx`, `lib/chat/data-part-normalizers.ts`
- Modify: `scripts/deploy/geomode-vultr-bootstrap.sh`, `scripts/deploy/geomode-companion-redeploy.py`, `scripts/deploy/geomode-vps-configure.py`
- Test: corresponding unit tests under `tests/unit/chat`, `tests/unit/geo`, and `services/geomode-companion/src`

**Interfaces:**
- Consumes: verified unresolved review findings from PR #82 and current-main implementations.
- Produces: starting migrations, tenant-safe message persistence, loopback-only internal companion endpoints, deterministic robots matching, stable GEO fallback behavior, and collision-resistant Elmo brand IDs.

- [ ] **Step 1: Fix migration syntax**

Replace both `CREATE VIEW IF NOT EXISTS` statements in `services/geomode-companion/migrations/002_elmo_summary_views.sql` with `CREATE OR REPLACE VIEW`. Add a static test asserting the invalid syntax is absent and expected view names remain. Do not connect to Neon.

- [ ] **Step 2: Prevent cross-conversation message-ID collisions**

Add a resolver in `lib/chat/persistence.ts` that accepts `clientMessageId` and `conversationId`, validates UUID format, queries for an existing row scoped to both IDs, and generates `crypto.randomUUID()` when the client ID belongs to another conversation or is malformed. Use it in every save/upsert path. Test same-conversation replay, foreign-conversation reuse, malformed UUID, and generated IDs.

- [ ] **Step 3: Isolate and bound the companion API**

Bind with `server.listen(config.READ_API_PORT, '127.0.0.1')`. Make `readJsonBody` reject content over 1 MiB with 413 and stop reading after the limit. Validate `/trends?days=` as a finite integer from 1 through 90 and return 400 otherwise. Add tests for loopback binding, oversize payloads, and `days=abc`.

- [ ] **Step 4: Fix partial GEO and robots behavior**

Retain valid remote suggestions when the suggestions request fails after the digest request succeeds. Replace literal-prefix-only robots matching with a matcher supporting `*` and trailing `$`; equal-length Allow and Disallow matches must prefer Allow. Add focused tests.

- [ ] **Step 5: Secure identity and chat UI behavior**

Derive Elmo brand IDs from a SHA-256 digest of the complete user ID. Keep `accountLinking.requireLocalEmailVerified: true` and correct the misleading comment rather than weakening account-linking security. Set visible bootstrap error state, prevent duplicate retry submissions, and leave unrelated tool results unclassified in `data-part-normalizers.ts`. Add tests for each behavior.

- [ ] **Step 6: Harden deployment helpers without touching the VPS**

Make the geomode bootstrap fail when UFW is missing or inactive, bind app ports to loopback in the deployment configuration, and address IPv6/persistence behavior required by the actual firewall path. Remove the password-only early failure when the documented SSH key exists. Fix commented `.env` key detection. Run:

```powershell
bash -n scripts/deploy/geomode-vultr-bootstrap.sh
python -m py_compile scripts/deploy/geomode-companion-redeploy.py scripts/deploy/geomode-vps-configure.py
```

- [ ] **Step 7: Validate and commit by concern**

```powershell
pnpm exec vitest run tests/unit/chat tests/unit/geo
pnpm typecheck
git diff --check
git add services/geomode-companion/migrations/002_elmo_summary_views.sql lib/chat/persistence.ts tests/unit/chat
git commit -m "fix: protect persisted chat messages across conversations"
git add services/geomode-companion/src lib/geo tests/unit/geo
git commit -m "fix: harden companion and GEO failure boundaries"
git add scripts/deploy
git commit -m "fix: harden geomode deployment helpers"
```

Post `REQUEST_CHANGES` on PR #82 if any unported P0/P1 finding remains; otherwise post a `COMMENT` disposition.

---

### Task 8: Reconcile the remaining overlapping PRs and publish review decisions

**Files:**
- Modify: `docs/audits/production-readiness-audit.md`
- No application files from PR #76/#79/#81/#83/#74 unless a specific regression is proven against `origin/main`
- GitHub state: PRs #76, #79, #81, #83, and #74; PR #82 after Task 7

**Interfaces:**
- Consumes: audit evidence, selected commits, current checks, and unresolved review threads.
- Produces: explicit GitHub review decisions and a final reconciliation table with no duplicate merge path.

- [ ] **Step 1: Close or retain PR #76 based on merged #77/#80**

Compare `origin/pr-76` to `origin/main` and `origin/pr-77`. If no unique current-main regression exists, post a `COMMENT` review stating mode alignment is superseded and close #76 as superseded after any needed regression fix is present in this branch.

- [ ] **Step 2: Treat PRs #79 and #81 as one overlapping change family**

Compare merge bases, changed filenames, package-lock/npm artifacts, AI SDK migration, Sentry, PostHog, Magic UI, and large deletions. Do not merge either wholesale. Port only pnpm/documentation facts and independently tested fixes covered by Tasks 2–4. Post `REQUEST_CHANGES` reviews explaining the overlap and close them as superseded once the clean branch is published.

- [ ] **Step 3: Review PR #83 as a reference rescue**

Do not import the 190-file skills library or `.planning/` payload. Verify the unresolved profile-RAG ownership and wiring findings against current main. Post `REQUEST_CHANGES` if the PR still presents dead or cross-tenant profile RAG code; otherwise post a `COMMENT` disposition and retain it as reference.

- [ ] **Step 4: Review PR #74 as documentation-only reference**

Compare its npm, database, authentication, and build claims with the current branch. Port corrected facts into the canonical README/audit, post a `COMMENT` review, and close it as superseded if it has no unique value.

- [ ] **Step 5: Complete the audit table**

For every requested PR record final action, exact commit(s) ported, review URL, unresolved risks, and exclusion reason. Do not mark a PR fixed unless the fix exists in the reconciliation branch and focused validation passes.

- [ ] **Step 6: Commit the reconciliation record**

```powershell
git diff --check
git add -f docs/audits/production-readiness-audit.md
git commit -m "docs: reconcile overlapping production readiness PRs"
```

---

### Task 9: Run the pre-CI production baseline and complete the audit

**Files:**
- Modify: `docs/audits/production-readiness-audit.md`
- Create if needed: `docs/audits/production-readiness-validation.log.md`
- Test: package, lint, typecheck, unit/integration, environment, and build commands below

**Interfaces:**
- Consumes: all prior commits and safe placeholder environment values.
- Produces: honest validation evidence and a list of blockers for the later CI/E2E phase.

- [ ] **Step 1: Reinstall reproducibly with pnpm**

```powershell
pnpm install --frozen-lockfile
pnpm --version
node --version
```

Expected: pnpm 11.5.0, Node >=22, and a successful frozen install. If installation fails or times out, record the exact error and do not claim tests passed.

- [ ] **Step 2: Run static and focused validation**

```powershell
pnpm lint
pnpm typecheck
pnpm exec vitest run tests/unit
pnpm exec vitest run tests/integration
pnpm validate:env --mode local
git diff --check
```

Record each exit code and test count separately. No test may use production Neon or production credentials.

- [ ] **Step 3: Run a safe production build**

Use a temporary process environment containing only syntactically valid non-secret placeholders for the production validation contract, then run `pnpm build`. Expected: strict prebuild validation runs and the Next.js production build completes without swallowing validation errors. Remove the temporary environment after the command.

- [ ] **Step 4: Complete the audit status and blockers**

Add command, date, branch, commit SHA, result, and limitations to the audit. Explicitly list deferred CI/E2E, production smoke, provider-contract, browser, Autonoma, VPS, backup/restore, and branch-protection work as incomplete.

- [ ] **Step 5: Commit the evidence**

```powershell
git diff --check
git add -f docs/audits/production-readiness-audit.md
git commit -m "docs: record pre-CI production validation"
```

---

### Task 10: Publish the reconciliation branch for review

**Files:**
- No additional application files
- GitHub: branch and draft PR

**Interfaces:**
- Consumes: validated reconciliation branch and completed audit.
- Produces: pushed `codex/production-readiness-pr-reconciliation` and a draft PR targeting `main`; overlapping PRs remain linked as evidence until dispositions are applied.

- [ ] **Step 1: Confirm the publish allowlist**

```powershell
git status --short --branch
git diff origin/main...HEAD --stat
git diff origin/main...HEAD --check
```

Expected: only planned audit, docs, tests, and production-hardening files are present; unrelated dirty-main files are absent.

- [ ] **Step 2: Push and open a draft PR**

Use the GitHub publish workflow after loading its skill. Push only `codex/production-readiness-pr-reconciliation` and create a draft PR targeting `main` with the audit, validation limitations, deferred CI/E2E scope, and links to reviewed PRs.

- [ ] **Step 3: Final handoff for the next phase**

Return branch, commit list, draft PR link, files changed, commands/results, unresolved risks, and exact next actions. Do not claim production-ready, CI-ready, or E2E-ready until the deferred phases are complete.

## Plan self-review

- Spec coverage: PR inventory, selective integration, Sentry removal, pnpm normalization, strict env validation, security fixes, audit evidence, and deferred CI/E2E are mapped to tasks above.
- Placeholder scan: no incomplete-marker vocabulary or unspecified owner appears in the plan.
- Type consistency: `validateEnvironment(env, mode)` and `EnvValidationResult` are defined in Task 3 and used consistently by its tests and script.
- Safety: database validation is prohibited from using production Neon; VPS work is limited to repository deployment-script hardening and no SSH mutation.
