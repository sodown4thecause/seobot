# Chat UI

This directory contains chat interface components, tool UIs, and generative UI panels.

For project architecture, component patterns, and conventions, see:
- [AGENTS.md](../../AGENTS.md) — Main project knowledge base
- [components/AGENTS.md](../AGENTS.md) — React UI component overview
- [lib/chat/agents.md](../../lib/chat/agents.md) — Chat logic and modes

## Key directories

- `components/chat/tool-ui/` — Agent tool result UIs (match tool output schemas)
- `components/chat/generative-ui/` — Save-to-library, registry
- `components/chat/artifacts/` — In-chat artifact panels

## Key components

- `chat-mode-selector.tsx` — Mode selector using `lib/chat/modes.ts`
- `ai-chat-interface.tsx` — Main chat interface with artifacts panel

## Patterns

- Tool UIs must match agent tool output schemas exactly
- Register generative UI in `chat/generative-ui/registry.tsx`
- Mode accents from `CHAT_MODE_ACCENT_CLASSES` in `lib/chat/modes.ts`
