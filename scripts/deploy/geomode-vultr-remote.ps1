# Deploy Geomode bootstrap script to the Sydney Vultr VPS and run it.
# Requires SSH key at ~/.ssh/id_ed25519_hermes_vultr (or set -SshKeyPath).

param(
  [string]$Host = "45.76.118.244",
  [string]$InstanceId = "c69492ff-272a-4d42-8925-94899edb2f10",
  [string[]]$Users = @("root", "ubuntu"),
  [string]$SshKeyPath = "$env:USERPROFILE\.ssh\id_ed25519_hermes_vultr",
  [string]$BootstrapScript = "$PSScriptRoot\geomode-vultr-bootstrap.sh",
  [string]$EnvFile = "$PSScriptRoot\geomode-vultr.env",
  [switch]$InjectSshKey,
  [switch]$AllowReinstall,
  [switch]$TestOnly,
  [switch]$NonInteractive
)

$ErrorActionPreference = "Stop"

function Import-DeployEnvFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return }
  Get-Content $Path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    $name, $value = $_ -split '=', 2
    if ($name) {
      $expanded = [Environment]::ExpandEnvironmentVariables($value.Trim())
      Set-Item -Path "Env:$name" -Value $expanded
    }
  }
}

Import-DeployEnvFile -Path $EnvFile

if ($env:VULTR_GEOMODE_HOST) { $Host = $env:VULTR_GEOMODE_HOST }
if ($env:VULTR_GEOMODE_INSTANCE_ID) { $InstanceId = $env:VULTR_GEOMODE_INSTANCE_ID }
if ($env:VULTR_SSH_KEY_PATH) { $SshKeyPath = $env:VULTR_SSH_KEY_PATH }
if ($env:VULTR_SSH_USER) { $Users = @($env:VULTR_SSH_USER) + $Users | Select-Object -Unique }

if ($InjectSshKey) {
  Write-Host "Registering SSH key via Vultr API (instance ${InstanceId})..."
  $injectArgs = @()
  if ($AllowReinstall) { $injectArgs += "-AllowReinstall" }
  & "$PSScriptRoot\vultr-inject-ssh-key.ps1" @injectArgs -EnvFile $EnvFile
  if ($AllowReinstall) {
    Write-Host "Reinstall requested — wait for instance to come back before re-running without -AllowReinstall."
    exit 0
  }
}

if (-not (Test-Path $SshKeyPath)) {
  Write-Error "SSH key not found: $SshKeyPath. Run with -InjectSshKey after setting VULTR_API_KEY, or add the key in Vultr portal (docs/deployment/geomode-vultr.md)."
}

if (-not (Test-Path $BootstrapScript)) {
  Write-Error "Bootstrap script not found: $BootstrapScript"
}

$sshUser = $null
foreach ($candidate in $Users) {
  Write-Host "Testing SSH ${candidate}@${Host}..."
  ssh -i $SshKeyPath -o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new "${candidate}@${Host}" "echo ok" 2>$null
  if ($LASTEXITCODE -eq 0) {
    $sshUser = $candidate
    break
  }
}

if (-not $sshUser) {
  Write-Error @"
SSH failed for $($Users -join ', ')@${Host}.
Inject key: .\scripts\deploy\vultr-inject-ssh-key.ps1 -InjectSshKey
Or portal console: docs/deployment/geomode-vultr.md
"@
}

Write-Host "SSH OK as ${sshUser}@${Host}"

if ($TestOnly) {
  Write-Host "TestOnly — skipping bootstrap upload."
  exit 0
}

Write-Host "Copying bootstrap script..."
scp -i $SshKeyPath -o StrictHostKeyChecking=accept-new $BootstrapScript "${sshUser}@${Host}:/tmp/geomode-vultr-bootstrap.sh"

$remoteEnv = ""
if ($NonInteractive) {
  $remoteEnv = "ELMO_NONINTERACTIVE=1"
}

Write-Host "Running bootstrap on VPS..."
if ($NonInteractive) {
  ssh -i $SshKeyPath -o StrictHostKeyChecking=accept-new "${sshUser}@${Host}" "sudo bash -lc 'chmod +x /tmp/geomode-vultr-bootstrap.sh && ${remoteEnv} /tmp/geomode-vultr-bootstrap.sh'"
} else {
  Write-Host "elmo init is interactive — complete the wizard in the SSH session."
  ssh -i $SshKeyPath -o StrictHostKeyChecking=accept-new -t "${sshUser}@${Host}" "sudo bash -lc 'chmod +x /tmp/geomode-vultr-bootstrap.sh && /tmp/geomode-vultr-bootstrap.sh'"
}

Write-Host "Done. UI: http://${Host}:1515"
