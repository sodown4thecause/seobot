# Fix Cursor MCP Configuration

## Current Problem

Your Cursor MCP configuration is still trying to use the deleted wrapper file:
```
Error: Cannot find module 'C:\Users\User\Documents\seo ragbot\seo-platform\scripts\task-master-mcp-wrapper.js'
```

## Solution: Update to Use Older Version Directly

Remove the wrapper reference and use the older version of task-master-ai directly.

### Step 1: Open Your Cursor MCP Configuration

**Location:** `%USERPROFILE%\.cursor\mcp.json` (Windows)

Or if you have a project-specific config: `<project_folder>\.cursor\mcp.json`

### Step 2: Replace the Configuration

**Remove this (old wrapper config):**
```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "node",
      "args": ["C:\\Users\\User\\Documents\\seo ragbot\\seo-platform\\scripts\\task-master-mcp-wrapper.js"],
      "env": {
        "PERPLEXITY_API_KEY": "your_key_here"
      }
    }
  }
}
```

**Replace with this (older version):**
```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai@0.30.2", "task-master-ai"],
      "env": {
        "PERPLEXITY_API_KEY": "your_key_here"
      }
    }
  }
}
```

### Step 3: Save and Restart

1. Save the `mcp.json` file
2. **Completely restart Cursor** (close all windows and reopen)
3. The MCP server should now start successfully

## Alternative Versions

If `0.30.2` doesn't work, try:
- `0.30.0`
- `0.29.0`
- `0.28.0`

Just change the version in `--package=task-master-ai@VERSION`

