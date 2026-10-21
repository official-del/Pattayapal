# =====================================================
# PattayaPal Deploy Script for Hostinger
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

# Step 3: Create ZIP (Exclude node_modules, .env, uploads, scratch)
Write-Host "
[3/4] Creating hostinger_deploy.zip..." -ForegroundColor Yellow
if (Test-Path 'hostinger_deploy.zip') { Remove-Item -Force 'hostinger_deploy.zip' }

# --- Collect files to include (exclude node_modules, .env, uploads, scratch, logs) ---
$srcDir = "$PSScriptRoot\Backend"
$exclude = @('node_modules', '.env', 'uploads', 'scratch', '.codex-dev.err.log', '.codex-dev.log', 'error_log.txt')

$filesToZip = Get-ChildItem -Path $srcDir -Recurse -File | Where-Object {
    $relativePath = $_.FullName.Substring($srcDir.Length + 1)
    $parts = $relativePath -split '\\'
    $skip = $false
    foreach ($part in $parts) {
        if ($exclude -contains $part) { $skip = $true; break }
    }
    -not $skip
}

# Create a temp staging folder to preserve directory structure in ZIP
$tempDir = "$PSScriptRoot\_deploy_temp"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir | Out-Null

foreach ($file in $filesToZip) {
    $relativePath = $file.FullName.Substring($srcDir.Length + 1)
    $destPath = Join-Path $tempDir $relativePath
    $destFolder = Split-Path $destPath -Parent
    if (-not (Test-Path $destFolder)) { New-Item -ItemType Directory -Path $destFolder | Out-Null }
    Copy-Item -Path $file.FullName -Destination $destPath
}

Compress-Archive -Path "$tempDir\*" -DestinationPath 'hostinger_deploy.zip' -CompressionLevel Optimal
Remove-Item -Recurse -Force $tempDir

$sizeMB = [math]::Round((Get-Item 'hostinger_deploy.zip').Length / 1MB, 2)
Write-Host "✅ Created hostinger_deploy.zip ($sizeMB MB)" -ForegroundColor Green
Write-Host "   ⚠️  node_modules ไม่รวมใน ZIP — ต้อง npm install บน Hostinger Terminal ด้วย" -ForegroundColor Yellow

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
Write-Host '  4. Open hPanel > Terminal, then cd into nodejs/ and run: npm install --omit=dev' -ForegroundColor Gray
Write-Host '  5. hPanel > Websites > Node.js > Restart' -ForegroundColor Gray
Write-Host ''
Start-Process explorer.exe $PSScriptRoot
pause
