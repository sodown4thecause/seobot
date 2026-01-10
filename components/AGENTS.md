# COMPONENTS - REACT UI COMPONENTS

React components built on shadcn/ui + Radix UI + Tailwind.

## STRUCTURE

```
components/
├── ui/              # shadcn/ui primitives (28 files)
├── chat/            # Chat interface
│   ├── tool-ui/     # Agent tool result UIs
│   └── message-types/
├── dashboard/       # Dashboard widgets
├── workflows/       # Workflow visualization
├── onboarding/      # Onboarding flow
├── providers/       # React context providers
├── tutorials/       # Interactive tutorials
└── dataforseo/      # DataForSEO visualizations
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add shadcn component | `ui/` | `npx shadcn@latest add <component>` |
| Add tool UI | `chat/tool-ui/` | Match agent tool output schema |
| Add dashboard widget | `dashboard/` | Follow existing card patterns |
| Add workflow visual | `workflows/` | Uses @xyflow/react |
| Add provider | `providers/` | Wrap in app layout.tsx |

## PATTERNS

### Tool UI Pattern
```
chat/tool-ui/
├── keyword-suggestions-table.tsx  # Matches keyword tool output
├── competitor-analysis-table.tsx  # Matches competitor tool output
└── serp-table.tsx                 # Matches SERP tool output
```

### Provider Organization
- `agent-provider.tsx` - Agent state context
- `jargon-provider.tsx` - SEO term explanations
- `user-mode-provider.tsx` - User skill level

## NOTES

- All UI primitives in `ui/` - extend, don't duplicate
- Framer Motion for animations
- Recharts for data visualization
