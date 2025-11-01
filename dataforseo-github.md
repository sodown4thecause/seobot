DataForSEO MCP Server
Model Context Protocol (MCP) server implementation for DataForSEO, enabling AI assistants to interact with selected DataForSEO APIs and obtain SEO data through a standardized interface.

Features
AI_OPTIMIZATION API: provides data for keyword discovery, conversational optimization, and real-time LLM benchmarking;
SERP API: real-time Search Engine Results Page (SERP) data for Google, Bing, and Yahoo;
KEYWORDS_DATA API: keyword research and clickstream data, including search volume, cost-per-click, and other metrics;
ONPAGE API: allows crawling websites and webpages according to customizable parameters to obtain on-page SEO performance metrics;
DATAFORSEO LABS API: data on keywords, SERPs, and domains based on DataForSEO's in-house databases and proprietary algorithms;
BACKLINKS API: comprehensive backlink analysis including referring domains, anchor text distribution, and link quality metrics;
BUSINESS DATA API: publicly available data on any business entity;
DOMAIN ANALYTICS API: data on website traffic, technologies, and Whois details;
CONTENT ANALYSIS API: robust source of data for brand monitoring, sentiment analysis, and citation management;
Prerequisites
Node.js (v14 or higher)
DataForSEO API credentials (API login and password)
Installation
Clone the repository:
git clone https://github.com/dataforseo/mcp-server-typescript
cd mcp-server-typescript
Install dependencies:
npm install
Set up environment variables:
# Required
export DATAFORSEO_USERNAME=your_username
export DATAFORSEO_PASSWORD=your_password

# Optional: specify which modules to enable (comma-separated)
# If not set, all modules will be enabled
export ENABLED_MODULES="SERP,KEYWORDS_DATA,ONPAGE,DATAFORSEO_LABS,BACKLINKS,BUSINESS_DATA,DOMAIN_ANALYTICS"

# Optional: specify which prompts in enabled modules are enable too (prompts names, comma-separated)
# If not set, all prompts from enabled modules will be enabled
export ENABLED_PROMPTS="top_3_google_result_domains,top_5_serp_paid_and_organic"

# Optional: enable full API responses
# If not set or set to false, the server will filter and transform API responses to a more concise format
# If set to true, the server will return the full, unmodified API responses
export DATAFORSEO_FULL_RESPONSE="false"

# Optional: enable simple filter schema
# If set to true, a simplified version of the filters schema will be used.
# This is required for ChatGPT APIs or other LLMs that cannot handle nested structures.
export DATAFORSEO_SIMPLE_FILTER="false"
Installation as an NPM Package
You can install the package globally:

npm install -g dataforseo-mcp-server
Or run it directly without installation:

npx dataforseo-mcp-server
Remember to set environment variables before running the command:

# Required environment variables
export DATAFORSEO_USERNAME=your_username
export DATAFORSEO_PASSWORD=your_password

# Run with npx
npx dataforseo-mcp-server
Building and Running
Build the project:

npm run build
Run the server:

# Start local server (direct MCP communication)
npx dataforseo-mcp-server

# Start HTTP server
npx dataforseo-mcp-server http
HTTP Server Configuration
The server runs on port 3000 by default and supports both Basic Authentication and environment variable-based authentication.

To start the HTTP server, run:

npm run http
Authentication Methods
Basic Authentication

Send requests with Basic Auth header:
Authorization: Basic <base64-encoded-credentials>
Credentials format: username:password
Environment Variables

If no Basic Auth is provided, the server will use credentials from environment variables:
export DATAFORSEO_USERNAME=your_username
export DATAFORSEO_PASSWORD=your_password
# Optional
export DATAFORSEO_SIMPLE_FILTER="false"
export DATAFORSEO_FULL_RESPONSE="true"