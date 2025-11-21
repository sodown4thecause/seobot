import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: parallel_search_arxiv
// Source: https://mcp.jina.ai/sse
export const parallel_search_arxivToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Run multiple arXiv searches in parallel for comprehensive research coverage and diverse academic angles. For best results, provide multiple search queries that explore different research angles and methodologies. You can use expand_query to help generate diverse queries, or create them yourself.`,
    parameters: z.object({
      searches: z
        .array(
          z
            .object({
              query: z
                .string()
                .describe(
                  "Academic search terms, author names, or research topics",
                ),
              num: z
                .number()
                .describe(
                  "Maximum number of academic papers to return, between 1-100",
                )
                .default(30),
              tbs: z
                .string()
                .describe(
                  "Time-based search parameter, e.g., 'qdr:h' for past hour",
                )
                .optional(),
            })
            .strict(),
        )
        .max(5)
        .describe(
          `Array of arXiv search configurations to execute in parallel (maximum 5 searches for optimal performance)`,
        ),
      timeout: z
        .number()
        .describe("Timeout in milliseconds for all searches")
        .default(30000),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "parallel_search_arxiv",
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
