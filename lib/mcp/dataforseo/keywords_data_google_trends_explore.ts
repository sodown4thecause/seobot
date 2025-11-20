import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: keywords_data_google_trends_explore
// Source: https://mcp.dataforseo.com/http
export const keywords_data_google_trends_exploreToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `This endpoint will provide you with the keyword popularity data from the ‘Explore’ feature of Google Trends. You can check keyword trends for Google Search, Google News, Google Images, Google Shopping, and YouTube`,
    inputSchema: z.object({
      location_name: z
        .union([
          z.string().describe(`full name of the location
        optional field
        in format "Country"
        example:
        United Kingdom`),
          z.null().describe(`full name of the location
        optional field
        in format "Country"
        example:
        United Kingdom`),
        ])
        .describe(
          `full name of the location
        optional field
        in format "Country"
        example:
        United Kingdom`,
        )
        .default(null),
      language_code: z
        .union([
          z.string().describe(`Language two-letter ISO code (e.g., 'en').
        optional field`),
          z.null().describe(`Language two-letter ISO code (e.g., 'en').
        optional field`),
        ])
        .describe(
          `Language two-letter ISO code (e.g., 'en').
        optional field`,
        )
        .default(null),
      keywords: z.array(z.string()).describe(`keywords
        the maximum number of keywords you can specify: 5
        the maximum number of characters you can specify in a keyword: 100
        the minimum number of characters must be greater than 1
        comma characters (,) in the specified keywords will be unset and ignored
        Note: keywords cannot consist of a combination of the following characters: < > |  " - + = ~ ! : * ( ) [ ] { }

        Note: to obtain google_trends_topics_list and google_trends_queries_list items, specify no more than 1 keyword`),
      type: z
        .enum(["web", "news", "youtube", "images", "froogle"])
        .describe("google trends type")
        .default("web"),
      date_from: z
        .string()
        .describe(
          `starting date of the time range
          if you don’t specify this field, the current day and month of the preceding year will be used by default
          minimal value for the web type: 2004-01-01
          minimal value for other types: 2008-01-01
          date format: "yyyy-mm-dd"
          example:
          "2019-01-15"`,
        )
        .optional(),
      date_to: z
        .string()
        .describe(
          `ending date of the time range
            if you don’t specify this field, the today’s date will be used by default
            date format: "yyyy-mm-dd"
            example:
            "2019-01-15"`,
        )
        .optional(),
      time_range: z
        .enum([
          "past_hour",
          "past_4_hours",
          "past_day",
          "past_7_days",
          "past_30_days",
          "past_90_days",
          "past_12_months",
          "past_5_years",
        ])
        .describe(
          `preset time ranges
            if you specify date_from or date_to parameters, this field will be ignored when setting a task`,
        )
        .default("past_7_days"),
      item_types: z
        .array(
          z.enum([
            "google_trends_graph",
            "google_trends_map",
            "google_trends_topics_list",
            "google_trends_queries_list",
          ]),
        )
        .describe(
          `types of items returned
            to speed up the execution of the request, specify one item at a time`,
        )
        .default(["google_trends_graph"]),
      category_code: z
        .union([
          z.number().describe(`google trends search category
            you can receive the list of available categories with their category_code by making a separate request to the keywords_data_google_trends_categories tool`),
          z.null().describe(`google trends search category
            you can receive the list of available categories with their category_code by making a separate request to the keywords_data_google_trends_categories tool`),
        ])
        .describe(
          `google trends search category
            you can receive the list of available categories with their category_code by making a separate request to the keywords_data_google_trends_categories tool`,
        )
        .default(null),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "keywords_data_google_trends_explore",
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
