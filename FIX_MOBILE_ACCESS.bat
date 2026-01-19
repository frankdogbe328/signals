@echo off
title Fix Mobile Access - Signal Training School LMS
color 0B
echo ========================================
echo FIXING MOBILE ACCESS
echo ========================================
echo.
echo Step 1: Stopping all existing servers...
echo.

REM Kill all Python processes (be careful!)
taskkill /F /IM python.exe /T >nul 2>&1
timeout /t 2 >nul

echo Step 2: Finding your IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%a
    set IP=!IP: =!
    echo.
    echo ========================================
    echo YOUR IP ADDRESS: !IP!
    echo ========================================
    echo.
    echo Mobile Access URL: http://!IP!:8000
    echo.
)

echo Step 3: Starting server with network access...
echo.
echo IMPORTANT: Server MUST bind to 0.0.0.0 for mobile access!
echo.
cd /d "%~dp0"
python -m http.server 8000 --bind 0.0.0.0

pause
