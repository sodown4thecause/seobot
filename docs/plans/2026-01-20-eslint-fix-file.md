# ESLint Fix - Use .eslintignore file (Retry 2)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the Out-Of-Memory (OOM) error during linting by forcing the ignore rules using a traditional `.eslintignore` file, which typically takes precedence and is more reliable for folder-level exclusion in some setups.

**Architecture:** 
Create a `.eslintignore` file at the root of the project and add the problematic directories (`.worktrees`, `mcps`). Revert changes to `eslint.config.mjs` to keep it clean.

**Tech Stack:** ESLint

### Task 1: Create .eslintignore

**Files:**
- Create: `.eslintignore`
- Modify: `eslint.config.mjs`

**Step 1: Create .eslintignore**

Create `.eslintignore` with the following content:
```
.worktrees/
mcps/
dist/
build/
.next/
out/
```

**Step 2: Revert eslint.config.mjs**

Remove the manually added `.worktrees/**` and `mcps/**` lines from `eslint.config.mjs` to avoid confusion or conflict.

**Step 3: Verify Linting**

Run `npm run lint` and ensure it passes without OOM.

**Step 4: Commit**

```bash
git add .eslintignore eslint.config.mjs
git commit -m "fix(lint): use .eslintignore for worktrees and generated files"
```
