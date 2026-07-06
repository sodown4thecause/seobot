# COMPONENTS - REACT UI COMPONENTS

> Part of the project docs — see the root [`AGENTS.md`](../AGENTS.md) for the architecture index, diagram, and code guidelines.

React components built on shadcn/ui + Radix UI + Tailwind.

## STRUCTURE

```
components/
├── ui/              # shadcn/ui primitives
├── chat/            # Chat interface
│   ├── tool-ui/     # Agent tool result UIs (match tool output schemas)
│   ├── generative-ui/  # Save-to-library, registry
│   └── artifacts/   # In-chat artifact panels
├── workspace/       # Workspace browser (saved library)
├── dashboard/       # Dashboard shell, sidebar, analytics widgets
├── landing/         # Marketing landing (mode picker, FAQ)
├── auth/            # GoogleAuthButton, LoginForm
└── providers/       # React context providers
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add shadcn component | `ui/` | `npx shadcn@latest add <component>` |
| Add tool UI | `chat/tool-ui/` | Match agent tool output schema |
| Register generative UI | `chat/generative-ui/registry.tsx` | AI SDK 6 tool UI |
| Workspace UI | `workspace/` | `/dashboard/workspace` |
| Mode selector | `chat/chat-mode-selector.tsx` | Uses `lib/chat/modes.ts` |
| Dashboard nav | `dashboard/sidebar.tsx` | Workspace → `/dashboard/workspace` |
| Landing modes | `landing/mode-skill-picker.tsx` | Three-mode marketing |

## PATTERNS

### Tool UI Pattern
```
chat/tool-ui/
├── keyword-suggestions-table.tsx
├── geo-brand-scan-results.tsx
├── crawlability-audit-result.tsx
└── schema-markup-result.tsx
```

### Mode accent classes
Import from `CHAT_MODE_ACCENT_CLASSES` in `lib/chat/modes.ts` — never hardcode emerald/violet/amber per surface.

### Provider Organization
- `agent-provider.tsx` — agent state
- `user-mode-provider.tsx` — skill level
- `chat-mode-context.tsx` — active chat mode

## NOTES

- User-facing label: **Workspace** (never Content Zone)
- Framer Motion for animations; Recharts for charts
- All UI primitives in `ui/` — extend, don't duplicate
