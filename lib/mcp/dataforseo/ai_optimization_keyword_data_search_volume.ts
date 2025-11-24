import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: ai_optimization_keyword_data_search_volume
// Source: https://mcp.dataforseo.com/http
export const ai_optimization_keyword_data_search_volumeToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `This endpoint provides search volume data for your target keywords, reflecting their estimated usage in AI LLMs`,
    inputSchema: z.object({
      keywords: z
        .array(z.string())
        .describe(
          "Keywords. The maximum number of keywords you can specify: 1000",
        ),
      location_name: z
        .string()
        .describe(
          "full name of the location, example: 'United Kingdom', 'United States'",
        )
        .default("United States"),
      language_code: z
        .string()
        .describe("Search engine language code (e.g., 'en')"),
    }),
    execute: async (args) => {
      const client = await getClient();
      const result = await client.callTool({
        name: "ai_optimization_keyword_data_search_volume",
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

