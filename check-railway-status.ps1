# Quick Troubleshooting Commands

Write-Host "Checking Railway deployment status..." -ForegroundColor Cyan

# Check logs
railway logs --tail 50

# Check status
railway status

# Check environment variables
railway variables

Write-Host ""
Write-Host "If the server is still starting, wait a minute and try again." -ForegroundColor Yellow
Write-Host "Common issues:" -ForegroundColor Yellow
Write-Host "1. Environment variables not set correctly" -ForegroundColor White
Write-Host "2. Server still starting up (wait 30-60 seconds)" -ForegroundColor White
Write-Host "3. Port configuration issue" -ForegroundColor White
Write-Host ""
Write-Host "To check logs manually:" -ForegroundColor Cyan
Write-Host "railway logs" -ForegroundColor White

