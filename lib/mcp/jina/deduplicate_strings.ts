import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: deduplicate_strings
// Source: https://mcp.jina.ai/sse
export const deduplicate_stringsToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Get top-k semantically unique strings from a list using Jina embeddings and submodular optimization. Use this when you have many similar strings and want to select the most diverse subset that covers the semantic space. Perfect for removing duplicates, selecting representative samples, or finding diverse content.`,
    inputSchema: z.object({
      strings: z.array(z.string()).describe("Array of strings to deduplicate"),
      k: z
        .number()
        .describe(
          `Number of unique strings to return. If not provided, automatically finds optimal k by looking at diminishing return`,
        )
        .optional(),
    }),
    execute: async (args) => {
      const client = await getClient();
      const result = await client.callTool({
        name: "deduplicate_strings",
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

