import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: content_analysis_search
// Source: https://mcp.dataforseo.com/http
export const content_analysis_searchToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `This endpoint will provide you with detailed citation data available for the target keyword`,
    inputSchema: z.object({
      keyword: z.string().describe(`target keyword
        Note: to match an exact phrase instead of a stand-alone keyword, use double quotes and backslashes;`),
      keyword_fields: z
        .object({
          title: z.string().optional(),
          main_title: z.string().optional(),
          previous_title: z.string().optional(),
          snippet: z.string().optional(),
        })
        .strict()
        .describe(
          `target keyword fields and target keywords
        use this parameter to filter the dataset by keywords that certain fields should contain;
        you can indicate several fields;
        Note: to match an exact phrase instead of a stand-alone keyword, use double quotes and backslashes;
        example:
        {
          "snippet": "\"logitech mouse\"",
          "main_title": "sale"
        }`,
        )
        .optional(),
      page_type: z
        .array(
          z.enum([
            "ecommerce",
            "news",
            "blogs",
            "message-boards",
            "organization",
          ]),
        )
        .describe("target page types")
        .optional(),
      search_mode: z
        .enum(["as_is", "one_per_domain"])
        .describe("results grouping type")
        .optional(),
      limit: z
        .number()
        .gte(1)
        .lte(1000)
        .describe("maximum number of results to return")
        .default(10),
      offset: z
        .number()
        .gte(0)
        .describe("offset in the results array of returned keywords")
        .default(0),
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
          `array of results filtering parameters
optional field
you can add several filters at once (8 filters maximum)
you should set a logical operator and, or between the conditions
the following operators are supported:
regex, not_regex, <, <=, >, >=, =, <>, in, not_in, like,not_like, match, not_match
you can use the % operator with like and not_like to match any string of zero or more characters
example:
["country","=", "US"]
[["domain_rank",">",800],"and",["content_info.connotation_types.negative",">",0.9]]

[["domain_rank",">",800],
"and",
[["page_types","has","ecommerce"],
"or",
["content_info.text_category","has",10994]]`,
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
["content_info.sentiment_connotations.anger,desc"]
default rule:
["content_info.sentiment_connotations.anger,desc"]
note that you can set no more than three sorting rules in a single request
you should use a comma to separate several sorting rules
example:
["content_info.sentiment_connotations.anger,desc","keyword_data.keyword_info.cpc,desc"]`,
        )
        .optional(),
    }),
    execute: async (args) => {
      const client = await getClient();
      const result = await client.callTool({
        name: "content_analysis_search",
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


