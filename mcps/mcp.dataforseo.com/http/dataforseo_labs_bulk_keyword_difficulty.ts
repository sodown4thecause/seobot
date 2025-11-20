import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: dataforseo_labs_bulk_keyword_difficulty
// Source: https://mcp.dataforseo.com/http
export const dataforseo_labs_bulk_keyword_difficultyToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `This endpoint will provide you with the Keyword Difficulty metric for a maximum of 1,000 keywords in one API request. Keyword Difficulty stands for the relative difficulty of ranking in the first top-10 organic results for the related keyword. Keyword Difficulty in DataForSEO API responses indicates the chance of getting in top-10 organic results for a keyword on a logarithmic scale from 0 to 100.`,
    inputSchema: z.object({
      keywords: z.array(z.string()).describe(`target keywords
required field
UTF-8 encoding
maximum number of keywords you can specify in this array: 1000`),
      location_name: z
        .string()
        .describe(
          `full name of the location
required field
only in format "Country" (not "City" or "Region")
example:
'United Kingdom', 'United States', 'Canada'`,
        )
        .default("United States"),
      language_code: z
        .string()
        .describe(
          `language code
        required field
        example:
        en`,
        )
        .default("en"),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "dataforseo_labs_bulk_keyword_difficulty",
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
