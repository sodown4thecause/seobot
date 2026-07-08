# docs — Project Documentation & Specs

See [AGENTS.md](../AGENTS.md) for the main project knowledge base.

## Purpose

Canonical product specifications, architecture decisions, deployment guides, and planning documents.

## Structure

```
docs/
├── specs/              # Canonical product & architecture specs (commit these)
├── architecture/       # System architecture deep-dives
├── deployment/         # Deployment guides
├── guides/             # Developer guides
├── plans/              # Working plans (gitignored — do not commit)
└── reports/            # Rollout reports & retrospectives
```

## Conventions

- **Commit durable docs under `docs/specs/`** — `docs/plans/` is gitignored.
- See `docs/specs/platform-modes.md` for the canonical product spec.
