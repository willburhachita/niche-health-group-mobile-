# ── Convex snapshot backup (Windows / PowerShell) ─────────────────────────
#
# Takes a full snapshot of the Convex deployment and verifies it.
# READ-ONLY: this script never deletes or modifies anything in the
# deployment. It only downloads.
#
#   .\scripts\backup.ps1              # snapshot the configured deployment
#   .\scripts\backup.ps1 -Prod        # snapshot the production deployment
#
param(
    [switch]$Prod,
    [string]$Label = "snapshot"
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$stamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$out   = if ($Prod) { "backups\$stamp-$Label-PROD.zip" } else { "backups\$stamp-$Label.zip" }

Write-Host "-- Convex snapshot backup ------------------------------------------"
Write-Host "Target : $(if ($Prod) { 'PRODUCTION' } else { 'configured deployment (see .env.local)' })"
Write-Host "Output : $out"
Write-Host ""

# ── Which deployment are we actually talking to? ──────────────────────────
if (Test-Path ".env.local") {
    Write-Host "Deployment configured in .env.local:"
    $line = Select-String -Path ".env.local" -Pattern '^CONVEX_DEPLOYMENT=' -ErrorAction SilentlyContinue
    if ($line) { Write-Host "  $($line.Line)" } else { Write-Host "  (CONVEX_DEPLOYMENT not set)" }
    Write-Host ""
} else {
    Write-Host "WARNING: no .env.local found - 'npx convex export' may prompt you" -ForegroundColor Yellow
    Write-Host "         to pick a deployment. Make sure you pick the right one." -ForegroundColor Yellow
    Write-Host ""
}

New-Item -ItemType Directory -Force -Path "backups" | Out-Null

# ── Export ────────────────────────────────────────────────────────────────
Write-Host "Exporting... (this can take a few minutes on a large deployment)"
if ($Prod) {
    npx convex export --prod --path $out
} else {
    npx convex export --path $out
}

if (-not (Test-Path $out)) {
    Write-Error "FAILED: no snapshot was written to $out"
    exit 1
}

$sizeMB = [math]::Round((Get-Item $out).Length / 1MB, 2)
Write-Host ""
Write-Host "Snapshot written: $out ($sizeMB MB)"
Write-Host ""

# ── Verify ────────────────────────────────────────────────────────────────
Write-Host "-- Verifying contents ----------------------------------------------"
$tmp = Join-Path $env:TEMP "convex-verify-$stamp"
Expand-Archive -Path $out -DestinationPath $tmp -Force

$docs = Get-ChildItem -Path $tmp -Recurse -Filter "documents.jsonl"
Write-Host "Tables in snapshot : $($docs.Count)"

if (Test-Path (Join-Path $tmp "_storage")) {
    Write-Host "File storage       : present"
} else {
    Write-Host "File storage       : NOT FOUND - check whether attachments are included" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Row counts per table:"
foreach ($d in ($docs | Sort-Object FullName)) {
    $table = Split-Path (Split-Path $d.FullName -Parent) -Leaf
    $count = (Get-Content $d.FullName | Measure-Object -Line).Lines
    Write-Host ("  {0,-28} {1}" -f $table, $count)
}

Remove-Item -Recurse -Force $tmp

Write-Host ""
Write-Host "-- Done ------------------------------------------------------------"
Write-Host "Next steps:"
Write-Host "  1. Copy this file somewhere OFF the Convex account (a compromise of"
Write-Host "     that account must not take the backup with it)."
Write-Host "  2. Encrypt it at rest - it contains real patient data."
Write-Host "  3. Record the row counts above; compare after any migration."
Write-Host "  4. Do NOT commit it. backups\.gitignore already blocks this."
