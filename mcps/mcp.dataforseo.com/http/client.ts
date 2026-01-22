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

/**
 * Create Basic Auth header using Web APIs (Edge runtime compatible)
 */
function createBasicAuth(username: string, password: string): string {
  const preencoded = serverEnv.DATAFORSEO_BASIC_AUTH?.trim();
  if (preencoded) {
    return preencoded.startsWith('Basic ') ? preencoded : `Basic ${preencoded}`;
  }

  // Use Web API btoa instead of Buffer (Edge runtime compatible)
  const credentials = `${username}:${password}`;
  const encoded = btoa(credentials);
  return `Basic ${encoded}`;
}

async function connectToMcp(): Promise<Client> {
  const mcpUrl = (serverEnv.DATAFORSEO_MCP_URL || 'https://mcp.dataforseo.com/http').trim();

  const transport = new StreamableHTTPClientTransport(
    new URL(mcpUrl),
    {
      requestInit: {
        headers: {
          Authorization: createBasicAuth(serverEnv.DATAFORSEO_USERNAME, serverEnv.DATAFORSEO_PASSWORD),
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
