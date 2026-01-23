# ESLint Fix - Ignore .worktrees directory

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent ESLint from scanning the hidden `.worktrees` directory, which contains a separate project instance with large generated files, causing Out-Of-Memory errors.

**Architecture:** 
Update `eslint.config.mjs` to explicitly ignore the `.worktrees` pattern. This directory is being picked up by ESLint despite starting with a dot, likely because it's not in the default ignore list.

**Tech Stack:** ESLint, Node.js

### Task 1: Update ESLint Ignore Patterns

**Files:**
- Modify: `eslint.config.mjs`

**Step 1: Add Ignore Pattern**

Modify `eslint.config.mjs` to add `".worktrees/**"` to the `globalIgnores` array.

```javascript
// ...
  globalIgnores([
    // ...
    ".worktrees/**", // Add this line
  ]),
// ...
```

**Step 2: Verify Linting**

Run `npm run lint` to verify that it completes successfully without OOM errors.

**Step 3: Commit**

```bash
git add eslint.config.mjs
git commit -m "chore: ignore .worktrees directory in eslint to prevent OOM"
```
