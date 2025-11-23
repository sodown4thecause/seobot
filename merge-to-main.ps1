# Merge feature branch to main
$env:GIT_PAGER = ""
git config core.pager ""

Write-Host "Stashing uncommitted changes..."
git stash push --include-untracked -m "Stash before merge" 2>&1 | Out-String

Write-Host "Switching to main branch..."
git checkout main 2>&1 | Out-String

Write-Host "Pulling latest main..."
git pull origin main 2>&1 | Out-String

Write-Host "Merging feature/ai-orchestrator-agent..."
git merge feature/ai-orchestrator-agent --no-edit 2>&1 | Out-String

Write-Host "Checking status..."
git status 2>&1 | Out-String

Write-Host "Checking for conflicts..."
$conflicts = git diff --check 2>&1 | Out-String
if ($conflicts -match "conflict") {
    Write-Host "CONFLICTS DETECTED!" -ForegroundColor Red
    git status
} else {
    Write-Host "No conflicts detected!" -ForegroundColor Green
    git status
}



