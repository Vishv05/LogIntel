@echo off
title Push LogIntel to GitHub
echo ===================================================
echo   Pushing LogIntel to GitHub (https://github.com/Vishv05/LogIntel)
echo ===================================================
echo.
cd /d "%~dp0"
git remote remove origin 2>nul
git remote add origin https://github.com/Vishv05/LogIntel.git
git branch -M main
echo Running git push -u origin main ...
git push -u origin main
echo.
echo ===================================================
if %errorlevel% equ 0 (
    echo [SUCCESS] Project pushed successfully to GitHub!
) else (
    echo [NOTE] If authentication is needed, sign in via the browser prompt above.
)
echo ===================================================
pause
