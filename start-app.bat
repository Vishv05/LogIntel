@echo off
title LogIntel Platform Launcher
echo ===================================================
echo   LOGINTEL ? Starting Backend and Frontend Servers
echo ===================================================
echo.

echo Starting FastAPI Backend on http://localhost:8000 ...
start "LogIntel Backend" cmd /k "cd /d "%~dp0" && backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo Starting React Frontend on http://localhost:3000 ...
start "LogIntel Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ===================================================
echo   LogIntel is running!
echo   - Web Dashboard: http://localhost:3000
echo   - REST API & Docs: http://localhost:8000/docs
echo ===================================================
echo.
pause
