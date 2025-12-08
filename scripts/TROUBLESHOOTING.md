# Task Master MCP Troubleshooting

## Current Status

The server is starting but not completing initialization. The logs show:
- Server starts: `Starting new stdio process with command: npx -y --package=task-master-ai@0.30.2 task-master-ai`
- Client closes after ~48 seconds
- "No server info found" errors

## Possible Issues

1. **Version compatibility**: Even older versions might have initialization issues
2. **Timeout**: Server might be taking too long to initialize
3. **Missing dependencies**: The package might need additional setup

## Solutions to Try

### Option 1: Try Even Older Versions

Updated config to use `0.28.0`. If that doesn't work, try:
- `0.27.0` (if available)
- `0.26.0` (if available)
- `0.25.0` (if available)

### Option 2: Check Cursor MCP Logs

1. Open Cursor Settings (Ctrl+,)
2. Go to MCP section
3. Click on `task-master-ai` to see detailed logs
4. Look for any error messages during initialization

### Option 3: Test Manually

Try running task-master-ai directly to see if it works:

```bash
npx -y --package=task-master-ai@0.28.0 task-master-ai
```

If it starts and waits for input, it's working. Press Ctrl+C to exit.

### Option 4: Use CLI Instead of MCP

If MCP continues to have issues, you can use task-master via CLI:

```bash
npm install -g task-master-ai@0.28.0
task-master init
```

Then use it via command line instead of MCP.

### Option 5: Wait for Official Fix

The maintainers are aware of the completions capability issue. Monitor:
- GitHub: https://github.com/eyaltoledano/claude-task-master/issues/1413
- GitHub: https://github.com/eyaltoledano/claude-task-master/issues/1405

## Current Configuration

Your config is now set to use version `0.28.0`. After updating, restart Cursor completely and check if it works.

