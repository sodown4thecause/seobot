import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: backlinks_summary
// Source: https://mcp.dataforseo.com/http
export const backlinks_summaryToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `This endpoint will provide you with an overview of backlinks data available for a given domain, subdomain, or webpage`,
    inputSchema: z.object({
      target: z.string()
        .describe(`domain, subdomain or webpage to get backlinks for
        required field
a domain or a subdomain should be specified without https:// and www.
a page should be specified with absolute URL (including http:// or https://)`),
      include_subdomains: z
        .boolean()
        .describe(
          `indicates if indirect links to the target will be included in the results
if set to true, the results will include data on indirect links pointing to a page that either redirects to the target, or points to a canonical page
if set to false, indirect links will be ignored`,
        )
        .default(true),
      exclude_internal_backlinks: z
        .boolean()
        .describe(
          `indicates if internal backlinks from subdomains to the target will be excluded from the results
if set to true, the results will not include data on internal backlinks from subdomains of the same domain as target
if set to false, internal links will be included in the results`,
        )
        .default(true),
    }),
    execute: async (args) => {
      const client = await getClient();
      const result = await client.callTool({
        name: "backlinks_summary",
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

