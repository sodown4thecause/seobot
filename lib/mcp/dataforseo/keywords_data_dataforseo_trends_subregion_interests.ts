import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: keywords_data_dataforseo_trends_subregion_interests
// Source: https://mcp.dataforseo.com/http
export const keywords_data_dataforseo_trends_subregion_interestsToolWithClient =
  (getClient: () => Promise<Client> | Client) =>
    tool({
      description: `This endpoint will provide you with location-specific keyword popularity data from DataForSEO Trends`,
      parameters: z.object({
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
        keywords: z.array(z.string()).describe(`keywords
        the maximum number of keywords you can specify: 5`),
        type: z
          .enum(["web", "news", "ecommerce"])
          .describe("dataforseo trends type")
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
      }),
      execute: async (args): Promise<string> => {
        const client = await getClient();
        const result = await client.callTool({
          name: "keywords_data_dataforseo_trends_subregion_interests",
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
