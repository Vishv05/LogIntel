@echo off
title LogIntel Platform Launcher
echo ===================================================
echo   LOGINTEL ? Starting Backend and Frontend Servers
echo ===================================================
echo.

echo Starting FastAPI Backend on http://localhost:8000 ...
start "LogIntel Backend" cmd /k "cd /d "%~dp0" && backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo Starting User Portal on http://localhost:3000 ...
start "LogIntel User Portal (Port 3000)" cmd /k "cd /d "%~dp0frontend" && npm run dev:user"

timeout /t 2 /nobreak >nul

echo Starting Admin Portal on http://localhost:3001 ...
start "LogIntel Admin Portal (Port 3001)" cmd /k "cd /d "%~dp0frontend" && npm run dev:admin"

echo.
echo ===================================================
echo   LogIntel Platform is running!
echo   - Web Platform:   http://localhost:3000
echo   - Admin Gateway:  http://localhost:3001
echo   - REST API & Docs: http://localhost:8000/docs
echo ===================================================
echo.
pause
