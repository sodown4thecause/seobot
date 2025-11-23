import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: dataforseo_labs_bulk_traffic_estimation
// Source: https://mcp.dataforseo.com/http
export const dataforseo_labs_bulk_traffic_estimationToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `This endpoint will provide you with estimated monthly traffic volumes for up to 1,000 domains, subdomains, or webpages. Along with organic search traffic estimations, you will also get separate values for paid search, featured snippet, and local pack results.`,
    inputSchema: z.object({
      targets: z.array(z.string())
        .describe(`target domains, subdomains, and webpages.
        you can specify domains, subdomains, and webpages in this field;
domains and subdomains should be specified without https:// and www.;
pages should be specified with absolute URL, including https:// and www.;
you can set up to 1000 domains, subdomains or webpages`),
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
        name: "dataforseo_labs_bulk_traffic_estimation",
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
