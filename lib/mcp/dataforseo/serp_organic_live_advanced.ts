import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: serp_organic_live_advanced
// Source: https://mcp.dataforseo.com/http
export const serp_organic_live_advancedToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description:
      "Get organic search results for a keyword in specified search engine",
    inputSchema: z.object({
      search_engine: z
        .string()
        .describe("search engine name, one of: google, yahoo, bing.")
        .default("google"),
      location_name: z
        .string()
        .describe(
          `full name of the location
required field
Location format - hierarchical, comma-separated (from most specific to least)
 Can be one of:
 1. Country only: "United States"
 2. Region,Country: "California,United States"
 3. City,Region,Country: "San Francisco,California,United States"`,
        )
        .default("United States"),
      depth: z
        .number()
        .gte(10)
        .lte(700)
        .describe(
          `parsing depth
optional field
number of results in SERP`,
        )
        .default(10),
      language_code: z
        .string()
        .describe("search engine language code (e.g., 'en')"),
      keyword: z.string().describe("Search keyword"),
      max_crawl_pages: z
        .number()
        .gte(1)
        .lte(7)
        .describe(
          `page crawl limit
optional field
number of search results pages to crawl
max value: 100
Note: the max_crawl_pages and depth parameters complement each other`,
        )
        .default(1),
      device: z
        .string()
        .describe(
          `device type
optional field
can take the values:desktop, mobile
default value: desktop`,
        )
        .default("desktop"),
      people_also_ask_click_depth: z
        .number()
        .gte(1)
        .lte(4)
        .describe(
          `clicks on the corresponding element
        specify the click depth on the people_also_ask element to get additional people_also_ask_element items;`,
        )
        .optional(),
    }),
    execute: async (args) => {
      const client = await getClient();
      const result = await client.callTool({
        name: "serp_organic_live_advanced",
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

