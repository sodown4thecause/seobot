# Recovery Instructions - AI SDK 6 Beta Upgrade

## What Happened
A coding agent deleted uncommitted work that was using AI SDK 6 beta and static MCP tools. The codebase was reverted to a week ago state (AI SDK 5.0.90).

## What's Been Fixed
1. ✅ Upgraded to AI SDK 6 beta in `package.json`
2. ✅ Disabled codemode tool (security risk - executes arbitrary JavaScript)
3. ✅ Removed codemode references from system prompt

## What You Need To Do

### Step 1: Stop Your Dev Server
Press `Ctrl+C` in the terminal running `npm run dev`

### Step 2: Install AI SDK 6 Beta
```bash
npm install
```

This will install:
- `ai@^6.0.0-beta.8`
- All updated peer dependencies

### Step 3: Convert MCP Tools to Static Tools
Follow the Vercel guide: https://vercel.com/blog/generate-static-ai-sdk-tools-from-mcp-servers-with-mcp-to-ai-sdk

For your DataForSEO MCP server:
```bash
npx mcp-to-ai-sdk <your-dataforseo-mcp-url>
```

This will generate static tool files that you can import directly.

### Step 4: Update Chat Route
Replace the dynamic MCP client with static imports:

**Before:**
```typescript
const seoTools = await getDataForSEOTools(); // Dynamic MCP
```

**After:**
```typescript
import { mcpDataForSEOTools } from "./mcps/dataforseo"; // Static tools
const seoTools = mcpDataForSEOTools;
```

### Step 5: Restart Dev Server
```bash
npm run dev
```

## Why Static Tools?
From the Vercel blog post:

**Security Benefits:**
- Tool definitions are in your repo and only change through code review
- Prevents prompt injection through tool descriptions
- Prevents unexpected capability introduction

**Performance Benefits:**
- Selective loading - only include tools you need
- Reduces token count significantly
- Improves tool-call accuracy with customized descriptions

**Reliability Benefits:**
- No schema drift from upstream changes
- Version controlled tool definitions
- Stable agent behavior

## Environment Variables Required
Make sure these are set in `.env.local`:
- `WINSTON_AI_API_KEY` (not `WINSTON_API_KEY`)
- `RYTR_API_KEY`
- `DATAFORSEO_MCP_URL` (can be removed after static conversion)

## Verification
After completing these steps:
1. Chat should load without schema errors
2. All 70+ tools should work correctly
3. Winston AI and Rytr should be functional
4. No codemode tool should appear in logs










