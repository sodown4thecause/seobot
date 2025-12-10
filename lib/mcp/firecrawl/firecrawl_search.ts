import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: firecrawl_search
// Source: https://mcp.firecrawl.dev/fc-9b271ecf3a944c3faf93489565547fc8/v2/mcp
export const firecrawl_searchToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `
Search the web and optionally extract content from search results. This is the most powerful web search tool available, and if available you should always default to using this tool for any web search needs.

The query also supports search operators, that you can use if needed to refine the search:
| Operator | Functionality | Examples |
---|-|-|
| \`""\` | Non-fuzzy matches a string of text | \`"Firecrawl"\`
| \`-\` | Excludes certain keywords or negates other operators | \`-bad\`, \`-site:firecrawl.dev\`
| \`site:\` | Only returns results from a specified website | \`site:firecrawl.dev\`
| \`inurl:\` | Only returns results that include a word in the URL | \`inurl:firecrawl\`
| \`allinurl:\` | Only returns results that include multiple words in the URL | \`allinurl:git firecrawl\`
| \`intitle:\` | Only returns results that include a word in the title of the page | \`intitle:Firecrawl\`
| \`allintitle:\` | Only returns results that include multiple words in the title of the page | \`allintitle:firecrawl playground\`
| \`related:\` | Only returns results that are related to a specific domain | \`related:firecrawl.dev\`
| \`imagesize:\` | Only returns images with exact dimensions | \`imagesize:1920x1080\`
| \`larger:\` | Only returns images larger than specified dimensions | \`larger:1920x1080\`

**Best for:** Finding specific information across multiple websites, when you don't know which website has the information; when you need the most relevant content for a query.
**Not recommended for:** When you need to search the filesystem. When you already know which website to scrape (use scrape); when you need comprehensive coverage of a single website (use map or crawl.
**Common mistakes:** Using crawl or map for open-ended questions (use search instead).
**Prompt Example:** "Find the latest research papers on AI published in 2023."
**Sources:** web, images, news, default to web unless needed images or news.
**Scrape Options:** Only use scrapeOptions when you think it is absolutely necessary. When you do so default to a lower limit to avoid timeouts, 5 or lower.
**Optimal Workflow:** Search first using firecrawl_search without formats, then after fetching the results, use the scrape tool to get the content of the relevantpage(s) that you want to scrape

**Usage Example without formats (Preferred):**
\`\`\`json
{
  "name": "firecrawl_search",
  "arguments": {
    "query": "top AI companies",
    "limit": 5,
    "sources": [
      "web"
    ]
  }
}
\`\`\`
**Usage Example with formats:**
\`\`\`json
{
  "name": "firecrawl_search",
  "arguments": {
    "query": "latest AI research papers 2023",
    "limit": 5,
    "lang": "en",
    "country": "us",
    "sources": [
      "web",
      "images",
      "news"
    ],
    "scrapeOptions": {
      "formats": ["markdown"],
      "onlyMainContent": true
    }
  }
}
\`\`\`
**Returns:** Array of search results (with optional scraped content).
`,
    inputSchema: z.object({
      query: z.string().min(1),
      limit: z.number().optional(),
      tbs: z.string().optional(),
      filter: z.string().optional(),
      location: z.string().optional(),
      sources: z
        .array(z.object({ type: z.enum(["web", "images", "news"]) }).strict())
        .optional(),
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
    execute: async (args) => {
      const client = await getClient();
      const result = await client.callTool({
        name: "firecrawl_search",
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

