import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: ai_optimization_keyword_data_locations_and_languages
// Source: https://mcp.dataforseo.com/http
export const ai_optimization_keyword_data_locations_and_languagesToolWithClient =
  (getClient: () => Promise<Client> | Client) =>
    tool({
      description: `Utility tool for ai_keyword_data_search_volume to get list of availible locations and languages`,
      parameters: z.object({}),
      execute: async (args): Promise<string> => {
        const client = await getClient();
        const result = await client.callTool({
          name: "ai_optimization_keyword_data_locations_and_languages",
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
