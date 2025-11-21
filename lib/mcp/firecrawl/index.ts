// Auto-generated index file for MCP tools
// Source: https://mcp.firecrawl.dev/fc-9b271ecf3a944c3faf93489565547fc8/v2/mcp
import { getMcpClient } from "./client";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { firecrawl_scrapeToolWithClient } from "./firecrawl_scrape";
import { firecrawl_mapToolWithClient } from "./firecrawl_map";
import { firecrawl_searchToolWithClient } from "./firecrawl_search";
import { firecrawl_crawlToolWithClient } from "./firecrawl_crawl";
import { firecrawl_check_crawl_statusToolWithClient } from "./firecrawl_check_crawl_status";
import { firecrawl_extractToolWithClient } from "./firecrawl_extract";

// Exports using a default client
export const mcpFirecrawlTools = {
  firecrawl_scrape: firecrawl_scrapeToolWithClient(getMcpClient),
  firecrawl_map: firecrawl_mapToolWithClient(getMcpClient),
  firecrawl_search: firecrawl_searchToolWithClient(getMcpClient),
  firecrawl_crawl: firecrawl_crawlToolWithClient(getMcpClient),
  firecrawl_check_crawl_status:
    firecrawl_check_crawl_statusToolWithClient(getMcpClient),
  firecrawl_extract: firecrawl_extractToolWithClient(getMcpClient),
} as const;

export const mcpFirecrawlToolsWithClient = (client: Promise<Client> | Client) =>
  ({
    firecrawl_scrape: firecrawl_scrapeToolWithClient(() => client),
    firecrawl_map: firecrawl_mapToolWithClient(() => client),
    firecrawl_search: firecrawl_searchToolWithClient(() => client),
    firecrawl_crawl: firecrawl_crawlToolWithClient(() => client),
    firecrawl_check_crawl_status: firecrawl_check_crawl_statusToolWithClient(
      () => client,
    ),
    firecrawl_extract: firecrawl_extractToolWithClient(() => client),
  }) as const;

// Individual tool exports
export const firecrawl_scrapeTool =
  firecrawl_scrapeToolWithClient(getMcpClient);
export const firecrawl_mapTool = firecrawl_mapToolWithClient(getMcpClient);
export const firecrawl_searchTool =
  firecrawl_searchToolWithClient(getMcpClient);
export const firecrawl_crawlTool = firecrawl_crawlToolWithClient(getMcpClient);
export const firecrawl_check_crawl_statusTool =
  firecrawl_check_crawl_statusToolWithClient(getMcpClient);
export const firecrawl_extractTool =
  firecrawl_extractToolWithClient(getMcpClient);
