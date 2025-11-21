import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: expand_query
// Source: https://mcp.jina.ai/sse
export const expand_queryToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Expand and rewrite search queries based on an up-to-date query expansion model. This tool takes an initial query and returns multiple expanded queries that can be used for more diversed and deeper searches. Useful for improving deep research results by searching broader and deeper.`,
    parameters: z.object({
      query: z
        .string()
        .describe(
          "The search query to expand (e.g., 'machine learning', 'climate change')",
        ),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "expand_query",
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
