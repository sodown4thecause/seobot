# ESLint Ignore Configuration Fix

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ignore the `.worktrees` directory in ESLint configuration to prevent memory issues and linting of unrelated files.

**Architecture:** 
Update `eslint.config.mjs` to include `.worktrees/**` in the `globalIgnores` list. This prevents ESLint from traversing into the git worktrees directory, which likely contains duplicate or large files causing the OOM error.

**Tech Stack:** ESLint, JavaScript

### Task 1: Update ESLint Configuration

**Files:**
- Modify: `eslint.config.mjs`

**Step 1: Read current config**
(Already done in analysis phase)

**Step 2: Add .worktrees to globalIgnores**

```javascript
// ... existing imports
// ... existing config structure
  globalIgnores([
    // ... existing ignores
    ".worktrees/**", // <--- ADD THIS
    "mcps/**", // <--- ADD THIS ALSO (Generated files, typically shouldn't be linted)
  ]),
// ...
```

**Step 3: Verify Linting**
Run `npm run lint` and verify it completes (or at least doesn't OOM on the worktrees folder).

**Step 4: Commit**
```bash
git add eslint.config.mjs
git commit -m "chore: ignore .worktrees and mcps directories in eslint"
```
