# MCP CLI & DataForSEO Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Install `mcp-cli` and configure the DataForSEO MCP integration to verify it works.

**Architecture:**
We will use the `@wong2/mcp-cli` tool (a common CLI inspector for MCP) to interact with the DataForSEO MCP server. The DataForSEO integration likely requires an API key and configuration to run as an MCP server that the CLI can connect to.

**Tech Stack:** `npm`, `mcp-cli` (likely `@wong2/mcp-cli`), DataForSEO API.

### Task 1: Install `mcp-cli`

**Files:**
- None (global or dev dependency installation)

**Step 1: Check if `mcp-cli` is already installed**
Run: `npm list -g @wong2/mcp-cli`
Expected: Empty or version number.

**Step 2: Install `@wong2/mcp-cli` globally (or use npx)**
Run: `npm install -g @wong2/mcp-cli`
*Note: Using global install as it's a tool, but will verify if `npx` is preferred.*

**Step 3: Verify installation**
Run: `mcp-cli --version` or `npx @wong2/mcp-cli --version`
Expected: Version output.

### Task 2: Configure DataForSEO MCP

**Files:**
- Read: `mcps/mcp.dataforseo.com/README.md` (if exists) or inspect `mcps/mcp.dataforseo.com/` to find the server entry point.
- Create/Modify: `config.json` (if `mcp-cli` uses one) or environment variables.

**Step 1: Locate DataForSEO MCP Server Entry Point**
Run: `ls -R mcps/mcp.dataforseo.com/`
Expected: Find `index.js` or `build/index.js` or `server.js`.

**Step 2: Attempt to run DataForSEO MCP Server directly**
Run: `node mcps/mcp.dataforseo.com/path/to/server.js` (with dummy env vars if needed)
Expected: Server starts or errors asking for config.

**Step 3: Connect `mcp-cli` to DataForSEO**
Run: `mcp-cli --server "node mcps/mcp.dataforseo.com/path/to/server.js"` (syntax depends on tool)
*Self-correction: I need to check `mcp-cli --help` to know the syntax.*

**Step 4: Report Findings**
Document exact commands used, successes, and failures.

