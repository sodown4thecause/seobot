import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: deduplicate_images
// Source: https://mcp.jina.ai/sse
export const deduplicate_imagesToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Get top-k semantically unique images (URLs or base64-encoded) using Jina CLIP v2 embeddings and submodular optimization. Use this when you have many visually similar images and want the most diverse subset.`,
    inputSchema: z.object({
      images: z
        .array(z.string())
        .describe(
          `Array of image inputs to deduplicate. Each item can be either an HTTP(S) URL or a raw base64-encoded image string (without data URI prefix).`,
        ),
      k: z
        .number()
        .describe(
          `Number of unique images to return. If not provided, automatically finds optimal k by looking at diminishing return`,
        )
        .optional(),
    }),
    execute: async (args) => {
      const client = await getClient();
      const result = await client.callTool({
        name: "deduplicate_images",
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

