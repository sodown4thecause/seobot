# Production Deployment Guide - MCP Server

## Overview

**Important**: The MCP server **cannot** run on Vercel because Vercel serverless functions are stateless and ephemeral. The MCP server needs to be deployed as a **separate service**.

## Deployment Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Vercel (Next.js) │───────▶│  MCP Server      │
│   Serverless      │ HTTP   │  (Separate Host) │
│   Functions       │         │  (Railway/Render)│
└─────────────────┘         └──────────────────┘
```

## Step 1: Deploy MCP Server Separately

Choose one of these hosting options:

### Option A: Railway (Recommended - Easiest)

1. **Create Railway account**: https://railway.app
2. **Create new project** → "Deploy from GitHub" or "Empty Project"
3. **Add Dockerfile** (must be named exactly `Dockerfile` - no extension):

The `Dockerfile` is already in your repo root. If you're deploying from a separate repo, create a new repo with just the Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install MCP server globally
RUN npm install -g dataforseo-mcp-server

# Set environment variables (override via Railway dashboard)
ENV DATAFORSEO_USERNAME=""
ENV DATAFORSEO_PASSWORD=""
ENV DATAFORSEO_SIMPLE_FILTER="true"
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check with proper error handling and timeout
# Handles: connection errors, timeouts, DNS failures, and non-200 status codes
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');const req=http.get('http://localhost:3000/mcp',{timeout:2000},(r)=>{req.destroy();process.exit(r.statusCode===200?0:1)});req.on('error',()=>{req.destroy();process.exit(1)});req.on('timeout',()=>{req.destroy();process.exit(1)});"

# Start HTTP server
CMD ["dataforseo-mcp-server", "http"]
```

**Important**: The file must be named exactly `Dockerfile` (no extension like `.mcp-server` or `.txt`)

4. **Set environment variables in Railway dashboard**:
   - `DATAFORSEO_USERNAME` = your username
   - `DATAFORSEO_PASSWORD` = your password
   - `DATAFORSEO_SIMPLE_FILTER` = `true`
   - `PORT` = `3000`

5. **Deploy** - Railway will provide a URL like: `https://your-app.railway.app`

6. **Get the MCP endpoint**: `https://your-app.railway.app/mcp`

### Option B: Render

1. **Create Render account**: https://render.com
2. **New** → **Web Service**
3. **Connect your repo** (or create a simple repo with Dockerfile)
4. **Use the Dockerfile above**
5. **Set environment variables** in Render dashboard
6. **Deploy** - Render provides: `https://your-app.onrender.com/mcp`

### Option C: Fly.io

1. **Install Fly CLI**: `npm install -g @fly/cli`
2. **Create Dockerfile** (same as above)
3. **Deploy**:
   ```bash
   fly launch
   fly secrets set DATAFORSEO_USERNAME=your_username
   fly secrets set DATAFORSEO_PASSWORD=your_password
   fly secrets set DATAFORSEO_SIMPLE_FILTER=true
   ```
4. **Get URL**: `https://your-app.fly.dev/mcp`

### Option D: DigitalOcean App Platform

1. **Create account**: https://www.digitalocean.com
2. **Apps** → **Create App** → **Container**
3. **Upload Dockerfile** or connect GitHub repo
4. **Set environment variables**
5. **Deploy** - URL: `https://your-app.ondigitalocean.app/mcp`

## Step 2: Configure Vercel Environment Variables

Once your MCP server is deployed, configure your Vercel project:

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. **Add these variables**:

```env
# Existing variables (keep these)
DATAFORSEO_LOGIN=your_username
DATAFORSEO_PASSWORD=your_password

# NEW: Add your deployed MCP server URL
DATAFORSEO_MCP_URL=https://your-app.railway.app/mcp
```

3. **Apply to all environments** (Production, Preview, Development)

4. **Redeploy** your Vercel app for changes to take effect

## Step 3: Verify Connection

After deployment:

1. **Check Vercel function logs** for:
   ```
   [MCP] Connecting to DataForSEO MCP server at: https://your-app.railway.app/mcp
   [MCP] Connected to DataForSEO MCP server
   [MCP] Loaded X tools from DataForSEO MCP server
   ```

2. **Test a chat request** - should use MCP tools

3. **If connection fails**, check:
   - MCP server is running (check Railway/Render logs)
   - URL is correct (should end with `/mcp`)
   - Environment variables are set correctly
   - No firewall/network issues

## Fallback Behavior

If the MCP server is unavailable in production, your Next.js app will automatically fall back to using 4 direct API tools:
- `ai_keyword_search_volume`
- `keyword_search_volume`
- `google_rankings`
- `domain_overview`

This ensures your app continues working even if the MCP server is down.

## Cost Considerations

### MCP Server Hosting Costs:

- **Railway**: ~$5-10/month (free tier available)
- **Render**: Free tier available (sleeps after inactivity)
- **Fly.io**: ~$3-5/month
- **DigitalOcean**: ~$5-12/month

### Recommendation:

For production, **Railway** is recommended because:
- ✅ Easy setup
- ✅ No sleep mode (always on)
- ✅ Generous free tier
- ✅ Automatic HTTPS
- ✅ Good performance

## Security Best Practices

1. **Use HTTPS** for MCP server (Railway/Render provide this automatically)
2. **Don't commit** `DATAFORSEO_MCP_URL` to git (use environment variables)
3. **Restrict MCP server access** if possible (though Basic Auth is already required)
4. **Monitor** server logs for unusual activity

## Monitoring

Set up monitoring for your MCP server:

1. **Uptime monitoring**: Use UptimeRobot or similar to ping your MCP server
2. **Log monitoring**: Check Railway/Render logs regularly
3. **Error alerts**: Set up alerts for server downtime

## Troubleshooting Production Issues

### MCP Server Not Responding

1. Check server logs in Railway/Render dashboard
2. Verify environment variables are set correctly
3. Check if server restarted (might need to wait a moment)
4. Test MCP endpoint directly: `curl https://your-app.railway.app/mcp`

### Connection Timeouts

1. Increase timeout in MCP client (if needed)
2. Check Vercel function timeout settings
3. Verify network connectivity between Vercel and MCP server

### Tools Not Loading

1. Verify `DATAFORSEO_SIMPLE_FILTER=true` is set on MCP server
2. Check MCP server logs for errors
3. Verify DataForSEO API credentials are valid
4. Check if API quota is exceeded

## Quick Start Checklist

- [ ] Deploy MCP server to Railway/Render/Fly.io
- [ ] Set `DATAFORSEO_SIMPLE_FILTER=true` on MCP server
- [ ] Get MCP server URL (should end with `/mcp`)
- [ ] Add `DATAFORSEO_MCP_URL` to Vercel environment variables
- [ ] Redeploy Vercel app
- [ ] Test connection via chat request
- [ ] Verify logs show MCP connection success
- [ ] Set up monitoring/uptime checks

## Support

If you encounter issues:
1. Check MCP server logs
2. Check Vercel function logs
3. Verify environment variables
4. Test MCP endpoint directly
5. Check DataForSEO API status

