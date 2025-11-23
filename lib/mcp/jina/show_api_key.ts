import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: show_api_key
// Source: https://mcp.jina.ai/sse
export const show_api_keyToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Return the bearer token from the Authorization header of the MCP settings, which is used to debug.`,
    parameters: z.object({}),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "show_api_key",
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
