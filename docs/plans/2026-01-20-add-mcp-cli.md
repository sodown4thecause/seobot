# Add mcp-cli and Configure MCP Servers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `mcp-cli` tool to the project and configure specific MCP servers in `mcp_servers.json`.

**Architecture:** Install `mcp-cli` as a development dependency (assuming it's a CLI tool for dev/ops). Create a configuration file `mcp_servers.json` in the project root to store MCP server definitions.

**Tech Stack:** Node.js, npm, mcp-cli

### Task 1: Install mcp-cli

**Files:**
- Modify: `package.json`

**Step 1: Install mcp-cli**
Run: `npm install mcp-cli`

**Step 2: Verify installation**
Run: `npm list mcp-cli`
Expected: `mcp-cli@1.0.5` (or similar version)

**Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: add mcp-cli dependency"
```

### Task 2: Create mcp_servers.json

**Files:**
- Create: `mcp_servers.json`

**Step 1: Create configuration file**
Create `mcp_servers.json` with the provided JSON content:

```json
{
  "mcpServers": {
    "dataforseo": {
      "command": "npx",
      "args": [
        "-y",
        "dataforseo-mcp-server"
      ],
      "env": {
        "DATAFORSEO_USERNAME": "liam@leadspeed.co",
        "DATAFORSEO_PASSWORD": "${TOKEN:text:dataforseo_password}",
        "DATAFORSEO_SIMPLE_FILTER": "true"
      },
      "disabled": false
    },
    "firecrawl": {
      "command": "npx",
      "args": [
        "-y",
        "firecrawl-mcp"
      ],
      "env": {
        "FIRECRAWL_API_KEY": "${TOKEN:text:firecrawl_api_key}"
      },
      "disabled": true
    },
    "mcp-server-neon": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.neon.tech/sse"
      ],
      "env": {},
      "disabled": true
    }
  }
}
```

**Step 2: Verify file creation**
Run: `cat mcp_servers.json`
Expected: The JSON content above.

**Step 3: Commit**
```bash
git add mcp_servers.json
git commit -m "config: add mcp_servers.json with server definitions"
```
