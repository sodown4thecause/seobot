import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: read_url
// Source: https://mcp.jina.ai/sse
export const read_urlToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Extract and convert web page content to clean, readable markdown format. Perfect for reading articles, documentation, blog posts, or any web content. Use this when you need to analyze text content from websites, bypass paywalls, or get structured data.`,
    inputSchema: z.object({
      url: z
        .string().url()
        .describe(
          `The complete URL of the webpage or PDF file to read and convert (e.g., 'https://example.com/article').`,
        ),
      withAllLinks: z
        .boolean()
        .describe(
          `Set to true to extract and return all hyperlinks found on the page as structured data`,
        )
        .optional(),
      withAllImages: z
        .boolean()
        .describe(
          `Set to true to extract and return all images found on the page as structured data`,
        )
        .optional(),
    }),
    execute: async (args) => {
      const client = await getClient();
      const result = await client.callTool({
        name: "read_url",
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

