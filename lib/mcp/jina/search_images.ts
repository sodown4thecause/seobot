import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: search_images
// Source: https://mcp.jina.ai/sse
export const search_imagesToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Search for images across the web, similar to Google Images. Use this when you need to find photos, illustrations, diagrams, charts, logos, or any visual content. Perfect for finding images to illustrate concepts, locating specific pictures, or discovering visual resources. Images are returned by default as small base64-encoded JPEG images.`,
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          `Image search terms describing what you want to find (e.g., 'sunset over mountains', 'vintage car illustration', 'data visualization chart')`,
        ),
      return_url: z
        .boolean()
        .describe(
          `Set to true to return image URLs, title, shapes, and other metadata. By default, images are downloaded as base64 and returned as rendered images.`,
        )
        .default(false),
      tbs: z
        .string()
        .describe(
          `Time-based search parameter, e.g., 'qdr:h' for past hour, can be qdr:h, qdr:d, qdr:w, qdr:m, qdr:y`,
        )
        .optional(),
      location: z
        .string()
        .describe(
          "Location for search results, e.g., 'London', 'New York', 'Tokyo'",
        )
        .optional(),
      gl: z
        .string()
        .describe("Country code, e.g., 'dz' for Algeria")
        .optional(),
      hl: z
        .string()
        .describe("Language code, e.g., 'zh-cn' for Simplified Chinese")
        .optional(),
    }),
    execute: async (args) => {
      const client = await getClient();
      const result = await client.callTool({
        name: "search_images",
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

