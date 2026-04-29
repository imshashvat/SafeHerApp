# ─── SafeHer Push Script ─────────────────────────────────────────────────────
# Usage:
#   .\push.ps1                        → uses default message
#   .\push.ps1 "fix: SOS location"   → uses your custom message
#
# On every push to main:
#   GitHub Actions automatically runs `eas update`
#   → Users get the new JS bundle on next app open (NO reinstall needed)
# ─────────────────────────────────────────────────────────────────────────────

param(
    [string]$Message = ""
)

# Build commit message
if (-not $Message) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $Message = "feat: SafeHer update — $timestamp"
}

Write-Host ""
Write-Host "SafeHer — Pushing to GitHub" -ForegroundColor Magenta
Write-Host "Commit: $Message" -ForegroundColor Cyan
Write-Host ""

Set-Location "C:\Users\shash\SafeHerApp"

# Stage all changes
git add .

# Commit
git commit -m $Message

if ($LASTEXITCODE -ne 0) {
    Write-Host "Nothing to commit or commit failed." -ForegroundColor Yellow
    exit 0
}

# Push to main — this triggers GitHub Actions → EAS Update
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "GitHub push complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "GitHub Actions is now running EAS Update..." -ForegroundColor Cyan
    Write-Host "Users will receive the OTA update on next app launch." -ForegroundColor Green
    Write-Host ""
    Write-Host "Track update status at:" -ForegroundColor Gray
    Write-Host "  https://expo.dev/accounts/eternal18/projects/safeher-mobile/updates" -ForegroundColor Gray
} else {
    Write-Host "Push failed. Check your internet connection or GitHub credentials." -ForegroundColor Red
}
