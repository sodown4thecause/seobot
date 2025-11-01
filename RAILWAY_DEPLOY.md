# Railway CLI Deployment Guide for MCP Server

## Quick Deploy via Railway CLI

### Option 1: Deploy from Current Directory (Recommended)

1. **Login to Railway** (if not already logged in):
   ```powershell
   railway login
   ```
   This will open your browser to authenticate.

2. **Initialize Railway project**:
   ```powershell
   railway init
   ```
   - Choose "Create new project" or "Link to existing project"
   - Name it: `dataforseo-mcp-server`

3. **Set environment variables**:
   ```powershell
   railway variables set DATAFORSEO_USERNAME=your_username
   railway variables set DATAFORSEO_PASSWORD=your_password
   railway variables set DATAFORSEO_SIMPLE_FILTER=true
   railway variables set PORT=3000
   ```

4. **Deploy**:
   ```powershell
   railway up
   ```

5. **Get your MCP URL**:
   ```powershell
   railway domain
   ```
   Your MCP endpoint will be: `https://your-app.railway.app/mcp`

### Option 2: Deploy from Separate Directory (Cleaner)

If Railway still doesn't recognize the Dockerfile in your main repo, create a separate directory:

1. **Create deployment directory**:
   ```powershell
   mkdir dataforseo-mcp-deploy
   cd dataforseo-mcp-deploy
   ```

2. **Copy Dockerfile**:
   ```powershell
   Copy-Item ..\Dockerfile .
   ```

3. **Initialize Railway**:
   ```powershell
   railway init
   ```

4. **Set environment variables** (same as Option 1)

5. **Deploy**:
   ```powershell
   railway up
   ```

## Troubleshooting

### If Railway CLI doesn't detect Dockerfile:

1. **Check Dockerfile location**:
   ```powershell
   Get-Content Dockerfile | Select-Object -First 3
   ```

2. **Ensure Dockerfile has no BOM or encoding issues**:
   ```powershell
   # Verify it's UTF-8 without BOM
   [System.IO.File]::ReadAllText("$PWD\Dockerfile", [System.Text.Encoding]::UTF8)
   ```

3. **Explicitly specify Dockerfile**:
   Create `railway.json`:
   ```json
   {
     "build": {
       "builder": "DOCKERFILE",
       "dockerfilePath": "Dockerfile"
     }
   }
   ```

### If deployment fails:

1. **Check logs**:
   ```powershell
   railway logs
   ```

2. **Verify environment variables**:
   ```powershell
   railway variables
   ```

3. **Test Dockerfile locally** (optional):
   ```powershell
   docker build -t mcp-test .
   docker run -p 3000:3000 -e DATAFORSEO_USERNAME=your_user -e DATAFORSEO_PASSWORD=your_pass mcp-test
   ```

## After Deployment

Once deployed, get your MCP URL and add it to Vercel:

1. **Get Railway URL**:
   ```powershell
   railway domain
   ```

2. **Add to Vercel**:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add: `DATAFORSEO_MCP_URL=https://your-app.railway.app/mcp`
   - Redeploy your Vercel app

## Commands Reference

```powershell
# Login
railway login

# Create/Link project
railway init

# Set environment variables
railway variables set KEY=value

# View environment variables
railway variables

# Deploy
railway up

# View logs
railway logs

# Get domain
railway domain

# Open dashboard
railway open
```

