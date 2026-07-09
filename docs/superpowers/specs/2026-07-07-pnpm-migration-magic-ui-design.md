# Design: pnpm Migration & Magic UI Enhancement

**Date:** 2026-07-07
**Branch:** `feat/platform-modes-workspace-docs-sync`
**Status:** Approved (brainstormed 2026-07-07)

## Objective

Migrate the project from npm to pnpm (strict mode), and enhance the existing landing page and chat interface with a Magic UI aesthetic — sourcing Magic UI components via the official CLI into `components/magicui/`, and porting assistant-ui's visual patterns onto the existing `ai-elements` primitives (no `assistant-ui` package install).

## Decisions (from brainstorming)

1. **Enhance existing code** — do not rebuild the 427-line landing page or 1811-line chat interface from scratch. Polish and restructure.
2. **Port assistant-ui patterns** onto existing `ai-elements` primitives — do not install the `assistant-ui` package (would require re-wiring artifacts, tool-UIs, mode sync, GEO, proactive suggestions).
3. **Magic UI via official CLI** (`npx magicui@latest add`) — copies component source into `components/magicui/`, respects the existing shadcn `components.json`, gives source ownership.
4. **Strict pnpm** — `node-linker=isolated`, `shamefully-hoist=false`, `auto-install-peers=true`, `strict-peer-dependencies=false`. Catches phantom deps; may surface latent import bugs to fix.
5. **Full Magic UI aesthetic shift** — move away from the current dark brutalist look (black bg, `font-black`, `rounded-none`, `border-4`) toward glassmorphism, gradient meshes, neon glow, softer rounded cards.
6. **Landing hero leads with platform/modes** (SEO / GEO / AEO / Content) as the primary value prop; Reddit-gap audit demoted to secondary CTA.
7. **Phased additive approach** — three sequential phases, each gated on verification before the next starts.

## Architecture

Three sequential phases, each verifiable on its own:

```
Phase 1: pnpm migration         Phase 2: Magic UI library       Phase 3: Surface redesigns
─────────────────────────       ────────────────────────        ─────────────────────────
- delete node_modules/          - npx magicui add <components>  - (a) landing restructure
- delete package-lock.json      - lands in components/magicui/  - (b) chat polish
- pnpm import                   - wire Tailwind tokens          - run typecheck + lint
- write .npmrc (strict)         - no app wiring yet             - visual verify dev server
- fix phantom-dep imports       - pnpm dev still boots
- convert overrides → pnpm.overrides
- add packageManager field
- pnpm dev boots clean          GATE: magicui dir exists +      GATE: landing renders,
GATE: pnpm dev boots +          typecheck passes                chat streams, no regressions
typecheck passes
```

### Filesystem impact

- **Phase 1:** `package.json`, `.npmrc` (new), `pnpm-lock.yaml` (new), delete `package-lock.json` + `node_modules/`. Possibly fix a handful of import paths if phantom deps surface.
- **Phase 2:** `components/magicui/` (new dir, ~8 component files). `components/ui/` untouched.
- **Phase 3a:** rewrite `components/landing/landing-page-client.tsx` (keep `Navbar`, `SymbolBackground`, `ModeSkillPicker`, `LandingFaqSection` collaborators). New section components extracted into `components/landing/sections/`.
- **Phase 3b:** edit `components/chat/ai-chat-interface.tsx` (additive — new Composer auto-grow, message state accents, border-beam). Extract `components/chat/composer.tsx` and `components/chat/message-bubble.tsx` for clarity.

**No database, API, or auth changes.** All work is in `package.json`, `components/`, `.npmrc`, and `app/page.tsx` (metadata only).

---

## Phase 1: pnpm Migration

### Steps (in order)

1. **Backup lockfile context:** `pnpm import` reads `package-lock.json` to produce `pnpm-lock.yaml` with the same resolved versions. This must happen *before* deleting `package-lock.json`.

2. **Cleanup:** delete `node_modules/` and `package-lock.json` only *after* `pnpm import` succeeds.

3. **`.npmrc` (new, strict):**
   ```
   node-linker=isolated
   shamefully-hoist=false
   auto-install-peers=true
   strict-peer-dependencies=false
   ```
   `auto-install-peers=true` avoids manual peer resolution headaches; `strict-peer-dependencies=false` avoids hard failures on the many AI SDK peer ranges.

4. **`package.json` edits:**
   - Add `"packageManager": "pnpm@10.x"` (pin to installed pnpm version).
   - Convert top-level `overrides` → `pnpm.overrides` (pnpm reads overrides under the `pnpm` key, not top-level). Keep `jws: "4.0.1"` and `@modelcontextprotocol/sdk: "^1.24.3"`.
   - Update scripts that hardcode `npm run` → `pnpm`: only `prebuild` uses `npm run validate:env`; change to `pnpm run validate:env`. Other scripts don't invoke npm.

5. **Install:** `pnpm install`. The content-addressable store creates symlinks.

6. **Phantom-dep sweep:** `pnpm dev` + `pnpm typecheck`. If either fails on a missing module, that's a phantom dep — add it explicitly to `dependencies` (not devDependencies if used at runtime). Likely candidates given the dep list: `@radix-ui/react-*` (mostly present), `react`/`react-dom` (present). Triage any that surface.

7. **Update `AGENTS.md` commands:** change the npm examples (`npm run dev` etc.) to `pnpm` in the COMMANDS section. AGENTS.md is a generated knowledge base — update the COMMANDS block to match.

### Gates before Phase 2

- `pnpm dev` boots without "Cannot find module" errors.
- `pnpm typecheck` passes.
- `pnpm test:unit` passes (sanity — existing tests should be unaffected).
- No `package-lock.json` remains; `pnpm-lock.yaml` + `.npmrc` present.

### Risk notes

- `@stackframe/stack` is in deps but AGENTS.md says auth is Better Auth — `@stackframe/stack` may be a legacy/transitive dep. If pnpm flags it as unused peer, leave it; don't remove (out of scope).
- `react-server-dom-turbopack` is pinned to `19.2.3` matching React — pnpm strict mode shouldn't break this since it's explicit.

---

## Phase 2: Magic UI Component Library

### Sourcing

`npx magicui@latest add <component>` copies component source (TypeScript + Tailwind) into `components/magicui/` by default. The CLI respects the shadcn `components.json` config that already exists in this project, so Tailwind token wiring stays consistent.

### Components to add

Curated for the spec — hero glow, bento grid, border-beam, marquee:

| Component | Purpose | Used in |
|-----------|---------|---------|
| `BorderBeam` | Animated gradient border on cards | Feature grid cards, chat CTA |
| `Marquee` | Infinite-loop horizontal scroller | Social proof section |
| `BentoGrid` | Responsive bento layout + `BentoCard` | Feature grid (replaces current 3-col) |
| `ShimmerButton` | Glowing/shimmer CTA button | Hero primary CTA |
| `AnimatedShinyText` | Shimmering text for badges/labels | Hero badge, section labels |
| `BorderGlow` / `GlowCard` | Soft outer glow on cards | Platform modes preview |
| `Meteors` | Animated meteor streaks | Hero background accent |
| `GridPattern` | Subtle grid background | Hero section backdrop |
| `AnimatedBeam` | Animated SVG beam between elements | Deferred — add only if Phase 3a needs a mode-flow diagram (not required by acceptance criteria) |

### Storage

All land in `components/magicui/<component>.tsx`. The CLI may also add utils to `lib/magicui.ts` (e.g. `cn` re-export) — point those at the existing `@/lib/utils` `cn` to avoid duplication. If the CLI emits its own `cn`, replace imports with `@/lib/utils`.

### No app wiring this phase

Components exist but aren't imported by any page. Verification:
- `pnpm typecheck` passes (components compile).
- `pnpm dev` still boots (no runtime breakage since nothing imports them yet).
- `ls components/magicui/` shows the expected files.

### Token alignment

Magic UI components use Tailwind utility classes directly (e.g. `bg-background`, `text-foreground`). The project's `globals.css` defines dark-mode tokens; verify the Magic UI components render correctly against the existing token names — if they reference tokens that don't exist (e.g. `bg-muted` when only `bg-zinc-*` is defined), add the missing tokens to `globals.css` rather than patching component source. Keeps upgrades clean.

### Why not more components

`DotPattern`, `Ripple`, `AnimatedGradientText`, `NumberTicker` are nice but YAGNI for this spec. The 9 above cover hero (ShimmerButton, Meteors, GridPattern, AnimatedShinyText), features (BentoGrid, BorderBeam, GlowCard), and social proof (Marquee). Add more later if a section calls for it.

---

## Phase 3a: Landing Page Redesign

### Goal

Restructure `components/landing/landing-page-client.tsx` to lead with the three-mode platform, adopt the Magic UI aesthetic (glassmorphism, gradient meshes, neon glow, softer rounded cards), and use the new Magic UI components. Brutalist sharp-border identity is retired in favor of Magic UI's softer look.

### Section order (top → bottom)

```
1. Navbar (keep existing component, restyle to match)
2. Hero
   - GridPattern backdrop + Meteors accent
   - AnimatedShinyText badge: "Three Modes. One Platform."
   - H1: gradient-text, platform/modes lead
       "Optimize for Google, ChatGPT, and Perplexity — in one platform."
   - Subhead: elevator pitch (FLOWINTENT_ELEVATOR_PITCH)
   - CTAs: ShimmerButton "Open the platform" → /sign-up
           secondary: "Try free Reddit audit" → /reddit-gap
3. Stats strip (keep 60s / 1000s / 50+ but restyle with glass cards)
4. BentoGrid — Features
   - BentoCard: SEO Mode (emerald accent) — Search icon
   - BentoCard: GEO / AEO Mode (violet accent) — Brain icon
   - BentoCard: Content Mode (amber accent) — PenLine icon
   - BorderBeam on hover, GlowCard on the GEO card (hero card, larger)
   - Uses existing FLOWINTENT_PLATFORM_MODES_INTRO copy
5. Marquee — Social proof
   - Infinite horizontal scroller of brand/tool names
     (DataForSEO, Jina, Firecrawl, ChatGPT, Perplexity, Google AI Overviews, Supadata, Reddit)
   - Replaces current static "Powered by" authority bar
6. ModeSkillPicker (keep existing component — interactive three-mode demo)
7. Product demo (keep YouTube embed, restyle container with glass card)
8. LandingFaqSection (keep, restyle)
9. Final CTA section
   - ShimmerButton "Open the platform"
   - Meteors accent
10. Footer (keep, restyle)
```

### File structure

Extract sections into `components/landing/sections/` for clarity (each is one responsibility, independently testable):
- `hero.tsx`
- `stats-strip.tsx`
- `features-bento.tsx`
- `social-proof-marquee.tsx`
- `final-cta.tsx`

`landing-page-client.tsx` becomes a thin composer that imports these + keeps `Navbar`, `ModeSkillPicker`, `LandingFaqSection`, demo, footer inline. ~427 lines → ~80-line composer + 5 focused section files.

### Accent strategy

Keep the three-mode accent system (emerald/violet/amber) but source it from `CHAT_MODE_ACCENT_CLASSES` in `lib/chat/modes.ts` (per the components AGENTS.md rule: "never hardcode emerald/violet/amber per surface"). The BentoCards import accent classes from there.

### Copy hierarchy

Hero leads with platform/modes. Reddit-gap demoted to secondary CTA in hero and a single mention in the final CTA section. The three-mode value prop is the spine.

### Aesthetic tokens

Update `globals.css` if Magic UI components need tokens not present. Shift toward:
- `bg-background` stays dark but cards use `bg-white/[0.03]` + `backdrop-blur` (glass)
- `rounded-xl`/`rounded-2xl` instead of `rounded-none`
- Gradient text via `bg-clip-text text-transparent bg-gradient-to-r`
- Neon glow via `shadow-[0_0_40px_rgba(168,85,247,0.3)]` (violet) etc.

### No copy changes

No changes to elevator pitch / platform modes intro / FAQ content — those are sourced from `lib/product/elevator-pitch.ts` and `lib/faq.ts`. Only layout and visual treatment change.

---

## Phase 3b: Chat Polish

### Goal

Port assistant-ui's visual patterns onto the existing `ai-elements` primitives + `useChat` backend, without installing `assistant-ui`. Additive changes to `components/chat/ai-chat-interface.tsx` (1811 lines) and a couple of extracted components.

### Patterns to port from assistant-ui onto ai-elements

| assistant-ui pattern | Current state | Change |
|----------------------|---------------|--------|
| Composer auto-grow textarea | `ChatInput` exists; need to verify auto-grow + Shift+Enter | Extract `components/chat/composer.tsx`; use auto-resize hook (`useEffect` on value → set `scrollHeight` as height); Shift+Enter inserts newline, Enter submits; disable + show spinner while `status === 'streaming'` or `'submitted'` |
| Message state distinction (user vs assistant) | `Message` + `MessageAvatar` from ai-elements; roles already distinguished | Add avatar treatment (user = initials avatar, assistant = Logo/Sparkles); align user messages right, assistant left; bubble backgrounds differ (`bg-primary` for user, `bg-muted` for assistant) |
| Token-by-token streaming opacity | Streaming works via `useChat` + `Response`/`Loader` from ai-elements; no opacity fade | Wrap incoming assistant tokens in a `motion.span` with `initial={{opacity:0.4}} animate={{opacity:1}}` per-chunk; use framer-motion `key` on chunk index. Keep `use-stick-to-bottom` scroll anchoring untouched |
| Border-beam on active assistant turn | None | Wrap the in-flight assistant message container with `BorderBeam` from `components/magicui/` (added in Phase 2) — active only while `status === 'streaming'` for that message |

### Scroll anchoring — preserve the existing constraints

From project memory (CONSTRAINTS):
- Keep the fixed-height chain: `html→body→layout→page→chat` all `h-screen`/`h-full`.
- `AIChatInterface` applies `className` prop (`h-[calc(100vh-12rem)]`) to its root div — do not remove.
- Do NOT pass `overflow-hidden` to `Conversation` (overrides `use-stick-to-bottom`'s `overflow-y-auto`).
- Keep `min-h-0` on `Conversation` for flex shrinking.
- Spring physics stays `mass=1, damping=0.8, stiffness=0.08` (already set).
- Message padding stays `py-1`; no `space-y-4` on `ConversationContent`.

### Extracted components

For clarity on the 1811-line file — targeted improvement, not unrelated refactor:
- `components/chat/composer.tsx` — auto-grow textarea + submit logic + disabled state. Replaces inline `ChatInput` usage where it's just the textarea; keeps `ChatInput` if it has mode-specific logic.
- `components/chat/message-bubble.tsx` — wraps `ai-elements` `Message`/`MessageAvatar`/`MessageContent` with the role-based styling + streaming opacity + BorderBeam-while-active.

### What stays untouched (the deep integrations)

- Artifact store + `syncArtifactsFromMessages` + `ArtifactPanel`
- Tool-UI registry (`tool-ui/*.tsx`)
- Generative-UI registry (`generative-ui/registry.tsx`)
- Chat mode context + `getChatModeAccentClasses`
- GEO engine labels (`DEFAULT_GEO_ENGINES`)
- Proactive suggestions
- Conversation bootstrap (`bootstrapConversationRecord`)
- `AgentHandoffCard`

These are read-only consumers of the message rendering layer; extracting `message-bubble.tsx` and `composer.tsx` keeps their interfaces stable.

### Token streaming opacity — implementation note

AI SDK's `useChat` returns message `parts` (text deltas). The opacity fade applies to the *currently streaming* text part of the *last* assistant message only — completed messages render at full opacity. This avoids re-animating old messages on re-render. Use an `isStreaming` flag derived from `status === 'streaming' && message.id === lastMessageId`.

### Gates

- `pnpm typecheck` passes.
- `pnpm dev`: chat streams, scroll anchoring still sticks to bottom, manual scroll-up doesn't snap back.
- User/assistant messages visually distinct.
- No regression in artifact panel, tool-UIs, or mode switching (smoke check).

---

## Acceptance Criteria & Verification

| Spec criterion | Verification |
|----------------|--------------|
| Project builds/runs via `pnpm dev` | `pnpm dev` boots; no "Cannot find module" errors; landing + dashboard load |
| No `npm` or `package-lock.json` files remain | `Test-Path package-lock.json` → False; `Get-ChildItem -Recurse -Filter package-lock.json` → none; `package.json` has no `npm run` script invocations |
| Chatbot UI handles async loading/streaming without layout shifts or scroll breaks | Manual: send a chat message, observe token streaming, scroll up mid-stream — view does not snap back; no CLS on message arrival |
| All styling relies on Tailwind tokens mapped to shadcn theme | No inline `style={{}}` color/background props added; all new styling uses Tailwind classes or `globals.css` tokens; magicui components reference existing `@/lib/utils` `cn` |

### Final gate sequence (after Phase 3b)

1. `pnpm typecheck` — passes
2. `pnpm lint` — passes (or pre-existing warnings only, no new errors)
3. `pnpm test:unit` — passes (existing tests unaffected)
4. `pnpm dev` — manual smoke test:
   - Landing page renders with new Magic UI aesthetic, BentoGrid, Marquee, ShimmerButton
   - `/dashboard` chat streams, scroll anchoring works, user/assistant distinction visible, BorderBeam on active turn
   - `/reddit-gap` still works (unchanged)
   - Artifact panel + mode switching still work
5. `pnpm build` — production build succeeds (env validation runs via `prebuild`)

---

## Out of scope (explicitly)

- No database migrations, API route changes, or auth changes.
- No new features beyond the spec (no new chat modes, no new tools).
- No removal of `@stackframe/stack`, `@directus/sdk`, or other legacy deps (separate concern).
- No mobile-responsive overhaul beyond what Magic UI components provide natively (they're responsive by default).
- No i18n changes.
- No SEO/metadata rewrites beyond what the new landing structure implies (keep `buildPageMetadata` + FAQ schema intact).
