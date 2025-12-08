# Task Master MCP - Using Older Version

## Problem

The latest versions of `task-master-ai` (0.31.2+) have a completions capability check that causes Cursor to fail. Older versions don't have this check.

## Solution: Pin an Older Version

Update your Cursor MCP configuration to use version **0.30.2** (or earlier):

### Updated Configuration

**Location:** `%USERPROFILE%\.cursor\mcp.json` (Windows) or `~/.cursor/mcp.json` (Linux/macOS)

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

## Alternative Versions to Try

If `0.30.2` doesn't work, try these versions in order:

1. **0.30.2** (latest 0.30.x)
2. **0.30.0** (stable 0.30 release)
3. **0.29.0** (stable 0.29 release)
4. **0.28.0** (stable 0.28 release)

### Example for version 0.29.0:

```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai@0.29.0", "task-master-ai"],
      "env": {
        "PERPLEXITY_API_KEY": "your_key_here"
      }
    }
  }
}
```

## Steps

1. Open your Cursor MCP configuration file
2. Update the `args` to include `--package=task-master-ai@0.30.2`
3. Save the file
4. Restart Cursor completely
5. Test the MCP server

## Verify It's Working

After restarting Cursor:
1. Go to Cursor Settings (Ctrl+,)
2. Navigate to the MCP section
3. Check if `task-master-ai` shows as connected/active
4. You should NOT see the "Server does not support completions" error

## Notes

- The `--package` flag tells npx to use a specific version
- Older versions may have fewer features but should work with Cursor
- Once the official fix is released, you can remove the version pin

