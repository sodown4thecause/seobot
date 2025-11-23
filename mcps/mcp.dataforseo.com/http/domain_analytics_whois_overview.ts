import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: domain_analytics_whois_overview
// Source: https://mcp.dataforseo.com/http
export const domain_analytics_whois_overviewToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `This endpoint will provide you with Whois data enriched with backlink stats, and ranking and traffic info from organic and paid search results. Using this endpoint you will be able to get all these data for the domains matching the parameters you specify in the request`,
    inputSchema: z.object({
      limit: z
        .number()
        .gte(1)
        .lte(1000)
        .describe("the maximum number of returned domains")
        .default(10),
      offset: z
        .number()
        .gte(0)
        .describe(
          `offset in the results array of returned businesses
optional field
default value: 0
if you specify the 10 value, the first ten entities in the results array will be omitted and the data will be provided for the successive entities`,
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
          `array of results filtering parameters
optional field
you can add several filters at once (8 filters maximum)
you should set a logical operator and, or between the conditions
the following operators are supported:
regex, not_regex, <, <=, >, >=, =, <>, in, not_in, like, not_like, match, not_match
you can use the % operator with like and not_like to match any string of zero or more characters
example:
["rating.value",">",3]`,
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
example:
["rating.value,desc"]note that you can set no more than three sorting rules in a single request
you should use a comma to separate several sorting rules
example:
["rating.value,desc","rating.votes_count,desc"]`,
        )
        .optional(),
      is_claimed: z
        .boolean()
        .describe(
          "indicates whether the business is verified by its owner on Google Maps",
        )
        .default(true),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "domain_analytics_whois_overview",
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
