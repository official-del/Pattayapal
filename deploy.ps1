# =====================================================
# PattayaPal Deploy Script for Hostinger
# =====================================================

$rootDir     = "C:\Users\touch\OneDrive\Desktop\Pattayapal-Portfolio"
$frontendDir = "$rootDir\Production"
$backendDir  = "$rootDir\Backend"
$zipPath     = "$rootDir\hostinger_deploy.zip"

function Fail($msg) {
    Write-Host ""
    Write-Host "ERROR: $msg" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "PattayaPal Deploy Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# ── Step 1: Build Frontend ──────────────────────────
Write-Host ""
Write-Host "[1/4] Building Frontend..." -ForegroundColor Yellow

if (-not (Test-Path $frontendDir)) { Fail "ไม่พบโฟลเดอร์ $frontendDir" }

Set-Location $frontendDir

if (-not (Test-Path "$frontendDir\node_modules")) {
    Write-Host "ไม่พบ node_modules กำลัง npm install..." -ForegroundColor Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) { Fail "npm install ล้มเหลว" }
}

& npm run build
if ($LASTEXITCODE -ne 0) { Fail "Build ล้มเหลว กรุณาดู error ด้านบน" }

Write-Host "Build Success" -ForegroundColor Green

# ── Step 2: Copy dist ──────────────────────────────
Write-Host ""
Write-Host "[2/4] Copying dist to Backend..." -ForegroundColor Yellow

Set-Location $rootDir

$distSrc  = "$frontendDir\dist"
$distDest = "$backendDir\dist"

if (-not (Test-Path $distSrc)) { Fail "ไม่พบ $distSrc" }
if (Test-Path $distDest) { Remove-Item -Recurse -Force $distDest }
Copy-Item -Recurse -Force $distSrc $distDest

Write-Host "Copy Success" -ForegroundColor Green

# ── Step 3: Create ZIP ──────────────────────────────
Write-Host ""
Write-Host "[3/4] Creating hostinger_deploy.zip..." -ForegroundColor Yellow

if (Test-Path $zipPath) { Remove-Item -Force $zipPath }

$exclude = @('node_modules', '.env', 'uploads', 'scratch',
             '.codex-dev.err.log', '.codex-dev.log', 'error_log.txt')

$filesToZip = Get-ChildItem -Path $backendDir -Recurse -File | Where-Object {
    $rel  = $_.FullName.Substring($backendDir.Length + 1)
    $skip = $false
    foreach ($p in ($rel -split '\\')) {
        if ($exclude -contains $p) { $skip = $true; break }
    }
    -not $skip
}

Write-Host "Files to zip: $($filesToZip.Count)" -ForegroundColor DarkGray

if ($filesToZip.Count -eq 0) { Fail "ไม่มีไฟล์ใน Backend" }

$tempDir = "$rootDir\_deploy_temp"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir | Out-Null

foreach ($file in $filesToZip) {
    $rel    = $file.FullName.Substring($backendDir.Length + 1)
    $dest   = Join-Path $tempDir $rel
    $folder = Split-Path $dest -Parent
    if (-not (Test-Path $folder)) { New-Item -ItemType Directory -Path $folder | Out-Null }
    Copy-Item $file.FullName $dest
}

Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -CompressionLevel Optimal
Remove-Item -Recurse -Force $tempDir

$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host "Created hostinger_deploy.zip ($sizeMB MB)" -ForegroundColor Green

# ── Step 4: Done ────────────────────────────────────
Write-Host ""
Write-Host "[4/4] Done!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "File to Upload : hostinger_deploy.zip"
Write-Host ""
Write-Host "Next steps on Hostinger hPanel:"
Write-Host "  1. File Manager -- nodejs/ -- Upload ZIP"
Write-Host "  2. Extract and Overwrite"
Write-Host "  3. Terminal: cd nodejs/ then: npm install --omit=dev"
Write-Host "  4. Node.js -- Restart"
Write-Host ""

Start-Process explorer.exe $rootDir
Read-Host "Press Enter to exit"
