param([string]$Message = "")
if (-not $Message) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm"
    $Message = "feat: SafeHer update $ts"
}
Set-Location "C:\Users\shash\SafeHerApp"
git add .
git commit -m $Message
git push origin main
Write-Host "Done! GitHub Actions will now push OTA update to all users." -ForegroundColor Green
