import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: firecrawl_scrape
// Source: https://mcp.firecrawl.dev/fc-9b271ecf3a944c3faf93489565547fc8/v2/mcp
export const firecrawl_scrapeToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `
Scrape content from a single URL with advanced options. 
This is the most powerful, fastest and most reliable scraper tool, if available you should always default to using this tool for any web scraping needs.

**Best for:** Single page content extraction, when you know exactly which page contains the information.
**Not recommended for:** Multiple pages (use batch_scrape), unknown page (use search), structured data (use extract).
**Common mistakes:** Using scrape for a list of URLs (use batch_scrape instead). If batch scrape doesnt work, just use scrape and call it multiple times.
**Prompt Example:** "Get the content of the page at https://example.com."
**Usage Example:**
\`\`\`json
{
  "name": "firecrawl_scrape",
  "arguments": {
    "url": "https://example.com",
    "formats": ["markdown"],
    "maxAge": 172800000
  }
}
\`\`\`
**Performance:** Add maxAge parameter for 500% faster scrapes using cached data.
**Returns:** Markdown, HTML, or other formats as specified.
**Safe Mode:** Read-only content extraction. Interactive actions (click, write, executeJavascript) are disabled for security.
`,
    parameters: z.object({
      url: z.string().url(),
      formats: z
        .array(
          z.union([
            z.enum([
              "markdown",
              "html",
              "rawHtml",
              "screenshot",
              "links",
              "summary",
              "changeTracking",
              "branding",
            ]),
            z
              .object({
                type: z.literal("json"),
                prompt: z.string().optional(),
                schema: z.record(z.any()).optional(),
              })
              .strict(),
            z
              .object({
                type: z.literal("screenshot"),
                fullPage: z.boolean().optional(),
                quality: z.number().optional(),
                viewport: z
                  .object({ width: z.number(), height: z.number() })
                  .strict()
                  .optional(),
              })
              .strict(),
          ]),
        )
        .optional(),
      parsers: z
        .array(
          z.union([
            z.literal("pdf"),
            z
              .object({
                type: z.literal("pdf"),
                maxPages: z.number().int().gte(1).lte(10000).optional(),
              })
              .strict(),
          ]),
        )
        .optional(),
      onlyMainContent: z.boolean().optional(),
      includeTags: z.array(z.string()).optional(),
      excludeTags: z.array(z.string()).optional(),
      waitFor: z.number().optional(),
      mobile: z.boolean().optional(),
      skipTlsVerification: z.boolean().optional(),
      removeBase64Images: z.boolean().optional(),
      location: z
        .object({
          country: z.string().optional(),
          languages: z.array(z.string()).optional(),
        })
        .strict()
        .optional(),
      storeInCache: z.boolean().optional(),
      maxAge: z.number().optional(),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "firecrawl_scrape",
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
