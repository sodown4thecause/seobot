# Register local SSH key with Vultr for the Sydney geomode instance.
# Requires VULTR_API_KEY in env or scripts/deploy/geomode-vultr.env (gitignored).

param(
  [switch]$AllowReinstall,
  [string]$EnvFile = "$PSScriptRoot\geomode-vultr.env"
)

$ErrorActionPreference = "Stop"

function Import-DeployEnvFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return }
  Get-Content $Path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    $name, $value = $_ -split '=', 2
    if ($name) {
      $trimmed = $value.Trim()
      $expanded = [Environment]::ExpandEnvironmentVariables($trimmed)
      Set-Item -Path "Env:$name" -Value $expanded
    }
  }
}

Import-DeployEnvFile -Path $EnvFile

if (-not $env:VULTR_API_KEY) {
  Write-Error "VULTR_API_KEY not set. Add it to $EnvFile or your shell environment."
}

$bashScript = Join-Path $PSScriptRoot "vultr-inject-ssh-key.sh"
if (-not (Test-Path $bashScript)) {
  Write-Error "Missing $bashScript"
}

if ($AllowReinstall) {
  $env:VULTR_ALLOW_REINSTALL = "1"
}

$gitBash = @(
  "$env:ProgramFiles\Git\bin\bash.exe",
  "$env:ProgramFiles\Git\usr\bin\bash.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($gitBash) {
  & $gitBash -lc "bash '$($bashScript -replace '\\','/')'"
  exit $LASTEXITCODE
}

Write-Error "Install Git Bash to run vultr-inject-ssh-key.sh, or run the script on Linux/macOS."
