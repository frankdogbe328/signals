@echo off
echo ========================================
echo Starting Local Web Server (Network Access)
echo ========================================
echo.
echo Server will start on:
echo   - Your computer: http://localhost:8000
echo   - Other devices: http://YOUR_IP:8000
echo.
echo Finding your IP address...
ipconfig | findstr /i "IPv4"
echo.
echo Share the IP address above with students
echo (e.g., http://192.168.1.100:8000)
echo.
echo Press Ctrl+C to stop the server
echo.
cd /d "%~dp0"
python -m http.server 8000 --bind 0.0.0.0
pause
