import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: extract_pdf
// Source: https://mcp.jina.ai/v1
export const extract_pdfToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Extract figures, tables, and equations from PDF documents using layout detection. Perfect for extracting visual elements from academic papers on arXiv or any PDF URL. Returns base64-encoded images of detected elements with metadata.`,
    inputSchema: z
      .object({
        id: z
          .string()
          .describe(
            `arXiv paper ID (e.g., '2301.12345' or 'hep-th/9901001'). Either id or url is required.`,
          )
          .optional(),
        url: z
          .string()
          .url()
          .describe("Direct PDF URL. Either id or url is required.")
          .optional(),
        max_edge: z
          .number()
          .describe(
            "Maximum edge size for extracted images in pixels (default: 1024)",
          )
          .default(1024),
        type: z
          .string()
          .describe(
            `Filter by float types (comma-separated): figure, table, equation. If not specified, returns all types.`,
          )
          .optional(),
      })
      .strict(),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "extract_pdf",
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
