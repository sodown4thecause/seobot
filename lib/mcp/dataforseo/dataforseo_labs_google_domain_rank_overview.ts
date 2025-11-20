import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: dataforseo_labs_google_domain_rank_overview
// Source: https://mcp.dataforseo.com/http
export const dataforseo_labs_google_domain_rank_overviewToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `This endpoint will provide you with ranking and traffic data from organic and paid search for the specified domain. You will be able to review the domain ranking distribution in SERPs as well as estimated monthly traffic volume for both organic and paid results.`,
    inputSchema: z.object({
      target: z.string().describe("target domain"),
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
      ignore_synonyms: z
        .boolean()
        .describe(
          "ignore highly similar keywords, if set to true, results will be more accurate",
        )
        .default(true),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "dataforseo_labs_google_domain_rank_overview",
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
