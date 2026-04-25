# SafeHer Full Build Script
# Run: powershell -ExecutionPolicy Bypass -File build.ps1
# From: C:\Users\shash\SafeHerApp\mobile

$ErrorActionPreference = "Continue"
$mobileDir = "C:\Users\shash\SafeHerApp\mobile"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SafeHer - Full APK Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ── Step 1: Fix icon ──
Write-Host "`n[1/5] Converting icon to PNG..." -ForegroundColor Yellow

$iconSrc = "C:\Users\shash\.gemini\antigravity\brain\01671364-f963-4a30-bd91-f447542814c7\safeher_logo_png_1777091609480.png"
$assetsDir = "$mobileDir\assets"

if (Test-Path $iconSrc) {
    try {
        Add-Type -AssemblyName System.Drawing
        $img = [System.Drawing.Image]::FromFile($iconSrc)
        $img.Save("$assetsDir\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Save("$assetsDir\adaptive-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Save("$assetsDir\splash-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Dispose()
        Write-Host "  Icons converted to PNG!" -ForegroundColor Green
    } catch {
        Write-Host "  Icon conversion failed: $_" -ForegroundColor Red
        Write-Host "  Keeping existing icons." -ForegroundColor Yellow
    }
} else {
    Write-Host "  Icon file not found, keeping existing icons." -ForegroundColor Yellow
}

# ── Step 2: Clean install ──
Write-Host "`n[2/5] Clean installing dependencies..." -ForegroundColor Yellow

Set-Location $mobileDir

if (Test-Path "package-lock.json") { Remove-Item "package-lock.json" -Force }
if (Test-Path "node_modules") { 
    Write-Host "  Removing node_modules (this takes a minute)..." -ForegroundColor DarkGray
    Remove-Item "node_modules" -Recurse -Force 
}

npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  npm install failed! Check errors above." -ForegroundColor Red
    exit 1
}
Write-Host "  Dependencies installed!" -ForegroundColor Green

# ── Step 3: Regenerate android/ native code ──
Write-Host "`n[3/5] Regenerating Android native project..." -ForegroundColor Yellow

npx expo prebuild --platform android --clean --no-install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Prebuild failed! Check errors above." -ForegroundColor Red
    exit 1
}
Write-Host "  Android project regenerated!" -ForegroundColor Green

# ── Step 4: Git push ──
Write-Host "`n[4/5] Pushing to GitHub..." -ForegroundColor Yellow

Set-Location "C:\Users\shash\SafeHerApp"
git add -A
git commit -m "chore: pin SDK 54, add expo-font, fix icon format, clean native code"
git push origin main
Write-Host "  Pushed to GitHub!" -ForegroundColor Green

# ── Step 5: Build APK ──
Write-Host "`n[5/5] Starting EAS cloud build (~15-20 min)..." -ForegroundColor Yellow
Write-Host "  You can track progress at: https://expo.dev/accounts/eternal18/projects/safeher-mobile/builds" -ForegroundColor DarkGray

Set-Location $mobileDir
eas build --platform android --profile preview --non-interactive

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  BUILD COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
