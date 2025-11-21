import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: serp_youtube_organic_live_advanced
// Source: https://mcp.dataforseo.com/http
export const serp_youtube_organic_live_advancedToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description:
      "provides top 20 blocks of youtube search engine results for a keyword",
    parameters: z.object({
      keyword: z.string().describe("Search keyword"),
      location_name: z.string().describe(`full name of the location
required field
Location format - hierarchical, comma-separated (from most specific to least)
 Can be one of:
 1. Country only: "United States"
 2. Region,Country: "California,United States"
 3. City,Region,Country: "San Francisco,California,United States"`),
      language_code: z
        .string()
        .describe("search engine language code (e.g., 'en')"),
      device: z
        .string()
        .describe(
          `device type
optional field
can take the values:desktop, mobile
default value: desktop`,
        )
        .default("desktop"),
      os: z
        .string()
        .describe(
          `device operating system
optional field
if you specify desktop in the device field, choose from the following values: windows, macos
default value: windows
if you specify mobile in the device field, choose from the following values: android, ios
default value: android`,
        )
        .default("windows"),
      block_depth: z
        .number()
        .describe(
          `parsing depth
optional field
number of blocks of results in SERP
max value: 700`,
        )
        .default(20),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "serp_youtube_organic_live_advanced",
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
