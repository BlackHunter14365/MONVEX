# MONVEX PowerShell Runner Script
# Usage: .\run_monvex.ps1

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "          MONVEX - Production Dev Suite            " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$RootPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Django Backend on Port 8000
Write-Host "`n[1/2] Starting Django Backend on http://127.0.0.1:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootPath\backend'; python manage.py runserver 127.0.0.1:8000"

Start-Sleep -Seconds 2

# 2. Start Next.js Frontend on Port 3000
Write-Host "[2/2] Starting Next.js Frontend on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootPath\web'; npm.cmd run dev"

Write-Host "`n===================================================" -ForegroundColor Green
Write-Host "[SUCCESS] MONVEX services launched:" -ForegroundColor Green
Write-Host "  - Frontend Web UI : http://localhost:3000" -ForegroundColor White
Write-Host "  - Backend REST API: http://127.0.0.1:8000/api/v1" -ForegroundColor White
Write-Host "  - Health Endpoint : http://127.0.0.1:8000/health/" -ForegroundColor White
Write-Host "===================================================`n" -ForegroundColor Green
