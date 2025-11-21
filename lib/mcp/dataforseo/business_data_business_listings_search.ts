import { tool } from "ai";
import { type Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

// Auto-generated wrapper for MCP tool: business_data_business_listings_search
// Source: https://mcp.dataforseo.com/http
export const business_data_business_listings_searchToolWithClient = (
  getClient: () => Promise<Client> | Client,
) =>
  tool({
    description: `Business Listings Search API provides results containing information about business entities listed on Google Maps in the specified categories. You will receive the address, contacts, rating, working hours, and other relevant data`,
    parameters: z.object({
      description: z
        .string()
        .describe(
          `description of the element in SERP
optional field
the description of the business entity for which the results are collected;
can contain up to 200 characters`,
        )
        .optional(),
      title: z
        .string()
        .describe(
          `title of the element in SERP
optional field
the name of the business entity for which the results are collected;
can contain up to 200 characters`,
        )
        .optional(),
      categories: z
        .array(z.string())
        .describe(
          `business categories
the categories you specify are used to search for business listings;
if you don’t use this field, we will return business listings found in the specified location;
you can specify up to 10 categories`,
        )
        .optional(),
      location_coordinate: z
        .string()
        .describe(
          `GPS coordinates of a location
optional field
location_coordinate parameter should be specified in the “latitude,longitude,radius” format
the maximum number of decimal digits for “latitude” and “longitude”: 7
the value of “radius” is specified in kilometres (km)
the minimum value for “radius”: 1
the maximum value for “radius”: 100000
example:
53.476225,-2.243572,200`,
        )
        .optional(),
      limit: z
        .number()
        .gte(1)
        .lte(1000)
        .describe("the maximum number of returned businesses")
        .default(10),
      offset: z
        .number()
        .gte(0)
        .describe(
          `offset in the results array of returned businesses
optional field
default value: 0
if you specify the 10 value, the first ten entities in the results array will be omitted and the data will be provided for the successive entities`,
        )
        .optional(),
      filters: z
        .array(
          z.union([
            z
              .array(z.union([z.string(), z.number(), z.boolean()]))
              .min(3)
              .max(3),
            z.enum(["and", "or"]),
            
            z.union([z.string(), z.number()]),
          ]),
        )
        .max(3)
        .describe(
          `array of results filtering parameters
optional field
you can add several filters at once (8 filters maximum)
you should set a logical operator and, or between the conditions
the following operators are supported:
regex, not_regex, <, <=, >, >=, =, <>, in, not_in, like, not_like, match, not_match
you can use the % operator with like and not_like to match any string of zero or more characters
example:
["rating.value",">",3]`,
        )
        .optional(),
      order_by: z
        .array(z.string())
        .describe(
          `results sorting rules
optional field
you can use the same values as in the filters array to sort the results
possible sorting types:
asc – results will be sorted in the ascending order
desc – results will be sorted in the descending order
you should use a comma to set up a sorting parameter
example:
["rating.value,desc"]note that you can set no more than three sorting rules in a single request
you should use a comma to separate several sorting rules
example:
["rating.value,desc","rating.votes_count,desc"]`,
        )
        .optional(),
      is_claimed: z
        .boolean()
        .describe(
          "indicates whether the business is verified by its owner on Google Maps",
        )
        .default(true),
    }),
    execute: async (args): Promise<string> => {
      const client = await getClient();
      const result = await client.callTool({
        name: "business_data_business_listings_search",
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

