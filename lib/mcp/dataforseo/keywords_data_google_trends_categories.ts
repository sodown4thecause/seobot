import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: keywords_data_google_trends_categories
// Source: https://mcp.dataforseo.com/http
export const keywords_data_google_trends_categoriesToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description:
      "This endpoint will provide you list of Google Trends Categories",
    parameters: z.object({}),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "keywords_data_google_trends_categories",
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
