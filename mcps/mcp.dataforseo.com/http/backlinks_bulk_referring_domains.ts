import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: backlinks_bulk_referring_domains
// Source: https://mcp.dataforseo.com/http
export const backlinks_bulk_referring_domainsToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `This endpoint will provide you with the number of referring domains pointing to domains, subdomains, and pages specified in the targets array. The returned numbers are based on all live referring domains, that is, total number of domains pointing to the target with any type of backlinks (e.g., nofollow, noreferrer, ugc, sponsored etc) that were found during the latest check.
Note that if you indicate a domain as a target, you will get result for the root domain (domain with all of its subdomains), e.g. dataforseo.com and app.dataforseo.com`,
    inputSchema: z.object({
      targets: z.array(z.string())
        .describe(`domains, subdomains or webpages to get rank for
required field
you can set up to 1000 domains, subdomains or webpages
the domain or subdomain should be specified without https:// and www.
the page should be specified with absolute URL (including http:// or https://)
example:
"targets": [
"forbes.com",
"cnn.com",
"bbc.com",
"yelp.com",
"https://www.apple.com/iphone/",
"https://ahrefs.com/blog/",
"ibm.com",
"https://variety.com/",
"https://stackoverflow.com/",
"www.trustpilot.com"
]`),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "backlinks_bulk_referring_domains",
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
