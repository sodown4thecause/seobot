# services — External Services & Sidecars

See [AGENTS.md](../AGENTS.md) for the main project knowledge base.

## Purpose

Standalone service sidecars and external tooling that run outside the main Next.js runtime.

## Structure

```
services/
├── geomode-companion/   # GEO companion service
└── geomode-tui/         # GEO TUI interface
```

## Notes

- These services are deployed separately from the main Vercel app.
- GEO services connect to the geomode VPS stack (see `lib/geo/` and `docs/architecture/`).
