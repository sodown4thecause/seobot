# Platform modes alignment (landing + dashboard)

**Status:** Superseded for product truth  
**Canonical spec:** [platform-modes.md](./platform-modes.md)  
**Elevator pitch:** `lib/product/elevator-pitch.ts`

This file retains the original P0 implementation checklist. For mode definitions, UX, GEO engines, Content Zone deprecation, and marketing rules, use **platform-modes.md**.

## P0 (done)

1. `lib/chat/modes.ts` — `CHAT_MODE_UI`, accent class tokens, helpers.
2. Chat selector + content empty state use shared config (amber, “Content Mode”).
3. FAQ “Platform Modes” section — aligned with platform-modes.md (2026-06-03).
4. Landing “Three Modes” — elevator pitch + intro from `lib/product/elevator-pitch.ts`.
5. Sidebar grouped: SEO & content data vs GEO / AEO.

## P1

- [x] Persist `chatMode` on `conversations.metadata`
- [x] Deep-link `/dashboard?mode=geo`
- [x] Content Zone routes redirect to `/dashboard?mode=content`; brief API returns 410
- [ ] Landing hero dual-track test (Reddit lead magnet vs platform modes)
