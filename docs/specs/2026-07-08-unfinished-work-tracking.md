# Unfinished Work Tracking

**Created:** 2026-07-08
**Purpose:** Track unfinished plans, specs, and remaining work after git worktree/branch audit

---

## PRs Created This Session

| PR | Branch | Title | Status |
|----|--------|-------|--------|
| #80 | `codex/aisa-seo-geo-social-plan` | Add AIsa SEO GEO and social integrations | OPEN (updated with doc reorg + PostHog) |
| #79 | `feat/phase-3b-chat-polish` | Complete pnpm, Magic UI, landing, and chat polish plan | OPEN |
| #81 | `feat/platform-modes-workspace-docs-sync` | Post-#77 cleanup, pnpm migration, Magic UI landing redesign | OPEN (NEW) |
| #82 | `badlands-rattler` | Repo cleanup — doc reorganization, asset moves, AGENTS.md files | OPEN (NEW) |
| #83 | `rescue/mtjz-skills-and-planning` | Rescue agent skills library (190 files), planning docs, unique modules | OPEN (NEW) |
| #78 | `cursor/chatbot-test-cursor-ui-67cb` | Cursor-style UI, AGENTS.md, repo cleanup, chatbot UX fixes | OPEN |
| #76 | `cursor/platform-modes-alignment-e7f8` | Align SEO, GEO/AEO, and Content modes across landing and dashboard | OPEN |
| #75 | `fix/google-login-dashboard-access` | Fix auth bouncing signed-in users to Polar checkout | OPEN |
| #74 | `cursor/setup-dev-environment-e0f1` | Document Cursor Cloud dev environment setup | OPEN |

### Merge Order Recommendation

1. **PR #81** (pnpm migration + Magic UI + cleanup) — foundational, PRs #79/#80 depend on it
2. **PR #83** (agent skills rescue) — independent, safe to merge anytime
3. **PR #82** (repo cleanup) — may conflict with #81 on file moves vs deletions; coordinate
4. **PR #80** (AIsa integration) — after #81 merges, rebase onto main
5. **PR #79** (chat polish) — after #81 merges, rebase onto main
6. **PRs #78, #76, #75, #74** — evaluate independently

---

## Unfinished Spec Work

### 1. AIsa Integration — Phases 4-7 Remaining
**Doc:** `docs/specs/2026-07-07-aisa-seo-geo-social-plan.md`
**Status:** Phases 1-3 implemented; Phases 4-6 partially implemented

| Phase | Description | Remaining Work |
|-------|-------------|----------------|
| 4 | Social signals | X/Twitter search path unknown; Exa social fan-out not wired |
| 5 | Search Console | Re-consent flow; GSC API integration incomplete |
| 6 | Fortnightly research | Firecrawl/Jina source scoring; retrieval-time boosting |
| 7 | Cost controls | Cost guardrails; Langfuse telemetry integration |

**Next step:** Wire Exa social fan-out (Phase 4) and Search Console re-consent (Phase 5)

### 2. Architecture Fix Plan — Phases 1.2-4 Not Started
**Doc:** `docs/IMPROVEMENT_PLAN.md`
**Status:** Phase 1.1 complete (MCP import violation fix); rest pending

| Phase | Description | Status |
|-------|-------------|--------|
| 1.2-1.4 | Standardize agent IDs, type-safe tool results, abort signal handling | NOT STARTED |
| 2 | Chat route refactor | NOT STARTED |
| 3 | Tool registry centralization | NOT STARTED |
| 4 | Testing infrastructure | NOT STARTED |

**Next step:** Phase 1.2 — standardize agent IDs across router and tool assembler

### 3. Platform Modes Alignment — P2 Items
**Doc:** `docs/specs/platform-modes-alignment.md`
**Status:** P0 and P1 done; P2 in progress (3 unchecked items)

- [ ] Landing hero dual-track (free + paid)
- [ ] Full artifact type coverage in workspace browser
- [ ] Elmo run API as default GEO engine path

**Next step:** Wire Elmo run API as default GEO engine path

### 4. geomode VPS Bring-up
**Doc:** `docs/specs/2026-06-12-geomode-geo-tracking-design.md`
**Status:** Client code exists; VPS stack not deployed

- VPS stack (geomode + companion + cloudflared) needs deployment
- VPS access: Tailscale SSH alias `hermes-vps` (user `hermes`)
- Deploy scripts exist in `scripts/deploy/`

**Next step:** Run `geomode-vultr-bootstrap.sh` on VPS

### 5. Langfuse Observability — 4 Unchecked Items
**Docs:** `docs/langfuse-checklist.md`, `docs/langfuse-setup.md`

- [ ] Prompt management
- [ ] Error rate alerts
- [ ] Cost dashboards
- [ ] Prompt testing datasets

### 6. NextPhase Roadmap — Aspirational (not started)
**Doc:** `docs/nextphase.md`
**Status:** All 20 checkboxes unchecked; vision document for "Action Engine" transformation

- Beginner/practitioner/agency modes
- 4 guided campaigns (ranking, link building, technical audit, local SEO)
- Jargon tooltips, DataForSEO expansion, image agents, dashboard redesign
- Voice input, progress tracking

**Note:** This is aspirational — not a commitment. Prioritize items 1-5 above first.

### 7. GEO/SEO Content Engine PRD
**Doc:** `docs/specs/geo-seo-content-engine-prd.md`
**Status:** Aspirational PRD — no implementation evidence

- 10 visual GEO artifacts
- Content engine with ScrapingBee
- Vultr nodes for crawling

**Note:** No implementation started. Evaluate after AIsa phases complete.

---

## Worktree Status (Post-Cleanup)

| Worktree | Branch | Status |
|----------|--------|--------|
| Main repo | `codex/aisa-seo-geo-social-plan` | Active (PR #80) |
| `.worktrees/phase-3b-chat-polish` | `feat/phase-3b-chat-polish` | Active (PR #79) |
| `acequia-mesquite` (Warp) | `acequia-mesquite` | Local-only, has geomode bootstrap work |
| `badlands-rattler` (Warp) | `badlands-rattler` | PR #82 created |
| `mtjz` (Cursor) | `rescue/mtjz-skills-and-planning` | PR #83 created, safe to remove after merge |

### Removed This Session
- `seobot-pr72` (PR #72 merged)
- `seobot-pr62-merge` (PR #62 merged)
- `emdash/archon-start-plugin-6gbsf` (PR #70 merged)
- `emdash/jolly-games-boil-rjewj` (PR #77 merged)
- `emdash/wide-frogs-think-m3odb` (PR #77 merged)
- `pumice-mesa` (merged)
- `pyrite-mesa` (merged)

### Branches Deleted: 50+ merged branches pruned

---

## Stashes (11 — evaluate for useful work)

| Stash | Branch | Description |
|-------|--------|-------------|
| @{0} | cursor/5972f0a3 | WIP on detached HEAD |
| @{1} | codex/geo-mode-separation | wip-pr62-review-fixes |
| @{2} | main | Landing page YouTube embed |
| @{3-4} | fix/chat-latency-rag-timeout | Duplicate WIP stashes |
| @{5} | feat/dashboard-audit-rank-tracker | temp package-lock |
| @{6} | feat/chat-first-seo-intel-platform | pre-uninstall cleanup |
| @{7-8} | feat/improvement-plan-2026 | Duplicate WIP stashes (Clerk webhook) |
| @{9} | feature/nextphase-complete-implementation | Supabase to Drizzle conversion |
| @{10} | main | Old merge WIP |

**Recommendation:** Drop stashes @{3-5} (duplicate/temp). Evaluate @{2} (YouTube embed) and @{9} (Drizzle conversion) for useful work.
