import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: search_web
// Source: https://mcp.jina.ai/v1
export const search_webToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Search the entire web for current information, news, articles, and websites. Use this when you need up-to-date information, want to find specific websites, research topics, or get the latest news. Ideal for answering questions about recent events, finding resources, or discovering relevant content.`,
    inputSchema: z
      .object({
        query: z
          .union([z.string(), z.array(z.string())])
          .describe(
            `Search terms or keywords to find relevant web content (e.g., 'climate change news 2024', 'best pizza recipe'). Can be a single query string or an array of queries for parallel search.`,
          ),
        num: z
          .number()
          .describe("Maximum number of search results to return, between 1-100")
          .default(30),
        tbs: z
          .string()
          .describe(
            `Time-based search parameter, e.g., 'qdr:h' for past hour, can be qdr:h, qdr:d, qdr:w, qdr:m, qdr:y`,
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
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "search_web",
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
