@echo off
chcp 65001 >nul
echo PattayaPal Deploy Script
echo =====================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\touch\OneDrive\Desktop\Pattayapal-Portfolio\deploy.ps1"

if errorlevel 1 (
    echo.
    echo ERROR: Script failed.
)
pause
