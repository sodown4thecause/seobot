# DataForSEO MCP Server Setup Guide

This guide explains how to set up and configure the DataForSEO MCP server to access 40+ SEO tools with simplified filter schemas optimized for LLM usage.

## Overview

The DataForSEO MCP server provides a standardized interface to access 40+ SEO tools including:
- AI Optimization (ChatGPT, Claude, Perplexity analysis)
- Keyword Research (search volume, suggestions, difficulty)
- SERP Analysis (Google rankings, SERP features)
- Competitor Analysis (domain overlap, competitor discovery)
- Domain Analysis (traffic, keywords, rankings, technologies)
- On-Page Analysis (content parsing, Lighthouse audits)
- Content Generation (optimized content creation)

## Prerequisites

- Node.js (v14 or higher)
- DataForSEO API credentials (API login and password)

## Installation

### Option 1: Global Installation

```bash
npm install -g dataforseo-mcp-server
```

### Option 2: Run Directly (No Installation)

```bash
npx dataforseo-mcp-server
```

## Configuration

### Required Environment Variables

The MCP server requires these environment variables to be set:

```bash
# Required: DataForSEO API credentials
export DATAFORSEO_USERNAME=your_username
export DATAFORSEO_PASSWORD=your_password

# Optional: Enable simplified filter schema (RECOMMENDED for LLMs)
export DATAFORSEO_SIMPLE_FILTER="true"

# Optional: Specify which modules to enable (comma-separated)
# If not set, all modules will be enabled
export ENABLED_MODULES="SERP,KEYWORDS_DATA,ONPAGE,DATAFORSEO_LABS,BACKLINKS,BUSINESS_DATA,DOMAIN_ANALYTICS"

# Optional: Specify which prompts in enabled modules are enabled (comma-separated)
# If not set, all prompts from enabled modules will be enabled
export ENABLED_PROMPTS="top_3_google_result_domains,top_5_serp_paid_and_organic"

# Optional: Enable full API responses
# If set to true, the server will return the full, unmodified API responses
# If set to false (default), the server will filter and transform API responses to a more concise format
export DATAFORSEO_FULL_RESPONSE="false"
```

### Simplified Filter Schema (Important)

**Set `DATAFORSEO_SIMPLE_FILTER="true"`** to enable simplified filter schemas that work better with LLMs like Gemini. This is required for ChatGPT APIs or other LLMs that cannot handle nested structures efficiently.

When enabled:
- Filter schemas are simplified and flattened
- Better compatibility with LLM function calling
- Easier for models to understand and use tool parameters

## Running the MCP Server

### Option 1: HTTP Server (Recommended for Next.js Integration)

Start the HTTP server on port 3000:

```bash
# With environment variables set
npx dataforseo-mcp-server http

# Or if installed globally
dataforseo-mcp-server http
```

The server will run on `http://localhost:3000/mcp` by default.

### Option 2: Direct MCP Communication

For local development with direct MCP communication:

```bash
npx dataforseo-mcp-server
```

## Next.js Application Configuration

### 1. Environment Variables

Add the MCP server URL to your `.env.local` file:

```env
# DataForSEO MCP Server URL (optional, defaults to http://localhost:3000/mcp)
DATAFORSEO_MCP_URL=http://localhost:3000/mcp

# DataForSEO API credentials (already configured)
DATAFORSEO_LOGIN=your_username
DATAFORSEO_PASSWORD=your_password
```

### 2. Authentication

The MCP client will automatically use Basic Authentication with your `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` credentials.

## Running the Server in Production

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'dataforseo-mcp',
    script: 'npx',
    args: 'dataforseo-mcp-server http',
    env: {
      DATAFORSEO_USERNAME: 'your_username',
      DATAFORSEO_PASSWORD: 'your_password',
      DATAFORSEO_SIMPLE_FILTER: 'true',
      PORT: 3000
    }
  }]
}
EOF

# Start the server
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### Using Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install MCP server globally
RUN npm install -g dataforseo-mcp-server

# Set environment variables
ENV DATAFORSEO_USERNAME=your_username
ENV DATAFORSEO_PASSWORD=your_password
ENV DATAFORSEO_SIMPLE_FILTER=true
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start HTTP server
CMD ["dataforseo-mcp-server", "http"]
```

Build and run:

```bash
docker build -t dataforseo-mcp .
docker run -p 3000:3000 \
  -e DATAFORSEO_USERNAME=your_username \
  -e DATAFORSEO_PASSWORD=your_password \
  -e DATAFORSEO_SIMPLE_FILTER=true \
  dataforseo-mcp
```

## Verification

### Check if Server is Running

```bash
curl http://localhost:3000/mcp
```

### Test from Next.js Application

The Next.js application will automatically attempt to connect to the MCP server when handling chat requests. Check the console logs for:

```
[MCP] Connecting to DataForSEO MCP server at: http://localhost:3000/mcp
[MCP] Connected to DataForSEO MCP server
[MCP] Loaded X tools from DataForSEO MCP server
```

If the MCP server is unavailable, the application will automatically fall back to direct API tools (4 tools).

## Troubleshooting

### Server Not Starting

1. Check that Node.js version is v14 or higher: `node --version`
2. Verify environment variables are set correctly
3. Check if port 3000 is already in use: `lsof -i :3000`

### Connection Errors

1. Verify the MCP server URL is correct in `.env.local`
2. Check that the MCP server is running: `curl http://localhost:3000/mcp`
3. Verify authentication credentials are correct
4. Check network connectivity between Next.js app and MCP server

### Tools Not Loading

1. Ensure `DATAFORSEO_SIMPLE_FILTER="true"` is set on the MCP server
2. Check MCP server logs for errors
3. Verify DataForSEO API credentials are valid
4. Check that enabled modules include the tools you need

## Fallback Behavior

If the MCP server is unavailable, the Next.js application will automatically fall back to using 4 direct API tools:
- `ai_keyword_search_volume`
- `keyword_search_volume`
- `google_rankings`
- `domain_overview`

This ensures the application continues to work even if the MCP server is down.

## Production Deployment

For production deployment on Vercel, you'll need to deploy the MCP server separately since Vercel serverless functions can't run long-running processes.

See **[MCP_PRODUCTION_DEPLOYMENT.md](./MCP_PRODUCTION_DEPLOYMENT.md)** for complete production deployment instructions.

Quick summary:
1. Deploy MCP server to Railway/Render/Fly.io using the `Dockerfile` (must be named exactly `Dockerfile`)
2. Set environment variables in Railway dashboard:
   - `DATAFORSEO_USERNAME` = your username
   - `DATAFORSEO_PASSWORD` = your password
   - `DATAFORSEO_SIMPLE_FILTER` = `true`
3. Set `DATAFORSEO_MCP_URL` in Vercel environment variables to your deployed MCP server URL
4. Redeploy your Vercel app

## Additional Resources

- [DataForSEO MCP Server GitHub](https://github.com/dataforseo/mcp-server-typescript)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [DataForSEO API Documentation](https://docs.dataforseo.com/)

