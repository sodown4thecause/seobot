import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: search_ssrn
// Source: https://mcp.jina.ai/v1
export const search_ssrnToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Search academic papers and preprints on SSRN (Social Science Research Network). Perfect for finding research papers in social sciences, economics, law, finance, accounting, management, and humanities. Use this when researching social science topics, looking for working papers, or finding the latest research in business and economics fields.`,
    inputSchema: z
      .object({
        query: z
          .union([z.string(), z.array(z.string())])
          .describe(
            `Academic search terms, author names, or research topics (e.g., 'corporate governance', 'behavioral finance', 'contract law'). Can be a single query string or an array of queries for parallel search.`,
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
            `Time-based search parameter, e.g., 'qdr:h' for past hour, can be qdr:h, qdr:d, qdr:w, qdr:m, qdr:y`,
          )
          .optional(),
      })
      .strict(),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "search_ssrn",
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
