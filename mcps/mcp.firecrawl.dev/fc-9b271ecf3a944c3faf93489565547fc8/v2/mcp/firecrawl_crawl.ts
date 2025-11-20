import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: firecrawl_crawl
// Source: https://mcp.firecrawl.dev/fc-9b271ecf3a944c3faf93489565547fc8/v2/mcp
export const firecrawl_crawlToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `
 Starts a crawl job on a website and extracts content from all pages.
 
 **Best for:** Extracting content from multiple related pages, when you need comprehensive coverage.
 **Not recommended for:** Extracting content from a single page (use scrape); when token limits are a concern (use map + batch_scrape); when you need fast results (crawling can be slow).
 **Warning:** Crawl responses can be very large and may exceed token limits. Limit the crawl depth and number of pages, or use map + batch_scrape for better control.
 **Common mistakes:** Setting limit or maxDiscoveryDepth too high (causes token overflow) or too low (causes missing pages); using crawl for a single page (use scrape instead). Using a /* wildcard is not recommended.
 **Prompt Example:** "Get all blog posts from the first two levels of example.com/blog."
 **Usage Example:**
 \`\`\`json
 {
   "name": "firecrawl_crawl",
   "arguments": {
     "url": "https://example.com/blog/*",
     "maxDiscoveryDepth": 5,
     "limit": 20,
     "allowExternalLinks": false,
     "deduplicateSimilarURLs": true,
     "sitemap": "include"
   }
 }
 \`\`\`
 **Returns:** Operation ID for status checking; use firecrawl_check_crawl_status to check progress.
 **Safe Mode:** Read-only crawling. Webhooks and interactive actions are disabled for security.
 `,
    inputSchema: z.object({
      url: z.string(),
      prompt: z.string().optional(),
      excludePaths: z.array(z.string()).optional(),
      includePaths: z.array(z.string()).optional(),
      maxDiscoveryDepth: z.number().optional(),
      sitemap: z.enum(["skip", "include", "only"]).optional(),
      limit: z.number().optional(),
      allowExternalLinks: z.boolean().optional(),
      allowSubdomains: z.boolean().optional(),
      crawlEntireDomain: z.boolean().optional(),
      delay: z.number().optional(),
      maxConcurrency: z.number().optional(),
      deduplicateSimilarURLs: z.boolean().optional(),
      ignoreQueryParameters: z.boolean().optional(),
      scrapeOptions: z
        .object({
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
        })
        .strict()
        .optional(),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "firecrawl_crawl",
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
