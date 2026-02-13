import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

/**
 * Firecrawl Agent Tool - Advanced Web Intelligence
 * 
 * The agent endpoint is Firecrawl's most powerful feature (December 2025),
 * capable of multi-page navigation, data extraction, and complex research tasks.
 * 
 * Use this when you need:
 * - Top 10 competitor analysis (parallel scraping)
 * - Live statistics gathering from multiple authoritative sources
 * - Dynamic SERP feature analysis
 * - Broken link discovery
 * - Complex multi-step web research
 * 
 * Auto-generated wrapper for MCP tool: firecrawl_agent
 * Source: https://mcp.firecrawl.dev/v2/mcp
 */
export const firecrawl_agentToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `
Advanced web agent for multi-page navigation, competitive intelligence, and complex data extraction.

**Best for:** Complex research tasks requiring multiple pages, competitive analysis, live statistics gathering.
**Not recommended for:** Single page scraping (use firecrawl_scrape instead).
**Common use cases:**
- Analyze top 10 ranking competitors for a keyword (extract structure, word count, headings, schema)
- Find latest statistics on a topic from authoritative sources
- Discover broken links on competitor sites
- Extract structured data from multiple related pages

**Prompt Example:** "Research the top 10 pages ranking for 'best CRM software' and extract their content structure, word count, and main topics."

**Usage Example:**
\`\`\`json
{
  "name": "firecrawl_agent",
  "arguments": {
    "task": "Find top 10 ranking pages for 'best CRM software' and extract: 1) URL, 2) Word count, 3) Main H2 headings, 4) Internal links count, 5) Schema types used",
    "maxPages": 10,
    "formats": ["markdown", "html"],
    "extractSchema": {
      "type": "object",
      "properties": {
        "url": {"type": "string"},
        "wordCount": {"type": "number"},
        "headings": {"type": "array"},
        "internalLinks": {"type": "number"},
        "schemaTypes": {"type": "array"}
      }
    }
  }
}
\`\`\`

**Performance:** Agent can process multiple pages in parallel, typically completing 10-page analysis in 30-45 seconds.
**Returns:** Structured data matching your extractSchema, plus full content in requested formats.
**Safe Mode:** Read-only research. No modifications to target sites.
`,
    inputSchema: z.object({
      task: z.string().describe("Natural language description of what to research or extract. Be specific about data points needed."),
      startUrls: z.array(z.string().url()).optional().describe("Optional: Starting URLs to research. If not provided, agent will search based on task."),
      maxPages: z.number().min(1).max(50).optional().default(10).describe("Maximum number of pages to process. Default: 10"),
      formats: z
        .array(
          z.enum(["markdown", "html", "rawHtml", "links", "screenshot"])
        )
        .optional()
        .default(["markdown"])
        .describe("Output formats. Default: ['markdown']"),
      extractSchema: z.record(z.any()).optional().describe("JSON schema defining structured data to extract from each page"),
      waitFor: z.number().optional().describe("Milliseconds to wait for dynamic content. Default: 0"),
      maxDepth: z.number().min(1).max(5).optional().default(2).describe("Maximum link depth to follow. Default: 2"),
      includePaths: z.array(z.string()).optional().describe("URL patterns to include (e.g., ['/blog/', '/products/'])"),
      excludePaths: z.array(z.string()).optional().describe("URL patterns to exclude (e.g., ['/login', '/admin'])"),
      storeInCache: z.boolean().optional().default(true).describe("Cache results for faster subsequent queries"),
      maxAge: z.number().optional().describe("Use cached data if younger than this (milliseconds). Default: 7 days for stable content."),
    }),
    execute: async (args) => {
      const client = await getClient();
      
      // Set intelligent defaults for maxAge based on task type
      const defaultMaxAge = args.maxAge || (
        args.task.toLowerCase().includes('statistic') || 
        args.task.toLowerCase().includes('latest') ||
        args.task.toLowerCase().includes('current')
          ? 3600000 // 1 hour for fresh data
          : 604800000 // 7 days for stable content like competitor analysis
      );

      const result = await client.callTool({
        name: "firecrawl_agent",
        arguments: {
          ...args,
          maxAge: defaultMaxAge,
        },
      });

      // Handle different content types from MCP
      if (Array.isArray(result.content)) {
        return result.content
          .map((item: unknown) =>
            typeof item === "string" ? item : JSON.stringify(item, null, 2),
          )
          .join("\n");
      } else if (typeof result.content === "string") {
        return result.content;
      } else {
        return JSON.stringify(result.content, null, 2);
      }
    },
  });

