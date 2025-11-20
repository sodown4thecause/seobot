import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: firecrawl_extract
// Source: https://mcp.firecrawl.dev/fc-9b271ecf3a944c3faf93489565547fc8/v2/mcp
export const firecrawl_extractToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `
Extract structured information from web pages using LLM capabilities. Supports both cloud AI and self-hosted LLM extraction.

**Best for:** Extracting specific structured data like prices, names, details from web pages.
**Not recommended for:** When you need the full content of a page (use scrape); when you're not looking for specific structured data.
**Arguments:**
- urls: Array of URLs to extract information from
- prompt: Custom prompt for the LLM extraction
- schema: JSON schema for structured data extraction
- allowExternalLinks: Allow extraction from external links
- enableWebSearch: Enable web search for additional context
- includeSubdomains: Include subdomains in extraction
**Prompt Example:** "Extract the product name, price, and description from these product pages."
**Usage Example:**
\`\`\`json
{
  "name": "firecrawl_extract",
  "arguments": {
    "urls": ["https://example.com/page1", "https://example.com/page2"],
    "prompt": "Extract product information including name, price, and description",
    "schema": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "price": { "type": "number" },
        "description": { "type": "string" }
      },
      "required": ["name", "price"]
    },
    "allowExternalLinks": false,
    "enableWebSearch": false,
    "includeSubdomains": false
  }
}
\`\`\`
**Returns:** Extracted structured data as defined by your schema.
`,
    inputSchema: z.object({
      urls: z.array(z.string()),
      prompt: z.string().optional(),
      schema: z.record(z.any()).optional(),
      allowExternalLinks: z.boolean().optional(),
      enableWebSearch: z.boolean().optional(),
      includeSubdomains: z.boolean().optional(),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "firecrawl_extract",
        arguments: args,
      });

      // Handle different content types from MCP
      if (Array.isArray(result.content)) {
        return result.content
          .map((item: unknown) =>
            typeof item === "string" ? item : JSON.stringify(item),
          )
          .join("\n");
      } else if (typeof result.content === "string") {
        return result.content;
      } else {
        return JSON.stringify(result.content);
      }
    },
  });
