# FlowIntent platform modes — product spec

**Status:** Active  
**Last updated:** 2026-06-03  
**Canonical pitch:** `lib/product/elevator-pitch.ts`  
**UI config:** `lib/chat/modes.ts`

---

## Elevator pitch

> FlowIntent is three AI modes—SEO, GEO / AEO, and Content—over live search data and AI visibility checks, with one paywalled chat workspace and saved artifacts for everything you need to keep.

---

## 1. Problem statement

Early product was **SEO-first**: conversational access to **live DataForSEO endpoints** via **AI SDK 6**, so answers were grounded in real keyword/SERP/backlink data.

Users also needed:

1. **AI answer visibility** — mentions and citations in ChatGPT-class surfaces (GEO / AEO).
2. **Publishable content** — articles, metadata, hero + thumbnail images, persisted for later use.

Those three jobs differ in **tools, prompts, and RAG namespace**. Mixing them in one undifferentiated chat causes wrong tools (e.g. SERP tools on a “are we cited in Perplexity?” question) and polluted retrieval.

**Modes** are the product boundary: one dashboard, three lanes, shared auth and workspace.

---

## 2. Product model

| Mode ID | User-facing name | Accent | Chat agent | RAG `agent_documents.mode` | Primary data |
|---------|------------------|--------|------------|---------------------------|--------------|
| `seo` | SEO Mode | emerald | `seo-aeo` | `seo` | DataForSEO live (keywords, SERP, backlinks, technical) |
| `geo` | GEO / AEO Mode | violet | `geo` | `geo` | ChatGPT, Perplexity, Google AI Overviews (see §4) |
| `content` | Content Mode | amber | `content` | `content` | Research + `create_content_package` → workspace / library |

**Default mode:** `seo` (`DEFAULT_CHAT_MODE`).

**Suggested journey (non-mandatory):** SEO discover → GEO / AEO measure → Content publish.

---

## 3. Mode definitions

### 3.1 SEO Mode

**Job:** Traditional search performance—keywords, SERPs, competitors, backlinks, technical SEO.

**In scope**

- Live DataForSEO-backed tool calls where integrated.
- Plain-English questions (“who ranks for X?”, “audit this URL”).
- SEO-scoped RAG only.

**Out of scope**

- AI mention/citation tracking (GEO / AEO Mode).
- Long-form generation packages (Content Mode).

**Marketing one-liner:** Rank and fix **Google search** with data-backed chat.

---

### 3.2 GEO / AEO Mode

**Job:** **Generative Engine Optimization (GEO)** and **Answer Engine Optimization (AEO)** — visibility in **AI-generated answers**, not blue-link rank alone.

GEO and AEO are **one user-facing lane**: same mode, same accent, same memory partition. Copy may say “GEO / AEO” or explain both acronyms once; do not treat them as separate products.

**In scope**

- Brand mention / citation checks across supported engines.
- Competitor mention comparison on prompt sets.
- GEO-scoped RAG and `geo_runs` / research jobs (see `docs/geo-mode.md`).

**Out of scope (today)**

- Full DataForSEO **AI Optimization** tier (~$100/mo bundle) — not purchased yet; do not promise that bundle on marketing surfaces.
- Claiming coverage for engines we do not run (e.g. do not list Claude/Gemini in GEO copy unless wired).

**Supported engines (public, explicit)**

| Engine key | User-facing label |
|------------|-------------------|
| `chatgpt` | ChatGPT |
| `perplexity` | Perplexity |
| `google_ai_overview` | Google AI Overviews |

Configured via `GEO_ENABLED_ENGINES`. Implementation: `lib/geo/oneglanse-client.ts`, `lib/geo/brand-tracker.ts`.

**Marketing one-liner:** See if **ChatGPT, Perplexity, and Google AI Overviews** name or cite you—and close the gap vs competitors.

**Expansion:** Additional engines may ship without changing the three-mode model; update FAQ and `CHAT_MODE_UI` when new engines go live.

---

### 3.3 Content Mode

**Job:** Research-first **creation**—posts, articles, landing copy, **hero (16:9) + thumbnail images**, metadata—saved to **workspace** / content library.

**In scope**

- Dashboard chat in Content Mode.
- Tool: `create_content_package` (`lib/chat/stream-builder.ts`) — generates copy, images, alt text, captions, library records.
- Content-scoped RAG.

**Deprecated / dead (do not market, remove routes)**

- **Content Zone** standalone wizard (`/dashboard/content-zone`, `/dashboard/content`, `/dashboard/content/zone`).
- **Content Zone brief API** (`/api/content-zone/brief`) and RAG-writer paths tied only to that wizard.
- User-facing copy must **not** reference “Content Zone”; use **Content Mode** + **workspace**.

**Marketing one-liner:** Turn research into **publish-ready posts and images** saved to your workspace.

---

## 4. Paywalled dashboard UX

### 4.1 Primary surface: mode-aware chat

- Single **chat stream** (paywall).
- **Mode selector** (`ChatModeSelector`): three pills, icons, accent dot, responsive labels from `CHAT_MODE_UI`.
- Mode persisted on `conversations.metadata.chatMode`; deep link `/dashboard?mode=geo|seo|content`.
- Empty state hero uses `heroTitle` + `tagline` per mode.

### 4.2 Artifacts sidebar (in-chat)

Persistent UI for tool outputs worth inspecting or saving beside the thread:

- Keyword research panels (`suggest_keywords`)
- Backlink analysis (`n8n_backlinks`)
- Future: competitor watches, saved briefs, etc.

Pattern: `lib/artifacts/artifact-store.ts` + side panel in `modern-chat.tsx` / `ai-chat-interface.tsx`.

**Chat = workbench; artifacts = structured views; workspace = durable library.**

### 4.3 Workspace

Blog posts and content packages saved from Content Mode (library records, not ephemeral messages). User can return, export, or hand off to CMS.

### 4.4 Explicitly not the paywalled story (8A)

Do **not** position separate dashboard apps (Rank Tracker, AEO Insights, Content Performance, etc.) as co-equal product pillars in landing/FAQ mode copy. They may exist as labs or legacy routes; **home is chat + artifacts + workspace**.

Sidebar link groups may remain for power users; marketing spec focuses on three modes only.

---

## 5. Technical contracts

### 5.1 Chat API

- Client sends `mode` on `/api/chat` (validated `ChatMode`).
- Router selects agent + tools by mode (`lib/agents/agent-router.ts`).
- RAG filters `agent_documents.mode` to matching namespace.

### 5.2 Shared UI tokens

- `CHAT_MODE_UI`, `CHAT_MODE_ACCENT_CLASSES` in `lib/chat/modes.ts`.
- Landing, FAQ, and dashboard must not fork labels/colors.

### 5.3 Content Zone removal

| Route | Action |
|-------|--------|
| `/dashboard/content-zone` | Redirect → `/dashboard?mode=content` |
| `/dashboard/content` | Redirect → `/dashboard?mode=content` |
| `/dashboard/content/zone` | Redirect → `/dashboard?mode=content` |
| `POST /api/content-zone/brief` | `410 Gone` + deprecation message |

Keep `components/content-zone/*` only while other pages import `ContentZoneProvider` for profile context; prefer migrating to a neutral `UserProfileProvider` later.

---

## 6. Marketing copy rules

1. Brand on site: **FlowIntent** only — never **SEOBOT** (repo name).
2. Always **three modes**; never imply four products (no Content Zone).
3. GEO engines: name **ChatGPT, Perplexity, Google AI Overviews** on public surfaces (9A).
4. Do not claim DataForSEO GEO premium bundle until purchased.
5. Funnel copy may suggest SEO → GEO → Content order; always allow any order.
6. Reddit gap audit is a **lead magnet**; platform modes are the **paid/core** story.

---

## 7. FAQ alignment

See `lib/faq.ts` → category **Platform Modes** and **FlowIntent Platform** (`What does FlowIntent do?` uses elevator pitch).

Removed: comparison of chat vs “AEO Insights” structured workspace (deprecated narrative).

---

## 8. Landing alignment

See `components/landing/landing-page-client.tsx`:

- **The Platform** intro uses `FLOWINTENT_PLATFORM_MODES_INTRO`.
- Three value props + grid cards match §3 definitions and §4 engines.
- Content Mode mentions **workspace**, not Content Zone.

---

## 9. Acceptance criteria

- [x] `FLOWINTENT_ELEVATOR_PITCH` exported and used in FAQ + landing intro
- [x] `docs/specs/platform-modes.md` is source of truth
- [x] FAQ Platform Modes updated; no AEO Insights vs chat question
- [x] Content Zone routes redirect; brief API returns 410
- [x] `CHAT_MODE_UI.geo` mentions only supported engines
- [ ] Migrate `ContentPerformancePage` off `ContentZoneProvider` (optional cleanup)
- [ ] Delete dead Content Zone page/components after no imports (optional cleanup)

---

## 10. Related docs

- `docs/geo-mode.md` — GEO cron, env, DB tables
- `docs/specs/platform-modes-alignment.md` — historical P0 alignment checklist (superseded by this spec for product truth)
