import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: parallel_read_url
// Source: https://mcp.jina.ai/sse
export const parallel_read_urlToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Read multiple web pages in parallel to extract clean content efficiently. For best results, provide multiple URLs that you need to extract simultaneously. This is useful for comparing content across multiple sources or gathering information from multiple pages at once.`,
    inputSchema: z.object({
      urls: z
        .array(
          z
            .object({
              url: z
                .string()
                .url()
                .describe(
                  "The complete URL of the webpage or PDF file to read and convert",
                ),
              withAllLinks: z
                .boolean()
                .describe(
                  `Set to true to extract and return all hyperlinks found on the page as structured data`,
                )
                .default(false),
              withAllImages: z
                .boolean()
                .describe(
                  `Set to true to extract and return all images found on the page as structured data`,
                )
                .default(false),
            })
            .strict(),
        )
        .max(5)
        .describe(
          `Array of URL configurations to read in parallel (maximum 5 URLs for optimal performance)`,
        ),
      timeout: z
        .number()
        .describe("Timeout in milliseconds for all URL reads")
        .default(30000),
    }),
    execute: async (args) => {
      const client = await getClient();
      const result = await client.callTool({
        name: "parallel_read_url",
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

