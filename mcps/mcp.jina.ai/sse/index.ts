// Auto-generated index file for MCP tools
// Source: https://mcp.jina.ai/sse
import { getMcpClient } from "./client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { show_api_keyToolWithClient } from "./show_api_key.js";
import { primerToolWithClient } from "./primer.js";
import { guess_datetime_urlToolWithClient } from "./guess_datetime_url.js";
import { capture_screenshot_urlToolWithClient } from "./capture_screenshot_url.js";
import { read_urlToolWithClient } from "./read_url.js";
import { search_webToolWithClient } from "./search_web.js";
import { expand_queryToolWithClient } from "./expand_query.js";
import { search_arxivToolWithClient } from "./search_arxiv.js";
import { search_imagesToolWithClient } from "./search_images.js";
import { parallel_search_webToolWithClient } from "./parallel_search_web.js";
import { parallel_search_arxivToolWithClient } from "./parallel_search_arxiv.js";
import { parallel_read_urlToolWithClient } from "./parallel_read_url.js";
import { sort_by_relevanceToolWithClient } from "./sort_by_relevance.js";
import { deduplicate_stringsToolWithClient } from "./deduplicate_strings.js";
import { deduplicate_imagesToolWithClient } from "./deduplicate_images.js";

// Exports using a default client
export const mcpJinaTools = {
  show_api_key: show_api_keyToolWithClient(getMcpClient),
  primer: primerToolWithClient(getMcpClient),
  guess_datetime_url: guess_datetime_urlToolWithClient(getMcpClient),
  capture_screenshot_url: capture_screenshot_urlToolWithClient(getMcpClient),
  read_url: read_urlToolWithClient(getMcpClient),
  search_web: search_webToolWithClient(getMcpClient),
  expand_query: expand_queryToolWithClient(getMcpClient),
  search_arxiv: search_arxivToolWithClient(getMcpClient),
  search_images: search_imagesToolWithClient(getMcpClient),
  parallel_search_web: parallel_search_webToolWithClient(getMcpClient),
  parallel_search_arxiv: parallel_search_arxivToolWithClient(getMcpClient),
  parallel_read_url: parallel_read_urlToolWithClient(getMcpClient),
  sort_by_relevance: sort_by_relevanceToolWithClient(getMcpClient),
  deduplicate_strings: deduplicate_stringsToolWithClient(getMcpClient),
  deduplicate_images: deduplicate_imagesToolWithClient(getMcpClient),
} as const;

export const mcpJinaToolsWithClient = (client: Promise<Client> | Client) =>
  ({
    show_api_key: show_api_keyToolWithClient(() => client),
    primer: primerToolWithClient(() => client),
    guess_datetime_url: guess_datetime_urlToolWithClient(() => client),
    capture_screenshot_url: capture_screenshot_urlToolWithClient(() => client),
    read_url: read_urlToolWithClient(() => client),
    search_web: search_webToolWithClient(() => client),
    expand_query: expand_queryToolWithClient(() => client),
    search_arxiv: search_arxivToolWithClient(() => client),
    search_images: search_imagesToolWithClient(() => client),
    parallel_search_web: parallel_search_webToolWithClient(() => client),
    parallel_search_arxiv: parallel_search_arxivToolWithClient(() => client),
    parallel_read_url: parallel_read_urlToolWithClient(() => client),
    sort_by_relevance: sort_by_relevanceToolWithClient(() => client),
    deduplicate_strings: deduplicate_stringsToolWithClient(() => client),
    deduplicate_images: deduplicate_imagesToolWithClient(() => client),
  }) as const;

// Individual tool exports
export const show_api_keyTool = show_api_keyToolWithClient(getMcpClient);
export const primerTool = primerToolWithClient(getMcpClient);
export const guess_datetime_urlTool =
  guess_datetime_urlToolWithClient(getMcpClient);
export const capture_screenshot_urlTool =
  capture_screenshot_urlToolWithClient(getMcpClient);
export const read_urlTool = read_urlToolWithClient(getMcpClient);
export const search_webTool = search_webToolWithClient(getMcpClient);
export const expand_queryTool = expand_queryToolWithClient(getMcpClient);
export const search_arxivTool = search_arxivToolWithClient(getMcpClient);
export const search_imagesTool = search_imagesToolWithClient(getMcpClient);
export const parallel_search_webTool =
  parallel_search_webToolWithClient(getMcpClient);
export const parallel_search_arxivTool =
  parallel_search_arxivToolWithClient(getMcpClient);
export const parallel_read_urlTool =
  parallel_read_urlToolWithClient(getMcpClient);
export const sort_by_relevanceTool =
  sort_by_relevanceToolWithClient(getMcpClient);
export const deduplicate_stringsTool =
  deduplicate_stringsToolWithClient(getMcpClient);
export const deduplicate_imagesTool =
  deduplicate_imagesToolWithClient(getMcpClient);
