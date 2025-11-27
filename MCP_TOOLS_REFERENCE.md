# MCP Tools Reference

This document provides a quick reference for all MCP (Model Context Protocol) tools integrated into the platform.

## Overview

All MCP tools have been converted to static AI SDK tools using `mcp-to-ai-sdk` and are located in the `mcps/` folder. Each tool is wrapped with the AI SDK's `tool()` helper and can be used directly in agent workflows.

## DataForSEO MCP

**Location**: `mcps/mcp.dataforseo.com/http/`  
**Client**: `lib/mcp/dataforseo/client.ts`  
**Transport**: HTTP with Basic Auth  
**Total Tools**: 40+

### Key Tools

#### Keyword Research
- `ai_optimization_keyword_data_search_volume` - Get search volume for keywords
- `ai_optimization_keyword_data_locations_and_languages` - Get available locations/languages
- `dataforseo_labs_keyword_ideas` - Generate keyword ideas
- `dataforseo_labs_keyword_suggestions` - Get keyword suggestions

#### SERP Analysis
- `serp_organic_live_advanced` - Get organic SERP results
- `serp_local_live_advanced` - Get local pack results
- `serp_youtube_live_advanced` - Get YouTube SERP results
- `serp_locations` - Get available SERP locations
- `serp_languages` - Get available languages

#### Search Intent & Content
- `dataforseo_labs_search_intent` - Detect search intent (informational, commercial, etc.)
- `content_analysis_search` - Analyze content quality and citations
- `content_analysis_sentiment` - Sentiment analysis
- `content_analysis_summary` - Content summarization

#### On-Page SEO
- `on_page_instant_pages` - Instant on-page analysis
- `on_page_lighthouse` - Lighthouse performance metrics

#### Competitor Analysis
- `dataforseo_labs_competitors_domain` - Get domain competitors
- `dataforseo_labs_ranked_keywords` - Get keywords a domain ranks for

### Usage Example

```typescript
import { mcpDataforseoTools } from '@/lib/mcp/dataforseo/index'

// Search intent detection
const intentResult = await mcpDataforseoTools.dataforseo_labs_search_intent.execute({
  keywords: ['best running shoes'],
  language_code: 'en',
})

// SERP analysis
const serpResult = await mcpDataforseoTools.serp_organic_live_advanced.execute({
  keyword: 'best running shoes',
  location_code: 2840, // United States
  language_code: 'en',
})
```

## Jina AI MCP

**Location**: `mcps/mcp.jina.ai/sse/`  
**Client**: `lib/mcp/jina/client.ts`  
**Transport**: SSE (Server-Sent Events)  
**Total Tools**: 15+

### Key Tools

#### Web Content
- `read_url` - Read and parse web page content
- `search_web` - Web search with Jina
- `parallel_search_web` - Parallel web searches
- `capture_screenshot_url` - Capture page screenshots

#### Academic Research
- `search_arxiv` - Search arXiv papers
- `parallel_search_arxiv` - Parallel arXiv searches

#### Images
- `search_images` - Image search
- `deduplicate_images` - Remove duplicate images using embeddings

#### Utilities
- `expand_query` - Expand search queries
- `guess_datetime_url` - Extract datetime from URLs
- `show_api_key` - Show API key info
- `primer` - Get Jina primer/documentation

### Usage Example

```typescript
import { mcpJinaTools } from '@/lib/mcp/jina/index'

// Read URL content
const content = await mcpJinaTools.read_url.execute({
  url: 'https://example.com/article',
})

// Web search
const searchResults = await mcpJinaTools.search_web.execute({
  query: 'AI content generation best practices',
  count: 10,
})
```

## Firecrawl MCP

**Location**: `mcps/mcp.firecrawl.dev/`  
**Client**: `lib/mcp/firecrawl/client.ts`  
**Transport**: HTTP with Bearer Auth  
**Total Tools**: 5+

### Key Tools

#### Web Scraping
- `scrape` - Scrape a single page
- `crawl` - Crawl entire website
- `map` - Map website structure
- `check_crawl_status` - Check crawl job status
- `cancel_crawl` - Cancel ongoing crawl

### Usage Example

```typescript
import { mcpFirecrawlTools } from '@/lib/mcp/firecrawl/index'

// Scrape a page
const pageData = await mcpFirecrawlTools.scrape.execute({
  url: 'https://example.com',
  formats: ['markdown', 'html'],
})

// Crawl a site
const crawlJob = await mcpFirecrawlTools.crawl.execute({
  url: 'https://example.com',
  limit: 100,
  scrapeOptions: {
    formats: ['markdown'],
  },
})
```

## Winston AI (Direct API)

**Location**: `lib/mcp/winston-client.ts`  
**Type**: Direct API integration (not MCP)

### Tools

- `winston_check_quality` - Check content for AI detection

### Usage Example

```typescript
import { getWinstonTools } from '@/lib/mcp/winston-client'

const tools = await getWinstonTools()
const result = await tools.winston_check_quality.execute({
  content: 'Your content here...',
})
// Returns: { score: 0-100, human_probability: 0-100, feedback: string }
```

## Rytr (Direct API)

**Location**: `lib/ai/content-quality-tools.ts`  
**Type**: Direct API integration (not MCP)

### Tools

- `generateSEOContentTool` - Generate SEO-optimized content
- `generateBlogSectionTool` - Generate blog sections
- `generateMetaTitleTool` - Generate meta titles
- `generateMetaDescriptionTool` - Generate meta descriptions
- `improveContentTool` - Improve existing content
- `expandContentTool` - Expand content sections

### Usage Example

```typescript
import { getContentQualityTools } from '@/lib/ai/content-quality-tools'

const tools = getContentQualityTools()
const result = await tools.generateSEOContentTool.execute({
  topic: 'Best Running Shoes 2025',
  keywords: ['running shoes', 'best running shoes'],
  tone: 'professional',
  wordCount: 1500,
})
```

## Tool Usage in Agents

### Enhanced Research Agent

Uses:
- DataForSEO: `dataforseo_labs_search_intent`, `serp_organic_live_advanced`
- Perplexity: Direct API (not MCP)
- Supabase: Vector search for RAG

### Content Writer Agent

Uses:
- Rytr: Content generation tools
- Supabase: RAG document retrieval

### DataForSEO Scoring Agent

Uses:
- DataForSEO: `content_analysis_search`, `content_analysis_sentiment`, `on_page_lighthouse`

### EEAT QA Agent

Uses:
- Claude Sonnet 4: Direct API (not MCP)
- Structured output for QA reports

## MCP Client Configuration

### DataForSEO Client

```typescript
// lib/mcp/dataforseo/client.ts
const transport = new StreamableHTTPClientTransport(
  new URL(process.env.DATAFORSEO_MCP_URL),
  {
    requestInit: {
      headers: {
        Authorization: createBasicAuth(
          process.env.DATAFORSEO_LOGIN,
          process.env.DATAFORSEO_PASSWORD
        ),
      },
    },
  }
)
```

### Jina Client

```typescript
// lib/mcp/jina/client.ts
const transport = new SSEClientTransport(
  new URL('https://mcp.jina.ai'),
  {
    requestInit: {
      headers: {
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
      },
    },
  }
)
```

### Firecrawl Client

```typescript
// lib/mcp/firecrawl/client.ts
const mcpUrl = `https://mcp.firecrawl.dev/${process.env.FIRECRAWL_API_KEY}/v2/mcp`
const transport = new StreamableHTTPClientTransport(
  new URL(mcpUrl),
  {
    requestInit: {
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      },
    },
  }
)
```

## Regenerating MCP Tools

If MCP servers update their tool definitions, regenerate using:

```bash
# Jina AI
npm run mcp:generate:jina

# Winston AI
npm run mcp:generate:winston

# DataForSEO (requires local server running)
npm run mcp:generate:dataforseo
```

This uses `mcp-to-ai-sdk` to generate TypeScript wrappers.

## Best Practices

1. **Error Handling**: Always wrap MCP tool calls in try-catch
2. **Logging**: Use `withMCPLogging` wrapper for usage tracking
3. **Caching**: Cache expensive results (SERP data, embeddings)
4. **Rate Limiting**: Respect API rate limits
5. **Timeouts**: Set reasonable timeouts for tool calls
6. **Fallbacks**: Implement fallback strategies for critical tools

## Troubleshooting

### Connection Issues
- Check environment variables are set
- Verify MCP server is accessible
- Check network/firewall settings

### Tool Not Found
- Regenerate MCP tools
- Check tool name spelling
- Verify MCP server version

### Authentication Errors
- Verify API keys are correct
- Check authorization header format
- Ensure keys have required permissions

## Additional Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [AI SDK Documentation](https://sdk.vercel.ai/)
- [DataForSEO API Docs](https://docs.dataforseo.com/)
- [Jina AI Docs](https://jina.ai/docs/)
- [Firecrawl Docs](https://docs.firecrawl.dev/)

