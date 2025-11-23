import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: dataforseo_labs_google_serp_competitors
// Source: https://mcp.dataforseo.com/http
export const dataforseo_labs_google_serp_competitorsToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `This endpoint will provide you with a list of domains ranking for the keywords you specify. You will also get SERP rankings, rating, estimated traffic volume, and visibility values the provided domains gain from the specified keywords.`,
    inputSchema: z.object({
      keywords: z.array(z.string()).describe(`keywords array
required field
the results will be based on the keywords you specify in this array
UTF-8 encoding;
the keywords will be converted to lowercase format;
you can specify the maximum of 200 keywords`),
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
        ["ranked_serp_element.serp_item.rank_group","<=",10]
        [["ranked_serp_element.serp_item.rank_group","<=",10],"or",["ranked_serp_element.serp_item.type","<>","paid"]]
        [["keyword_data.keyword_info.search_volume","<>",0],"and",[["ranked_serp_element.serp_item.type","<>","paid"],"or",["ranked_serp_element.serp_item.is_malicious","=",false]]]`,
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
the comma is used as a separator
example:
["avg_position,asc"]
default rule:
["rating,desc"]
note that you can set no more than three sorting rules in a single request
you should use a comma to separate several sorting rules
example:
["avg_position,asc","etv,desc"]`,
        )
        .optional(),
      include_subdomains: z
        .boolean()
        .describe("Include keywords from subdomains")
        .optional(),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "dataforseo_labs_google_serp_competitors",
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
