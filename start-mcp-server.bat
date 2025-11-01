@echo off
REM DataForSEO MCP Server Startup Script
REM Set your credentials here or use environment variables

set DATAFORSEO_USERNAME=your_username
set DATAFORSEO_PASSWORD=your_password
set DATAFORSEO_SIMPLE_FILTER=true

echo Starting DataForSEO MCP Server with simplified filter...
npx dataforseo-mcp-server http

