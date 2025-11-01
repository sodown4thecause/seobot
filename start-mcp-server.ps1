# DataForSEO MCP Server Startup Script (PowerShell)
# Set your credentials here or use environment variables

$env:DATAFORSEO_USERNAME = "liam@leadspeed.co"
$env:DATAFORSEO_PASSWORD = "f63f04a30d4b5272"
$env:DATAFORSEO_SIMPLE_FILTER = "true"

Write-Host "Starting DataForSEO MCP Server with simplified filter..." -ForegroundColor Green
Write-Host "MCP Server URL: http://localhost:3000/mcp" -ForegroundColor Cyan
Write-Host ""

# Use npm exec which is more reliable than npx on Windows
npm exec -- dataforseo-mcp-server http
