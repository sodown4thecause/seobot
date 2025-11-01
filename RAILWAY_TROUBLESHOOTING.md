# Railway Deployment - Troubleshooting Guide

## Current Status

Your MCP server is deployed at:
**URL**: `https://your-app.railway.app`  
**MCP Endpoint**: `https://your-app.railway.app/mcp`

## 502 Error Troubleshooting

If you're seeing a 502 error, try these steps:

### 1. Check Railway Logs

```powershell
railway logs --tail 50
```

Look for:
- ✅ Server starting successfully
- ❌ Environment variable errors
- ❌ Port binding errors
- ❌ Application crashes

### 2. Verify Environment Variables

```powershell
railway variables
```

Ensure these are set:
- `DATAFORSEO_USERNAME` = `your_username`
- `DATAFORSEO_PASSWORD` = `your_password`
- `DATAFORSEO_SIMPLE_FILTER` = `true`
- `PORT` = Railway will set this automatically (usually 3000 or dynamic)

### 3. Set Environment Variables (if missing)

```powershell
railway variables set DATAFORSEO_USERNAME=your_username
railway variables set DATAFORSEO_PASSWORD=your_password
railway variables set DATAFORSEO_SIMPLE_FILTER=true
```

### 4. Redeploy

After setting variables, redeploy:

```powershell
railway up
```

### 5. Check Railway Dashboard

1. Go to https://railway.app
2. Open your project
3. Check the "Deployments" tab
4. View logs in real-time

### 6. Wait for Startup

The server might need 30-60 seconds to start. Check logs to see when it's ready:
```
Starting DataForSEO MCP Server...
MCP Stateless Streamable HTTP Server listening on port 3000
```

## Common Issues

### Issue: Server not starting
**Solution**: Check logs for errors, verify environment variables are set

### Issue: Port mismatch
**Solution**: Railway assigns PORT automatically. The MCP server should use `process.env.PORT` (updated Dockerfile handles this)

### Issue: Environment variables not set
**Solution**: Set them via Railway dashboard or CLI

## Once Server is Running

1. **Test the endpoint**:
   ```powershell
   Invoke-WebRequest -Uri "https://your-app.railway.app/mcp" -Headers @{'Authorization'='Basic ' + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes('your_username:your_password'))}
   ```

2. **Configure Vercel**:
   - Add `DATAFORSEO_MCP_URL=https://your-app.railway.app/mcp`
   - Redeploy Vercel app

3. **Verify connection**:
   - Check Vercel function logs for MCP connection success

