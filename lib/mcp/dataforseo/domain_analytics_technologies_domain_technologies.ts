import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: domain_analytics_technologies_domain_technologies
// Source: https://mcp.dataforseo.com/http
export const domain_analytics_technologies_domain_technologiesToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Using this endpoint you will get a list of technologies used in a particular domain`,
    inputSchema: z.object({
      target: z.string().describe(`target domain
required field
domain name of the website to analyze
Note: results will be returned for the specified domain only`),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "domain_analytics_technologies_domain_technologies",
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
