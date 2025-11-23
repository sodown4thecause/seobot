import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: backlinks_domain_intersection
// Source: https://mcp.dataforseo.com/http
export const backlinks_domain_intersectionToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `This endpoint will provide you with the list of domains pointing to the specified websites. This endpoint is especially useful for creating a Link Gap feature that shows what domains link to your competitors but do not link out to your website`,
    inputSchema: z.object({
      targets: z.array(z.string())
        .describe(`domains, subdomains or webpages to get links for
required field
you can set up to 20 domains, subdomains or webpages
a domain or a subdomain should be specified without https:// and www.
a page should be specified with absolute URL (including http:// or https://)`),
      limit: z
        .number()
        .gte(1)
        .lte(1000)
        .describe("the maximum number of returned results")
        .default(10),
      offset: z
        .number()
        .gte(0)
        .describe(
          `offset in the array of returned results
optional field
default value: 0
if you specify the 10 value, the first ten backlinks in the results array will be omitted and the data will be provided for the successive backlinks`,
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
regex, not_regex, =, <>, in, not_in, like, not_like, ilike, not_ilike, match, not_match
you can use the % operator with like and not_like to match any string of zero or more characters
example:
["1.internal_links_count",">","1"]
[["2.referring_pages",">","2"],
"and",
["1.backlinks",">","10"]]

[["1.first_seen",">","2017-10-23 11:31:45 +00:00"],
"and",
[["2.target","like","%dataforseo.com%"],"or",["1.referring_domains",">","10"]]]`,
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
["backlinks,desc"]
note that you can set no more than three sorting rules in a single request
you should use a comma to separate several sorting rules
example:
["backlinks,desc","rank,asc"]`,
        )
        .optional(),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "backlinks_domain_intersection",
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
