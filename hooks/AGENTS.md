# hooks — React Custom Hooks

See [AGENTS.md](../AGENTS.md) for the main project knowledge base.

## Purpose

Reusable React hooks shared across the application.

## Key Hooks

- `use-toast.ts` — Toast notification hook (shadcn/ui)
- `use-mode-adaptations.ts` — Chat mode adaptation hook
- `use-clerk-load-guard.ts` — Auth loading guard (legacy Clerk reference)

## Conventions

- Keep hooks focused and reusable.
- Avoid business logic here — move to `lib/` when complexity grows.
