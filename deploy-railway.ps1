# Railway Deployment Script for MCP Server

Write-Host "Deploying DataForSEO MCP Server to Railway..." -ForegroundColor Green
Write-Host ""

# Check if logged in
Write-Host "Checking Railway login status..." -ForegroundColor Cyan
railway whoami 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in. Please run: railway login" -ForegroundColor Yellow
    exit 1
}

Write-Host "Setting environment variables..." -ForegroundColor Cyan
railway variables set DATAFORSEO_USERNAME=your_username
railway variables set DATAFORSEO_PASSWORD=your_password
railway variables set DATAFORSEO_SIMPLE_FILTER=true
railway variables set PORT=3000

Write-Host ""
Write-Host "Deploying to Railway..." -ForegroundColor Green
railway up

Write-Host ""
Write-Host "Deployment complete! Getting your MCP URL..." -ForegroundColor Green
railway domain

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy the MCP URL above (should end with /mcp)" -ForegroundColor White
Write-Host "2. Add it to Vercel as DATAFORSEO_MCP_URL" -ForegroundColor White
Write-Host "3. Redeploy your Vercel app" -ForegroundColor White

