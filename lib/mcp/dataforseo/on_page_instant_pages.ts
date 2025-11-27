import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: on_page_instant_pages
// Source: https://mcp.dataforseo.com/http
export const on_page_instant_pagesToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Using this function you will get page-specific data with detailed information on how well a particular page is optimized for organic search`,
    inputSchema: z.object({
      url: z.string().describe("URL to analyze"),
      enable_javascript: z
        .boolean()
        .describe("Enable JavaScript rendering")
        .optional(),
      custom_js: z
        .string()
        .describe("Custom JavaScript code to execute")
        .optional(),
      custom_user_agent: z
        .string()
        .describe("Custom User-Agent header")
        .optional(),
      accept_language: z
        .string()
        .describe(
          `language header for accessing the website
        all locale formats are supported (xx, xx-XX, xxx-XX, etc.)
        Note: if you do not specify this parameter, some websites may deny access; in this case, pages will be returned with the "type":"broken in the response array`,
        )
        .optional(),
    }),
    execute: async (args) => {
      const client = await getClient();
      const result = await client.callTool({
        name: "on_page_instant_pages",
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

