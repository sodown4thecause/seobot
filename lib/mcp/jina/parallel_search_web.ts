import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: parallel_search_web
// Source: https://mcp.jina.ai/sse
export const parallel_search_webToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Run multiple web searches in parallel for comprehensive topic coverage and diverse perspectives. For best results, provide multiple search queries that explore different aspects of your topic. You can use expand_query to help generate diverse queries, or create them yourself.`,
    inputSchema: z.object({
      searches: z
        .array(
          z
            .object({
              query: z
                .string()
                .describe(
                  "Search terms or keywords to find relevant web content",
                ),
              num: z
                .number()
                .describe(
                  "Maximum number of search results to return, between 1-100",
                )
                .default(30),
              tbs: z
                .string()
                .describe(
                  "Time-based search parameter, e.g., 'qdr:h' for past hour",
                )
                .optional(),
              location: z
                .string()
                .describe(
                  "Location for search results, e.g., 'London', 'New York', 'Tokyo'",
                )
                .optional(),
              gl: z
                .string()
                .describe("Country code, e.g., 'dz' for Algeria")
                .optional(),
              hl: z
                .string()
                .describe("Language code, e.g., 'zh-cn' for Simplified Chinese")
                .optional(),
            })
            .strict(),
        )
        .max(5)
        .describe(
          `Array of search configurations to execute in parallel (maximum 5 searches for optimal performance)`,
        ),
      timeout: z
        .number()
        .describe("Timeout in milliseconds for all searches")
        .default(30000),
    }),
    execute: async (args) => {
      const client = await getClient();
      const result = await client.callTool({
        name: "parallel_search_web",
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

