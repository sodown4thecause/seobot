import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { serverEnv } from "@/lib/config/env";

let connectionPromise: Promise<Client> | null = null;
export async function getMcpClient(): Promise<Client> {
  if (connectionPromise) {
    return connectionPromise;
  }

  return (connectionPromise = connectToMcp());
}

async function connectToMcp(): Promise<Client> {
  const apiKey = serverEnv.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is required");
  }

  // Construct MCP URL: https://mcp.firecrawl.dev/{FIRECRAWL_API_KEY}/v2/mcp
  const mcpUrl = serverEnv.FIRECRAWL_MCP_URL || `https://mcp.firecrawl.dev/${apiKey}/v2/mcp`;

  const transport = new StreamableHTTPClientTransport(
    new URL(mcpUrl),
    {
      requestInit: {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    },
  );
  const client = new Client(
    {
      name: "ai-sdk-mcp-wrapper",
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );
  await client.connect(transport);
  return client;
}

// Optional: Add cleanup function for graceful shutdown
export async function closeMcpClient(): Promise<void> {
  if (connectionPromise) {
    const client = await connectionPromise;
    await client.close();
    connectionPromise = null;
  }
}
