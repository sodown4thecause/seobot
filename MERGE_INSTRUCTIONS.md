# Manual Merge Instructions

Since the automated merge is blocked by a pager issue, please run these commands manually in your PowerShell terminal:

## Step 1: Configure Git to Avoid Pagers
```powershell
git config --global core.pager ""
```

## Step 2: Stash Uncommitted Changes
```powershell
git stash push --include-untracked -m "Stash before merge"
```

## Step 3: Switch to Main Branch
```powershell
git checkout main
```

## Step 4: Pull Latest Main
```powershell
git pull origin main
```

## Step 5: Merge Feature Branch
```powershell
git merge feature/ai-orchestrator-agent --no-edit
```

## Step 6: Check for Conflicts
```powershell
git status
```

If you see "All conflicts fixed but you are still merging", complete with:
```powershell
git commit --no-edit
```

## Step 7: Push to Main (if merge successful)
```powershell
git push origin main
```

## If Conflicts Occur

If there are merge conflicts:
1. Check which files have conflicts: `git status`
2. Open conflicted files and resolve manually
3. After resolving: `git add <resolved-files>`
4. Complete merge: `git commit --no-edit`

## Note About BMAD Files

Since you mentioned BMAD files aren't important, if conflicts occur in `.bmad-core/` or `.augment/` directories, you can accept the main branch version:
```powershell
git checkout --theirs .bmad-core/
git checkout --theirs .augment/
git add .bmad-core/ .augment/
```





