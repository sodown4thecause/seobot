import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: search_jina_blog
// Source: https://mcp.jina.ai/v1
export const search_jina_blogToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Search Jina AI news and blog posts at jina.ai/news for articles about AI, machine learning, neural search, embeddings, and Jina products. Use this to find official Jina documentation, tutorials, product announcements, and technical deep-dives.`,
    inputSchema: z
      .object({
        query: z
          .union([z.string(), z.array(z.string())])
          .describe(
            `Search terms to find relevant Jina blog posts (e.g., 'embeddings', 'reranker', 'ColBERT'). Can be a single query string or an array of queries for parallel search.`,
          ),
        num: z
          .number()
          .describe("Maximum number of blog posts to return, between 1-100")
          .default(30),
        tbs: z
          .string()
          .describe(
            `Time-based search parameter, e.g., 'qdr:h' for past hour, can be qdr:h, qdr:d, qdr:w, qdr:m, qdr:y`,
          )
          .optional(),
      })
      .strict(),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "search_jina_blog",
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
