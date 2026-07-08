# tests — Unit & Integration Tests

See [AGENTS.md](../AGENTS.md) for the main project knowledge base.

## Purpose

Vitest unit tests and integration tests for the application.

## Structure

```
tests/
├── fixtures/           # Test fixtures & mock data
├── integration/        # Integration tests (API routes, DB)
├── mocks/              # Mock implementations
└── unit/               # Unit tests (lib/, components/)
```

## Commands

```bash
npm run test            # Run all tests
npm run test:unit       # Unit tests only
```

## Conventions

- Use Vitest for all tests.
- Mock external APIs (DataForSEO, Jina, Firecrawl) in `tests/mocks/`.
- Integration tests should use a test database or mocked DB layer.
