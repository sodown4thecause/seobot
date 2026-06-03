# Platform modes alignment (landing + dashboard)

**Status:** Implemented (P0)  
**Branch:** `cursor/platform-modes-alignment-e7f8`

## Problem

Marketing (landing), chat (dashboard home), and analytics sidebars describe the same three capabilities with inconsistent naming, colors, and FAQ coverage.

## Product model

| Mode ID | User-facing name | Accent | Chat agent | RAG namespace |
|---------|------------------|--------|------------|---------------|
| `seo` | SEO Mode | emerald | `seo-aeo` | `seo` |
| `geo` | GEO / AEO | violet | `geo` | `geo` |
| `content` | Content Mode | amber | `content` | `content` |

## P0 (done)

1. `lib/chat/modes.ts` — `CHAT_MODE_UI`, accent class tokens, helpers.
2. Chat selector + content empty state use shared config (amber, “Content Mode”).
3. FAQ “Platform Modes” section.
4. Landing “Three Modes” CTAs: Open platform + Reddit audit.
5. Sidebar grouped: SEO & content data vs GEO / AEO.

## P1 (later)

- Persist mode per conversation; deep-link AEO Insights → `?mode=geo`.
- Landing hero dual-track test.

## Acceptance

- [x] Shared mode config
- [x] Content UI alignment
- [x] FAQ + landing CTA
- [x] Sidebar groups
- [x] `tests/unit/chat/modes.test.ts`
