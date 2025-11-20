import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: on_page_content_parsing
// Source: https://mcp.dataforseo.com/http
export const on_page_content_parsingToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `This endpoint allows parsing the content on any page you specify and will return the structured content of the target page, including link URLs, anchors, headings, and textual content.`,
    inputSchema: z.object({
      url: z.string().describe("URL of the page to parse"),
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
        .describe("Accept-Language header value")
        .optional(),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "on_page_content_parsing",
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
