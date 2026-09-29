# =====================================================
# PattayaPal Deploy Script for Hostinger (Original Version)
# =====================================================
Write-Host '🚀 PattayaPal Deploy Script' -ForegroundColor Cyan
Write-Host '=====================================' -ForegroundColor Cyan

# Step 1: Build Frontend
Write-Host "
[1/4] Building Frontend..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\Production"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host '❌ Build failed!' -ForegroundColor Red; pause; exit 1 }
Write-Host '✅ Build Success' -ForegroundColor Green

# Step 2: Copy dist to Backend/dist
Write-Host "
[2/4] Copying dist to Backend/dist..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot"
if (Test-Path 'Backend\dist') { Remove-Item -Recurse -Force 'Backend\dist' }
Copy-Item -Recurse -Force 'Production\dist' 'Backend\dist'
Write-Host '✅ Copy Success' -ForegroundColor Green

# Step 3: Create ZIP (Includes everything)
Write-Host "
[3/4] Creating hostinger_deploy.zip (This may take a few minutes)..." -ForegroundColor Yellow
if (Test-Path 'hostinger_deploy.zip') { Remove-Item -Force 'hostinger_deploy.zip' }
Compress-Archive -Force -Path 'Backend\*' -DestinationPath 'hostinger_deploy.zip'
$sizeMB = [math]::Round((Get-Item 'hostinger_deploy.zip').Length / 1MB, 2)
Write-Host "✅ Created hostinger_deploy.zip ($sizeMB MB)" -ForegroundColor Green

# Step 4: Done
Write-Host "
[4/4] Done!" -ForegroundColor Cyan
Write-Host '=====================================' -ForegroundColor Cyan
Write-Host ''
Write-Host '🚀 File to Upload: hostinger_deploy.zip' -ForegroundColor White
Write-Host ''
Write-Host '💡 Deploy Steps for Hostinger:' -ForegroundColor White
Write-Host '  1. Go to hPanel > File Manager > nodejs/' -ForegroundColor Gray
Write-Host '  2. Upload hostinger_deploy.zip to nodejs/' -ForegroundColor Gray
Write-Host '  3. Extract ZIP and OVERWRITE existing files' -ForegroundColor Gray
Write-Host '  4. hPanel > Websites > Node.js > Restart' -ForegroundColor Gray
Write-Host ''
Start-Process explorer.exe $PSScriptRoot
pause
