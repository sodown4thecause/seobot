# Platform modes alignment (landing + dashboard)

**Status:** Active checklist  
**Last updated:** 2026-07-04  
**Canonical spec:** [platform-modes.md](./platform-modes.md)  
**Elevator pitch:** `lib/product/elevator-pitch.ts`

## P0 (done)

1. `lib/chat/modes.ts` — `CHAT_MODE_UI`, accent tokens.
2. Chat selector + empty states use shared config.
3. FAQ Platform Modes — chat → artifacts → workspace.
4. Landing three modes + elevator pitch (`components/landing/mode-skill-picker.tsx`).
5. Workspace UI at `/dashboard/workspace` (legacy `/dashboard/content-zone` kept).

## P1 (done)

- [x] Persist `chatMode` on conversations
- [x] Deep-link `/dashboard?mode=geo`
- [x] Restore workspace routes (no redirect/410)
- [x] Sidebar: Workspace link → `/dashboard/workspace`
- [x] Artifact registry in `lib/artifacts/registry.ts`
- [x] Library API (`/api/library`, `/api/library/save`)
- [x] GEO Elmo client + digest tools (`lib/geo/elmo-client.ts`)

## P2 (in progress)

- [ ] Landing hero dual-track (Reddit vs platform)
- [ ] Full artifact type coverage in workspace browser
- [ ] Elmo run API as default GEO engine path (OneGlanse facade fallback)

## Docs sync (2026-07-04)

- [x] `README.md` — FlowIntent product overview
- [x] `AGENTS.md` + `app/`, `lib/`, `components/` AGENTS.md
- [x] This checklist + `platform-modes.md` workspace routes
