# MCPS - AUTO-GENERATED MCP BINDINGS

Auto-generated Model Context Protocol bindings. **DO NOT EDIT DIRECTLY.**

## STRUCTURE

```
mcps/
├── mcp.dataforseo.com/http/   # DataForSEO API (69 files)
├── mcp.jina.ai/sse/           # Jina AI (17 files)
└── mcp.firecrawl.dev/.../     # Firecrawl (9 files)
```

## REGENERATION

```bash
npm run mcp:generate:jina        # Regenerate Jina bindings
npm run mcp:generate:dataforseo  # Regenerate DataForSEO bindings
npm run mcp:generate:firecrawl   # Regenerate Firecrawl bindings
```

## ADDING NEW MCP

1. Run `npx mcp-to-ai-sdk <mcp-endpoint-url>`
2. Output goes to `mcps/{domain}/`
3. Create wrapper in `lib/mcp/{provider}/`
4. Add npm script in `package.json`

## ANTI-PATTERNS

- **NEVER** edit files in this directory - they will be overwritten
- **NEVER** import from `mcps/` in application code
- **ALWAYS** use `lib/mcp/` wrappers for:
  - Authentication handling
  - Error handling
  - Response caching
  - Type safety
