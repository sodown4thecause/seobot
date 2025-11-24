import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: search_arxiv
// Source: https://mcp.jina.ai/sse
export const search_arxivToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Search academic papers and preprints on arXiv repository. Perfect for finding research papers, scientific studies, technical papers, and academic literature. Use this when researching scientific topics, looking for papers by specific authors, or finding the latest research in fields like AI, physics, mathematics, computer science, etc.`,
    inputSchema: z.object({
      query: z
        .union([z.string(), z.array(z.string())])
        .describe(
          `Academic search terms, author names, or research topics (e.g., 'transformer neural networks', 'Einstein relativity', 'machine learning optimization'). Can be a single query string or an array of queries for parallel search.`,
        ),
      num: z
        .number()
        .describe("Maximum number of academic papers to return, between 1-100")
        .default(30),
      tbs: z
        .string()
        .describe(
          `Time-based search parameter, e.g., 'qdr:h' for past hour, can be qdr:h, qdr:d, qdr:w, qdr:m, qdr:y`,
        )
        .optional(),
    }),
    execute: async (args) => {
      const client = await getClient();
      const result = await client.callTool({
        name: "search_arxiv",
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

