import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: domain_analytics_whois_available_filters
// Source: https://mcp.dataforseo.com/http
export const domain_analytics_whois_available_filtersToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Here you will find all the necessary information about filters that can be used with DataForSEO WHOIS API endpoints.

Please, keep in mind that filters are associated with a certain object in the result array, and should be specified accordingly.`,
    inputSchema: z.object({
      tool: z
        .string()
        .describe("The name of the tool to get filters for")
        .optional(),
    }),
    execute: async (args) => {
      const client = await getClient();
      const result = await client.callTool({
        name: "domain_analytics_whois_available_filters",
        arguments: args,
      });

      // Handle different content types from MCP with defensive null/undefined handling
      if (result.content === undefined || result.content === null) {
        return "{}";
      } else if (Array.isArray(result.content)) {
        return result.content
          .map((item: unknown) =>
            typeof item === "string" ? item : JSON.stringify(item ?? null),
          )
          .join("\n");
      } else if (typeof result.content === "string") {
        return result.content;
      } else {
        return JSON.stringify(result.content ?? null);
      }
    },
  });

