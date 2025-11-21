import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: keywords_data_google_ads_search_volume
// Source: https://mcp.dataforseo.com/http
export const keywords_data_google_ads_search_volumeToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: "Get search volume data for keywords from Google Ads",
    parameters: z.object({
      location_name: z
        .union([
          z.string().describe(`full name of the location
optional field
in format "Country"
example:
United Kingdom`),
          z.null().describe(`full name of the location
optional field
in format "Country"
example:
United Kingdom`),
        ])
        .describe(
          `full name of the location
optional field
in format "Country"
example:
United Kingdom`,
        )
        .default(null),
      language_code: z
        .union([
          z.string().describe(`Language two-letter ISO code (e.g., 'en').
optional field`),
          z.null().describe(`Language two-letter ISO code (e.g., 'en').
optional field`),
        ])
        .describe(
          `Language two-letter ISO code (e.g., 'en').
optional field`,
        )
        .default(null),
      keywords: z
        .array(z.string())
        .describe("Array of keywords to get search volume for"),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "keywords_data_google_ads_search_volume",
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
