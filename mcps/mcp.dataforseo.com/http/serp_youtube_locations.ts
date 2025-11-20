import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: serp_youtube_locations
// Source: https://mcp.dataforseo.com/http
export const serp_youtube_locationsToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Utility tool to get list of available locations for: serp_youtube_organic_live_advanced, serp_youtube_video_info_live_advanced, serp_youtube_video_comments_live_advanced, serp_youtube_video_subtitles_live_advanced.`,
    inputSchema: z.object({
      country_iso_code: z
        .string()
        .describe("ISO 3166-1 alpha-2 country code, for example: US, GB, MT"),
      location_type: z
        .string()
        .describe(
          `Type of location. Possible variants: 'TV Region','Postal Code','Neighborhood','Governorate','National Park','Quarter','Canton','Airport','Okrug','Prefecture','City','Country','Province','Barrio','Sub-District','Congressional District','Municipality District','district','DMA Region','Union Territory','Territory','Colloquial Area','Autonomous Community','Borough','County','State','District','City Region','Commune','Region','Department','Division','Sub-Ward','Municipality','University'`,
        )
        .optional(),
      location_name: z
        .string()
        .describe("Name of location or it`s part.")
        .optional(),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "serp_youtube_locations",
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
