import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: dataforseo_labs_google_ranked_keywords
// Source: https://mcp.dataforseo.com/http
export const dataforseo_labs_google_ranked_keywordsToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `This endpoint will provide you with the list of keywords that any domain or webpage is ranking for. You will also get SERP elements related to the keyword position, as well as impressions, monthly searches and other data relevant to the returned keywords.`,
    parameters: z.object({
      target: z.string().describe(`domain name or page url
required field
the domain name of the target website or URL of the target webpage;
the domain name must be specified without https:// or www.;
the webpage URL must be specified with https:// or www.
Note: if you specify the webpage URL without https:// or www., the result will be returned for the entire domain rather than the specific page
`),
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
            z.string(),
            z.number(),
            z.boolean(),
            z.array(z.union([z.string(), z.number(), z.boolean()])),
          ]),
        )
        .max(3)
        .describe(
          `Array of filter conditions and logical operators. Each filter condition is an array of [field, operator, value].
        Maximum 8 filters allowed.
        Available operators: =, <>, <, <=, >, >=, in, not_in, like, not_like, ilike, not_ilike, regex, not_regex, match, not_match
        Logical operators: "and", "or"
        Examples:
        Simple filter: [["ranked_serp_element.serp_item.rank_group","<=",10]]
        With logical operator: [["ranked_serp_element.serp_item.rank_group","<=",10],"or",["ranked_serp_element.serp_item.type","<>","paid"]]
        Complex filter: [["keyword_data.keyword_info.search_volume","<>",0],"and",[["ranked_serp_element.serp_item.type","<>","paid"],"or",["ranked_serp_element.serp_item.is_malicious","=",false]]]`,
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
you should use a comma to set up a sorting type
example:
["keyword_data.keyword_info.competition,desc"]
default rule:
["ranked_serp_element.serp_item.rank_group,asc"]
note that you can set no more than three sorting rules in a single request
you should use a comma to separate several sorting rules
example:
["keyword_data.keyword_info.search_volume,desc","keyword_data.keyword_info.cpc,desc"]`,
        )
        .optional(),
      include_subdomains: z
        .boolean()
        .describe("Include keywords from subdomains")
        .optional(),
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
        name: "dataforseo_labs_google_ranked_keywords",
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
