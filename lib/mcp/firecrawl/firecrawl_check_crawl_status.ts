import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: firecrawl_check_crawl_status
// Source: https://mcp.firecrawl.dev/fc-9b271ecf3a944c3faf93489565547fc8/v2/mcp
export const firecrawl_check_crawl_statusToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `
Check the status of a crawl job.

**Usage Example:**
\`\`\`json
{
  "name": "firecrawl_check_crawl_status",
  "arguments": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
\`\`\`
**Returns:** Status and progress of the crawl job, including results if available.
`,
    inputSchema: z.object({ id: z.string() }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "firecrawl_check_crawl_status",
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
