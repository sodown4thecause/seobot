# GEO Mode Setup

SEOBOT now separates chat and RAG context into three modes:

- `seo`: SERP, keyword, technical SEO, backlinks, and ranking strategy.
- `geo`: AI visibility, answer-engine citations, brand mentions, competitor mentions, sentiment, and source inclusion.
- `content`: case studies, whitepapers, service pages, FAQs, proof assets, and internal content intelligence.

The chat UI sends the selected mode to `/api/chat`. RAG retrieval filters `agent_documents.mode` so SEO and GEO context stay separate by default.

## Database

Run the new Drizzle migration before using mode-aware retrieval:

```bash
npx drizzle-kit migrate
```

The migration adds `mode` and GEO metadata columns to `agent_documents`, plus `geo_prompts`, `geo_runs`, and `research_jobs`.

## Environment

Add these optional values in Vercel:

```bash
CRON_SECRET=...
GEO_ENABLED_ENGINES=chatgpt,perplexity,google_ai_overview
GEO_COMPETITORS=Fallback Competitor A,Fallback Competitor B
GEO_DEFAULT_TOPICS=AI visibility,answer engine optimization,Google AI Overview citations
```

Brand names are not configured globally. GEO runs use each authenticated user's business profile and derive a default brand from the profile website URL unless a request or `geo_prompts` row provides a more specific brand. Weekly GEO research iterates active business profiles so new users are covered without changing environment variables.

All AI summarization and GEO analysis uses Vercel AI Gateway. Weekly research uses `openai/gpt-5.5` and falls back to `openai/gpt-5.4`.

## Seed GEO Prompts

```sql
INSERT INTO geo_prompts (prompt, brand, topic, competitors, engines)
VALUES
  (
    'What are the best agencies for improving AI search visibility?',
    'Your Brand',
    'AI search visibility',
    ARRAY['Competitor A', 'Competitor B'],
    ARRAY['chatgpt', 'perplexity', 'google_ai_overview']
  ),
  (
    'Which tools help companies get cited in Google AI Overview and Perplexity?',
    'Your Brand',
    'AI answer citations',
    ARRAY['Competitor A', 'Competitor B'],
    ARRAY['chatgpt', 'perplexity']
  );
```

## Manual Testing

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/weekly-seo-research
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/weekly-geo-research
```

Then use the chat selector to test SEO, GEO / AEO, and Content Intelligence modes. Each mode should retrieve only matching RAG rows unless the user explicitly asks for cross-mode comparison.

Run an authenticated GEO prompt manually:

```bash
curl -X POST http://localhost:3000/api/geo/runs \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Which agencies are best for AI visibility?","competitors":["Competitor A"],"engines":["chatgpt","perplexity"]}'
```
