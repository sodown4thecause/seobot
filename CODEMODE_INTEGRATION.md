# Codemode Integration - Complete

## Overview

Codemode has been successfully integrated into the chat API, enabling the LLM to generate JavaScript code that orchestrates multiple MCP and API tool calls. This allows for complex workflows, error handling, and conditional logic across all available tools.

## What's Implemented

### 1. MCP Client Integrations ✅

**DataForSEO MCP** (`lib/mcp/dataforseo-client.ts`)
- Already existed, now integrated into codemode
- 40+ SEO tools available via codemode

**Firecrawl MCP** (`lib/mcp/firecrawl-client.ts`)
- New client implementation
- Connects to `https://mcp.firecrawl.dev/{FIRECRAWL_API_KEY}/v2/mcp`
- Web scraping and content extraction tools

**Winston AI MCP** (`lib/mcp/winston-client.ts`)
- New client implementation
- Connects to `https://api.gowinston.ai/mcp/v1`
- Plagiarism detection and content validation tools

### 2. Codemode Wrapper ✅

**Core Implementation** (`lib/ai/codemode.ts`)
- `createCodemodeTool()` - Creates a single codemode tool that wraps all available tools
- `buildCodemodeToolRegistry()` - Builds registry from all MCP and API tools
- Safe code execution using Function constructor
- 30-second timeout protection
- Error handling and logging

### 3. Chat API Integration ✅

**Updated** (`app/api/chat/route.ts`)
- Codemode tool automatically registered when available
- All MCP tools (DataForSEO, Firecrawl, Winston) accessible via codemode
- All API tools (Perplexity, Rytr, OpenAI) accessible via codemode
- System prompt updated to explain codemode capabilities

### 4. Environment Configuration ✅

**Updated** (`lib/config/env.ts`)
- Added `FIRECRAWL_API_KEY` (optional)
- Added `WINSTON_MCP_URL` (optional, defaults to `https://api.gowinston.ai/mcp/v1`)
- Added `FIRECRAWL_MCP_URL` (optional, auto-constructed from API key)

## How It Works

### Traditional Tool Calling
```typescript
// LLM calls tools one at a time
const keywordData = await tool1.execute({ keywords: ['seo'] });
const rankings = await tool2.execute({ keyword: 'seo' });
```

### Codemode Tool Calling
```typescript
// LLM generates JavaScript code that orchestrates multiple tools
const code = `
const keywordData = await codemode.dataforseo_keyword_search_volume({ keywords: ['seo'] });
const rankings = await codemode.dataforseo_google_rankings({ keyword: 'seo' });
const content = await codemode.rytr_generate({ useCase: 'blog_section_writing', input: 'SEO guide' });

return {
  keywords: keywordData,
  rankings: rankings,
  content: content
};
`;

await codemode.execute({ code });
```

## Available Tools in Codemode

### DataForSEO Tools (prefixed with `dataforseo_`)
- `dataforseo_keyword_search_volume`
- `dataforseo_google_rankings`
- `dataforseo_domain_overview`
- `dataforseo_ai_keyword_search_volume`
- ... and 36+ more tools

### Firecrawl Tools (prefixed with `firecrawl_`)
- All tools from Firecrawl MCP server
- Web scraping and content extraction

### Winston AI Tools (prefixed with `winston_`)
- All tools from Winston AI MCP server
- Plagiarism detection and content validation

### API Tools
- `perplexity_search` - Perplexity API search with citations
- `rytr_generate` - Rytr AI content generation
- `openai_chat` - OpenAI chat completions (if API key configured)

## Usage Examples

### Example 1: Chain Multiple Operations
```javascript
// Get keyword data, then generate content based on results
const keywordData = await codemode.dataforseo_keyword_search_volume({ 
  keywords: ['ai seo tools'] 
});

if (keywordData.total_volume > 1000) {
  const content = await codemode.rytr_generate({
    useCase: 'blog_section_writing',
    input: `Write about AI SEO tools. Search volume: ${keywordData.total_volume}`,
    tone: 'informative'
  });
  
  return { keywordData, content };
} else {
  return { message: 'Low search volume, skipping content generation' };
}
```

### Example 2: Error Handling
```javascript
try {
  const domainData = await codemode.dataforseo_domain_overview({ 
    domain: 'example.com' 
  });
  return { success: true, data: domainData };
} catch (error) {
  return { 
    success: false, 
    error: error.message,
    suggestion: 'Check domain name and try again'
  };
}
```

### Example 3: Parallel Operations
```javascript
// Execute multiple operations in parallel
const [keywordData, rankings, research] = await Promise.all([
  codemode.dataforseo_keyword_search_volume({ keywords: ['seo'] }),
  codemode.dataforseo_google_rankings({ keyword: 'seo' }),
  codemode.perplexity_search({ query: 'SEO best practices 2024' })
]);

return {
  keywords: keywordData,
  rankings: rankings,
  research: research
};
```

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Firecrawl (optional)
FIRECRAWL_API_KEY=your_firecrawl_api_key
FIRECRAWL_MCP_URL=https://mcp.firecrawl.dev/{FIRECRAWL_API_KEY}/v2/mcp

# Winston MCP (optional, defaults to https://api.gowinston.ai/mcp/v1)
WINSTON_MCP_URL=https://api.gowinston.ai/mcp/v1

# Existing variables (already configured)
DATAFORSEO_MCP_URL=your_dataforseo_mcp_url
WINSTON_AI_API_KEY=your_winston_api_key
RYTR_API_KEY=your_rytr_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
OPENAI_API_KEY=your_openai_api_key
```

## Security Considerations

1. **Code Execution Safety**
   - Code runs in isolated Function constructor scope
   - Only registered tools are accessible via `codemode` object
   - No access to Node.js APIs or file system
   - 30-second timeout prevents infinite loops

2. **Tool Access Control**
   - Tools are explicitly registered in the codemode registry
   - MCP tools require proper authentication
   - API tools use environment variables for keys

3. **Error Handling**
   - All tool errors are caught and logged
   - Execution errors are returned to the user safely
   - No sensitive information leaked in error messages

## Limitations

1. **Next.js Edge Runtime**
   - Codemode implementation is adapted for Edge runtime (not Cloudflare Workers)
   - Some advanced features may not be available

2. **Code Execution**
   - Limited to JavaScript (no Python support)
   - No access to Node.js APIs
   - Function constructor isolation (not true sandbox)

3. **Tool Availability**
   - Tools are only available if MCP servers are accessible
   - API tools require valid API keys
   - Graceful degradation if tools fail to load

## Testing

To test codemode integration:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test in chat:**
   - Ask: "Use codemode to get keyword data for 'seo tools' and then generate content"
   - The LLM should generate JavaScript code that chains multiple tool calls

3. **Check logs:**
   - Look for `[Codemode]` log messages
   - Verify tools are registered correctly
   - Check code execution results

## Future Enhancements

1. **Better Error Messages**
   - More descriptive error messages for code execution failures
   - Suggestions for fixing common errors

2. **Code Validation**
   - Pre-validate code before execution
   - Check for unsafe operations
   - Suggest improvements

3. **Performance Monitoring**
   - Track code execution time
   - Monitor tool call patterns
   - Optimize frequently used workflows

4. **Enhanced Tool Registry**
   - Dynamic tool discovery
   - Tool usage analytics
   - Automatic tool documentation

## Troubleshooting

### Codemode Tool Not Available
- Check that MCP servers are accessible
- Verify API keys are configured
- Check logs for registration errors

### Code Execution Fails
- Verify code syntax is correct
- Check that tool names match registry
- Ensure tools are called with correct parameters

### Timeout Errors
- Reduce code complexity
- Break into smaller operations
- Check network connectivity

## Related Files

- `lib/ai/codemode.ts` - Core codemode implementation
- `lib/mcp/firecrawl-client.ts` - Firecrawl MCP client
- `lib/mcp/winston-client.ts` - Winston AI MCP client
- `lib/mcp/dataforseo-client.ts` - DataForSEO MCP client (existing)
- `app/api/chat/route.ts` - Chat API with codemode integration
- `lib/config/env.ts` - Environment configuration

