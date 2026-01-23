# AEO Backlink Analysis Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Analyze backlinks from "Tier A" (AEO/Semantic) vs "Tier B" (Content Ops) competitors and measure their overlap with Perplexity.ai citations to proving the "AEO Authority Gap" hypothesis.

**Architecture:**
We will use DataForSEO's Backlink API to fetch backlink data for defined competitors. We will then process this data to calculate the "Perplexity Citation Rate".
The process involves:
1.  **Data Collection:** Fetching referring domains for Tier A, Tier B, and Tier C (Perplexity).
2.  **Intersection Analysis:** Identifying which referring domains linking to Tier A/B *also* link to Tier C.
3.  **Visualization:** Outputting a clear summary (Markdown/CSV) proving the hypothesis.

**Tech Stack:**
- **DataForSEO API** (via existing MCP integration in `mcps/mcp.dataforseo.com`)
- **TypeScript/Node.js** (for the analysis script)

---

### Task 1: Environment & API Verification

**Files:**
- Create: `scripts/aeo-analysis/verify-api.ts`

**Step 1: Create script to test DataForSEO connection**

We need to ensure we can hit the DataForSEO `backlinks/referring_domains` endpoint before proceeding with bulk data.

```typescript
// scripts/aeo-analysis/verify-api.ts
import { DataForSeoClient } from '../../lib/mcp/dataforseo-client'; // Hypothetical path - verify actual client location
// NOTE: If no direct client exists, we might need to use the MCP tool interface or raw fetch if inside the agent context.
// Given we are "opencode", we likely have access to the codebase.
// Let's assume we need to use a raw fetch wrapper if a nice client isn't exported,
// BUT looking at the file list, we have `mcps/mcp.dataforseo.com/...`.
// We should check `lib/mcp/` first to see if there is a usable wrapper.

// For this plan, we will write a script that uses the existing project patterns.
// If `lib/mcp/dataforseo.ts` exists, use it. Otherwise, draft a simple fetcher.

console.log("Verifying DataForSEO Access...");
// TODO: Implement simple single-domain fetch for 'marketmuse.com'
```

*Self-Correction during planning:* I need to know *exactly* how to call DataForSEO from a script in this repo.
*Action:* I will check `lib/mcp/` and `mcps/mcp.dataforseo.com` structure in the first real step of execution.

For the plan, I will assume we create a standalone script that mimics the MCP logic to run locally.

**Step 2: Run verification**

Run: `npx tsx scripts/aeo-analysis/verify-api.ts`
Expected: JSON output with backlink data for a test domain.

**Step 3: Commit**

```bash
git add scripts/aeo-analysis/verify-api.ts
git commit -m "chore: add dataforseo api verification script"
```

---

### Task 2: Data Collection Script (Tier A, B, C)

**Files:**
- Create: `scripts/aeo-analysis/collect-data.ts`

**Step 1: Define Target Domains**

```typescript
const TIER_A = ['marketmuse.com', 'frase.io', 'inlinks.com'];
const TIER_B = ['surferseo.com', 'clearscope.io', 'rankmath.com'];
const TIER_C = ['perplexity.ai'];
```

**Step 2: Implement Batch Fetching**

Iterate through all lists. For each domain, fetch the **top 1000 referring domains** (sorted by Rank/Authority).
Store results in `data/aeo-analysis/raw/{domain}.json`.

**Step 3: Run Collection**

Run: `npx tsx scripts/aeo-analysis/collect-data.ts`
Expected: `data/aeo-analysis/raw/` populated with JSON files.

**Step 4: Commit**

```bash
git add scripts/aeo-analysis/collect-data.ts
git commit -m "feat: add backlink data collection script"
```

---

### Task 3: Intersection Analysis Script

**Files:**
- Create: `scripts/aeo-analysis/analyze-overlap.ts`

**Step 1: Load Data**

Load all JSON files from `data/aeo-analysis/raw/`.

**Step 2: Calculate Overlap**

Logic:
1.  Get `Set<string>` of Perplexity's referring domains (`P_Refs`).
2.  For each Tier A domain:
    - Get its referring domains (`A_Refs`).
    - Calculate Intersection: `A_Refs` ∩ `P_Refs`.
    - Score = (Intersection Count / Total A_Refs) * 100.
3.  Repeat for Tier B.

**Step 3: Generate Report**

Output a table to console and `data/aeo-analysis/report.md`.

```markdown
| Tier | Domain | Total Refs Checked | Shared with Perplexity | Overlap % |
|------|--------|--------------------|------------------------|-----------|
| A    | ...    | ...                | ...                    | ...       |
```

**Step 4: Run Analysis**

Run: `npx tsx scripts/aeo-analysis/analyze-overlap.ts`
Expected: Console table showing the "Authority Gap".

**Step 5: Commit**

```bash
git add scripts/aeo-analysis/analyze-overlap.ts
git commit -m "feat: add aeo citation overlap analysis"
```

---

### Task 4: Final Case Study Artifact

**Files:**
- Create: `docs/case-studies/aeo-authority-gap.md`

**Step 1: Write the Narrative**

Combine the user's "Authority Gap" hook with the generated data.
Draft the content:
- **Title:** The AEO Authority Gap
- **Hypothesis:** Tier A links predict Perplexity citations.
- **Data:** Insert the table from Task 3.
- **Conclusion:** "Links from these sources make you [X]x more likely to be cited by AI."

**Step 2: Commit**

```bash
git add docs/case-studies/aeo-authority-gap.md
git commit -m "docs: add aeo authority gap case study"
```
