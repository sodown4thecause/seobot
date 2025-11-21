import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: content_analysis_summary
// Source: https://mcp.dataforseo.com/http
export const content_analysis_summaryToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `This endpoint will provide you with an overview of citation data available for the target keyword`,
    parameters: z.object({
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
      initial_dataset_filters: z
        .array(
          z.union([
            z
              .array(z.union([z.string(), z.number(), z.boolean()]))
              .min(3)
              .max(3),
            z.enum(["and", "or"]),
            
            z.union([z.string(), z.number()]),
          ]),
        )
        .max(3)
        .describe(
          `initial dataset filtering parameters
        initial filtering parameters that apply to fields in the Search endpoint;
        you can add several filters at once (8 filters maximum);
        you should set a logical operator and, or between the conditions;
        the following operators are supported:
        regex, not_regex, <, <=, >, >=, =, <>, in, not_in, like,not_like, has, has_not, match, not_match
        you can use the % operator with like and not_like to match any string of zero or more characters;
        example:
        ["domain","<>", "logitech.com"]
        [["domain","<>","logitech.com"],"and",["content_info.connotation_types.negative",">",1000]]

        [["domain","<>","logitech.com"]],
        "and",
        [["content_info.connotation_types.negative",">",1000],
        "or",
        ["content_info.text_category","has",10994]]`,
        )
        .optional(),
      positive_connotation_threshold: z
        .number()
        .gte(0)
        .lte(1)
        .describe(
          `positive connotation threshold
          specified as the probability index threshold for positive sentiment related to the citation content
          if you specify this field, connotation_types object in the response will only contain data on citations with positive sentiment probability more than or equal to the specified value`,
        )
        .default(0.4),
      sentiments_connotation_threshold: z
        .number()
        .gte(0)
        .lte(1)
        .describe(
          `sentiment connotation threshold
specified as the probability index threshold for sentiment connotations related to the citation content
if you specify this field, sentiment_connotations object in the response will only contain data on citations where the
probability per each sentiment is more than or equal to the specified value`,
        )
        .default(0.4),
      internal_list_limit: z
        .number()
        .gte(1)
        .lte(20)
        .describe(
          `maximum number of elements within internal arrays
          you can use this field to limit the number of elements within the following arrays`,
        )
        .default(1),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "content_analysis_summary",
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

