import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: sort_by_relevance
// Source: https://mcp.jina.ai/sse
export const sort_by_relevanceToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Rerank a list of documents by relevance to a query using Jina Reranker API. Use this when you have multiple documents and want to sort them by how well they match a specific query or topic. Perfect for document retrieval, content filtering, or finding the most relevant information from a collection.`,
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          `The query or topic to rank documents against (e.g., 'machine learning algorithms', 'climate change solutions')`,
        ),
      documents: z
        .array(z.string())
        .describe("Array of document texts to rerank by relevance"),
      top_n: z
        .number()
        .describe("Maximum number of top results to return")
        .optional(),
    }),
    execute: async (args) => {
      const client = await getClient();
      const result = await client.callTool({
        name: "sort_by_relevance",
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

