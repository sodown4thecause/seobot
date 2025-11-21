import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: guess_datetime_url
// Source: https://mcp.jina.ai/sse
export const guess_datetime_urlToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Guess the last updated or published datetime of a web page. This tool examines HTTP headers, HTML metadata, Schema.org data, visible dates, JavaScript timestamps, HTML comments, Git information, RSS/Atom feeds, sitemaps, and international date formats to provide the most accurate update time with confidence scores. Returns the best guess timestamp and confidence level.`,
    parameters: z.object({
      url: z
        .string()
        .url()
        .describe(
          "The complete HTTP/HTTPS URL of the webpage to guess datetime information",
        ),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "guess_datetime_url",
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
