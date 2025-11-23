import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: on_page_lighthouse
// Source: https://mcp.dataforseo.com/http
export const on_page_lighthouseToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `The OnPage Lighthouse API is based on Google’s open-source Lighthouse project for measuring the quality of web pages and web apps.`,
    parameters: z.object({
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
        name: "on_page_lighthouse",
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
