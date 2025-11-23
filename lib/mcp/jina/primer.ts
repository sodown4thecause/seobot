import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: primer
// Source: https://mcp.jina.ai/sse
export const primerToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Get up-to-date contextual information of the current session to provide localized, time-aware responses. Use this when you need to know the current time, user's location, or network environment to give more relevant and personalized information.`,
    parameters: z.object({}),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "primer",
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
