@echo off
TITLE MONVEX Orchestrator
echo ===================================================
echo           MONVEX - Production Dev Suite
echo ===================================================
echo.
echo Starting Django Backend on http://127.0.0.1:8000 ...
start "MONVEX Backend (Django 8000)" cmd /k "cd /d "%~dp0backend" && python manage.py runserver 127.0.0.1:8000"

echo.
echo Waiting 2 seconds for backend initialization...
timeout /t 2 /nobreak >nul

echo Starting Next.js Frontend on http://localhost:3000 ...
start "MONVEX Frontend (Next.js 3000)" cmd /k "cd /d "%~dp0web" && npm.cmd run dev"

echo.
echo ===================================================
echo [SUCCESS] MONVEX services are running:
echo  - Frontend Web UI : http://localhost:3000
echo  - Backend REST API: http://127.0.0.1:8000/api/v1
echo  - Health Endpoint : http://127.0.0.1:8000/health/
echo ===================================================
echo Press any key to exit this launcher window (services keep running).
pause >nul
