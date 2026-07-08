# public — Static Assets

See [AGENTS.md](../AGENTS.md) for the main project knowledge base.

## Purpose

Next.js public directory — static assets served at the root path.

## Structure

```
public/
├── images/            # Images, screenshots, design assets
├── logos/             # Brand logos
├── llms/              # LLM reference files
└── *.txt *.xml        # Verification / sitemap files
```

## Conventions

- Assets here are served at `/<filename>` directly.
- For user-uploaded content, use cloud storage (not this directory).
