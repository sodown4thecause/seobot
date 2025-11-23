import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: dataforseo_labs_google_competitors_domain
// Source: https://mcp.dataforseo.com/http
export const dataforseo_labs_google_competitors_domainToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `This endpoint will provide you with a full overview of ranking and traffic data of the competitor domains from organic and paid search. In addition to that, you will get the metrics specific to the keywords both competitor domains and your domain rank for within the same SERP.`,
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
      limit: z
        .number()
        .gte(1)
        .lte(1000)
        .describe("Maximum number of keywords to return")
        .default(10),
      offset: z
        .number()
        .gte(0)
        .describe(
          `offset in the results array of returned keywords
        optional field
        default value: 0
        if you specify the 10 value, the first ten keywords in the results array will be omitted and the data will be provided for the successive keywords`,
        )
        .optional(),
      filters: z
        .array(
          z.union([
            z
              .array(z.union([z.string(), z.number(), z.boolean()]))
              .min(3)
              .max(3),
            z.enum(["and", "or"]),
            z.array(z.any()).min(3).max(3),
            z.union([z.string(), z.number()]),
          ]),
        )
        .max(3)
        .describe(
          `you can add several filters at once (8 filters maximum)
        you should set a logical operator and, or between the conditions
        the following operators are supported:
        regex, not_regex, <, <=, >, >=, =, <>, in, not_in, match, not_match, ilike, not_ilike, like, not_like
        you can use the % operator with like and not_like, as well as ilike and not_ilike to match any string of zero or more characters
        merge operator must be a string and connect two other arrays, availible values: or, and.
        example:
        ["metrics.organic.count",">",50]
        [["metrics.organic.pos_1","<>",0],"and",["metrics.organic.impressions_etv",">=","10"]]

        [[["metrics.organic.count",">=",50],"and",["metrics.organic.pos_1","in",[1,5]]],
        "or",
        ["metrics.organic.etv",">=","100"]]`,
        )
        .optional(),
      order_by: z
        .array(z.string())
        .describe(
          `results sorting rules
optional field
you can use the same values as in the filters array to sort the results
possible sorting types:
asc – results will be sorted in the ascending order
desc – results will be sorted in the descending order
you should use a comma to set up a sorting parameter
default rule:
["relevance,desc"]
example:
["relevance,desc","keyword_info.search_volume,desc"]`,
        )
        .optional(),
      exclude_top_domains: z
        .boolean()
        .describe(
          `indicates whether to exclude world's largest websites
        optional field
        default value: false
        set to true if you want to get highly-relevant competitors excluding the top websites`,
        )
        .default(true),
      include_clickstream_data: z
        .boolean()
        .describe(
          "Include or exclude data from clickstream-based metrics in the result",
        )
        .default(false),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "dataforseo_labs_google_competitors_domain",
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
