@echo off
title Local Web Server - Signal Training School LMS
color 0A
echo ========================================
echo Starting Local Web Server (Network Access)
echo ========================================
echo.
cd /d "%~dp0"
echo Current directory: %CD%
echo.
echo Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo.
    echo Please install Python or use PowerShell method instead.
    echo.
    pause
    exit /b 1
)
echo Python found!
echo.
echo Finding your IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%a
    set IP=!IP: =!
    echo   Your IP: !IP!
)
echo.
echo ========================================
echo Server Starting...
echo ========================================
echo.
echo Server will be available on:
echo   - Your computer: http://localhost:8000
echo   - Other devices: http://%IP%:8000
echo.
echo Share this URL with students: http://%IP%:8000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.
python -m http.server 8000 --bind 0.0.0.0
pause
