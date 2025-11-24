import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: dataforseo_labs_search_intent
// Source: https://mcp.dataforseo.com/http
export const dataforseo_labs_search_intentToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `This endpoint will provide you with search intent data for up to 1,000 keywords. For each keyword that you specify when setting a task, the API will return the keyword's search intent and intent probability. Besides the highest probable search intent, the results will also provide you with other likely search intent(s) and their probability.
Based on keyword data and search results data, our system has been trained to detect four types of search intent: informational, navigational, commercial, transactional.`,
    inputSchema: z.object({
      keywords: z.array(z.string()).describe(`target keywords
required field
UTF-8 encoding
maximum number of keywords you can specify in this array: 1000`),
      language_code: z
        .string()
        .describe(
          `language code
        required field
        Note: this endpoint currently supports the following languages only:
ar,
zh-TW,
cs,
da,
nl,
en,
fi,
fr,
de,
he,
hi,
it,
ja,
ko,
ms,
nb,
pl,
pt,
ro,
ru,
es,
sv,
th,
uk,
vi,
bg,
hr,
sr,
sl,
bs`,
        )
        .default("en"),
    }),
    execute: async (args) => {
      const client = await getClient();
      const result = await client.callTool({
        name: "dataforseo_labs_search_intent",
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

