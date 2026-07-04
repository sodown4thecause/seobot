# FlowIntent platform modes — product spec

**Status:** Active  
**Last updated:** 2026-07-04  
**Canonical pitch:** `lib/product/elevator-pitch.ts`  
**UI config:** `lib/chat/modes.ts`

---

## Elevator pitch

> FlowIntent is three paywalled AI chat modes—SEO, GEO / AEO, and Content—over live search data and AI visibility checks. Ask in plain English, inspect tool results as artifacts, and save what matters to your workspace. Start free with the Reddit content gap audit.

---

## 1. Access model

| Surface | Auth | Role |
|---------|------|------|
| **`/reddit-gap`** | Public / light gate | **Lead magnet** — Reddit content gap audit, 60s brief |
| **`/dashboard/*`** | Signed-in, **paywalled** | **Core product** — mode-aware chat, artifacts, workspace |

Marketing leads with Reddit; conversion is into the paywalled dashboard. Do not describe the dashboard as free.

---

## 2. Problem statement

FlowIntent began as **SEO chat** with **live DataForSEO** via **AI SDK 6**.

Three distinct jobs emerged:

1. **SEO** — rankings, keywords, SERPs, backlinks, technical.
2. **GEO / AEO** — mentions and citations in AI answer engines (same lane; see §4).
3. **Content** — research-first drafts, images, metadata.

Each job needs different **tools, prompts, and RAG namespace**. **Modes** isolate them so SEO threads do not pull GEO memory (and vice versa).

**Suggested journey (optional):** SEO discover → GEO / AEO measure → Content publish.

---

## 3. Core UX model

```
Reddit gap audit (lead)  →  sign up  →  Paywalled dashboard

Chat (SEO | GEO/AEO | Content mode)
        ↓
Artifacts (AI SDK 6 tool UI — any mode)
        ↓
Workspace (saved library — all modes)
```

### 3.1 Chat (primary)

- One **streaming chat** per conversation.
- **Mode selector:** SEO Mode · GEO / AEO Mode · Content Mode.
- Each mode is an **AI SDK 6** lane: own agent, tools, and RAG filter (`agent_documents.mode`).
- Mode on `conversations.metadata.chatMode`; deep link `/dashboard?mode=seo|geo|content`.

**Content Mode** is a chat mode only—not a separate app. Long-form output uses tools such as `create_content_package` (`lib/chat/stream-builder.ts`).

### 3.2 Artifacts

An **artifact** is a **structured UI object** produced by **AI SDK 6 tool calls** in chat. Artifacts are mode-agnostic in pattern: any mode can emit them; the side panel renders the result.

| Artifact (examples) | Typical mode | Tool / source |
|---------------------|--------------|---------------|
| Keyword metrics table | SEO | `suggest_keywords` |
| Backlink profile | SEO | `n8n_backlinks` |
| GEO / AEO visibility snapshot | GEO / AEO | GEO analysis tools |
| Blog / content package preview | Content | `create_content_package` |
| Competitor watch (planned) | SEO / GEO | TBD |

Implementation: `lib/artifacts/registry.ts`, `lib/artifacts/artifact-store.ts`, `lib/artifacts/sync-from-messages.ts`; side panel in `ai-chat-interface.tsx` / `modern-chat.tsx`; generative UI in `components/chat/generative-ui/registry.tsx`.

**Rule:** Chat is the workbench; artifacts are inspectable tool UI; not everything is an artifact (ephemeral text stays in the thread).

### 3.3 Workspace

The **workspace** is where **saved artifacts and library items** live long-term—blog posts, images, briefs, exports—not the chat transcript.

- **User-facing name:** Workspace (never “Content Zone”).
- **Canonical route:** `/dashboard/workspace` (`components/workspace/workspace-browser.tsx`).
- **Legacy alias:** `/dashboard/content-zone` (kept; redirects/evolves—do not 410).
- **Persistence:** `libraryItems` via `POST /api/library/save` and `GET /api/library`; `create_content_package` writes here.

Code may still live under `components/content-zone/` paths; **do not delete**—evolve into workspace.

---

## 4. Product model — three modes

| Mode ID | User-facing name | Accent | Agent | RAG `mode` | Primary data |
|---------|------------------|--------|-------|------------|--------------|
| `seo` | SEO Mode | emerald | `seo-aeo` | `seo` | DataForSEO live |
| `geo` | GEO / AEO Mode | violet | `geo` | `geo` | ChatGPT, Perplexity, Google AI Overviews |
| `content` | Content Mode | amber | `content` | `content` | Research + content package → workspace |

**Default mode:** `seo`.

### 4.1 SEO Mode

**Job:** Win **Google search** with data-backed chat.

- Keywords, SERP, competitors, backlinks, technical SEO.
- SEO-scoped RAG only.

### 4.2 GEO / AEO Mode

**Job:** Win **AI answers** — mentions and citations, not blue links alone.

**GEO** (Generative Engine Optimization) and **AEO** (Answer Engine Optimization) are **the same product lane**. Use **GEO / AEO** in UI copy; explain both once where helpful. One mode, one accent, one RAG partition.

**Supported engines (public):**

| Key | Label |
|-----|--------|
| `chatgpt` | ChatGPT |
| `perplexity` | Perplexity |
| `google_ai_overview` | Google AI Overviews |

`GEO_ENABLED_ENGINES` · `lib/geo/oneglanse-client.ts`, `lib/geo/brand-tracker.ts`.

**Not in scope today:** DataForSEO AI Optimization premium bundle (~$100/mo). Do not market Claude/Gemini GEO coverage until wired.

### 4.3 Content Mode

**Job:** **Publish** — posts, hero + thumbnail images, metadata, saved to workspace.

- Chat-only creation flow (AI SDK 6 + `create_content_package`).
- Not a fourth product; not separate from the three-mode model.

---

## 5. What we do not market as co-equal pillars

Sidebar may still link labs/legacy routes (Rank Tracker, AEO Insights, Content Performance, etc.). **Public story:** chat → artifacts → workspace. Those pages are optional power-user surfaces, not parallel products.

---

## 6. Technical contracts

### 6.1 Chat API

- `POST /api/chat` accepts `mode: ChatMode`.
- `lib/agents/agent-router.ts` selects agent + tools.
- RAG filters `agent_documents.mode`.

### 6.2 Shared UI

- `CHAT_MODE_UI`, `CHAT_MODE_ACCENT_CLASSES` in `lib/chat/modes.ts`.
- Landing, FAQ, dashboard must import labels/accent from here.

### 6.3 Workspace routes (implementation)

| Path | Purpose |
|------|---------|
| `/dashboard/workspace` | Workspace browser (canonical) |
| `/dashboard/content-zone` | Legacy workspace alias |
| `/dashboard/content` | Content hub |
| `/dashboard/content/zone` | Brief builder |
| `GET/POST /api/library` | List/save workspace items |
| `POST /api/content-zone/brief` | Brief API (workspace pipeline) |

**Do not** redirect these to chat. **Do not** return 410. Rename user-facing strings to **Workspace**; keep `content-zone` as code/route prefix until a rename migration.

---

## 7. Marketing copy rules

1. Site brand: **FlowIntent** only — never **SEOBOT** (repo).
2. Exactly **three modes** on all marketing surfaces.
3. Never user-facing **“Content Zone”** — say **workspace**.
4. GEO engines: name ChatGPT, Perplexity, Google AI Overviews.
5. Reddit gap = lead magnet; dashboard = paywalled core.
6. Funnel SEO → GEO / AEO → Content is suggested, not required.

---

## 8. FAQ & landing alignment

- `lib/faq.ts` — Platform Modes + elevator pitch.
- `components/landing/landing-page-client.tsx` — three modes + `FLOWINTENT_*` from `lib/product/elevator-pitch.ts`.

---

## 9. Acceptance criteria

- [x] Spec documents chat → artifacts → workspace
- [x] Content Mode = AI SDK 6 chat mode only
- [x] Workspace route kept; user copy says Workspace not Content Zone
- [x] GEO / AEO documented as one mode
- [x] Reddit lead magnet vs paywalled dashboard
- [x] Sidebar entry: “Workspace” → `/dashboard/workspace`
- [x] Artifact types documented in `lib/artifacts/registry.ts`
- [x] Workspace browser at `/dashboard/workspace`
- [ ] Workspace UI fully absorbs all artifact types from all modes (in progress)

---

## 10. Related docs

- `docs/geo-mode.md` — GEO cron, env, DB
- `docs/specs/platform-modes-alignment.md` — implementation checklist
