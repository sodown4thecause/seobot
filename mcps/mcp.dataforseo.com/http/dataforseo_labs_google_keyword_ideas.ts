import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: dataforseo_labs_google_keyword_ideas
// Source: https://mcp.dataforseo.com/http
export const dataforseo_labs_google_keyword_ideasToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `The Keyword Ideas provides search terms that are relevant to the product or service categories of the specified keywords. The algorithm selects the keywords which fall into the same categories as the seed keywords specified in a POST array.
As a result, you will get a list of relevant keyword ideas for up to 200 seed keywords.
Along with each keyword idea, you will get its search volume rate for the last month, search volume trend for the previous 12 months, as well as current cost-per-click and competition values. Moreover, this endpoint supplies minimum, maximum and average values of daily impressions, clicks and CPC for each result.
`,
    inputSchema: z.object({
      keywords: z.array(z.string()).describe("target keywords"),
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
        ["keyword_info.search_volume",">",0]
        [["keyword_info.search_volume","in",[0,1000]],"and",["keyword_info.competition_level","=","LOW"]]
        [["keyword_info.search_volume",">",100],"and",[["keyword_info.cpc","<",0.5],"or",["keyword_info.high_top_of_page_bid","<=",0.5]]]`,
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
relevance is used as the default sorting rule to provide you with the closest keyword ideas. We recommend using this sorting rule to get highly-relevant search terms. Note that relevance is only our internal system identifier, so it can not be used as a filter, and you will not find this field in the result array. The relevance score is based on a similar principle as used in the Keywords For Keywords endpoint.
note that you can set no more than three sorting rules in a single request
you should use a comma to separate several sorting rules
example:
["relevance,desc","keyword_info.search_volume,desc"]`,
        )
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
        name: "dataforseo_labs_google_keyword_ideas",
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
