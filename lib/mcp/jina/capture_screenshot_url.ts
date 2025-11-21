import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: capture_screenshot_url
// Source: https://mcp.jina.ai/sse
export const capture_screenshot_urlToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Capture high-quality screenshots of web pages in base64 encoded JPEG format. Use this tool when you need to visually inspect a website, take a snapshot for analysis, or show users what a webpage looks like.`,
    parameters: z.object({
      url: z
        .string()
        .url()
        .describe(
          `The complete HTTP/HTTPS URL of the webpage to capture (e.g., 'https://example.com')`,
        ),
      firstScreenOnly: z
        .boolean()
        .describe(
          `Set to true for a single screen capture (faster), false for full page capture including content below the fold`,
        )
        .default(false),
      return_url: z
        .boolean()
        .describe(
          "Set to true to return screenshot URLs instead of downloading images as base64",
        )
        .default(false),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "capture_screenshot_url",
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
