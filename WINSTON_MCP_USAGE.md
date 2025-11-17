# Winston AI MCP Integration Guide

## ⚠️ Important: API Key Injection Required

Winston AI's MCP server uses **JSON-RPC 2.0** protocol where the API key is **NOT** passed in HTTP headers during connection. Instead, **each tool call requires an `apiKey` parameter**.

### How Winston AI Tools Work

```typescript
// ❌ WRONG - API key in connection headers (doesn't work)
mcpClient = await createMCPClient({
  transport: {
    type: 'http',
    url: 'https://api.gowinston.ai/mcp/v1',
    headers: {
      'Authorization': `Bearer ${apiKey}`, // ❌ Ignored by Winston
    },
  },
})

// ✅ CORRECT - API key in each tool call
const result = await winston_tool.execute({
  text: 'Content to analyze...',
  apiKey: process.env.WINSTON_AI_API_KEY, // ✅ Required parameter
})
```

### Available Winston AI Tools

According to [Winston AI MCP documentation](https://docs.gowinston.ai/api-reference/mcp-server), the server provides:

1. **ai-text-detection**
   - Detects AI-generated vs human-written text
   - Parameters: `{ text: string, apiKey: string }`
   - Minimum: 300 characters
   - Cost: 1 credit per word

2. **ai-image-detection**
   - Identifies AI-generated images
   - Parameters: `{ url: string, apiKey: string }`
   - Supports: JPG, JPEG, PNG, WEBP
   - Cost: 300 credits per image

3. **plagiarism-detection**
   - Scans text against billions of web pages
   - Parameters: `{ text: string, apiKey: string }`
   - Minimum: 100 characters
   - Cost: 2 credits per word

4. **text-compare**
   - Compares two texts for similarity
   - Parameters: `{ first_text: string, second_text: string, apiKey: string }`
   - Cost: 0.5 credits per total words

### Integration Pattern

When wrapping Winston AI MCP tools for use in codemode or chat, you need to inject the API key:

```typescript
// In codemode tool registry or chat tool setup
const winstonTools = await getWinstonTools()

for (const [name, tool] of Object.entries(winstonTools)) {
  // Wrap the tool to auto-inject API key
  registry[`winston_${name}`] = {
    execute: async (args: any) => {
      // Inject API key from environment
      return await tool.execute({
        ...args,
        apiKey: serverEnv.WINSTON_AI_API_KEY,
      })
    },
    description: tool.description || `Winston AI tool: ${name}`,
  }
}
```

### Testing Connection

To verify Winston AI MCP server is accessible:

```bash
curl --location 'https://api.gowinston.ai/mcp/v1' \
--header 'content-type: application/json' \
--header 'accept: application/json' \
--data '{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}'
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      { "name": "ai-text-detection", ... },
      { "name": "ai-image-detection", ... },
      { "name": "plagiarism-detection", ... },
      { "name": "text-compare", ... }
    ]
  }
}
```

### Environment Configuration

Ensure `.env.local` contains:

```env
# Winston AI (required for MCP tools)
WINSTON_AI_API_KEY=your_winston_api_key_here

# Winston MCP Server URL (optional - defaults to below)
WINSTON_MCP_URL=https://api.gowinston.ai/mcp/v1
```

Get your API key at: https://dev.gowinston.ai

### References

- [Winston AI MCP Documentation](https://docs.gowinston.ai/api-reference/mcp-server)
- [Winston AI GitHub](https://github.com/gowinston-ai/winston-ai-mcp-server)
- [Winston AI NPM Package](https://www.npmjs.com/package/winston-ai-mcp)
