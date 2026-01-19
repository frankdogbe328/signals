# Local Server Startup Script (Network Access)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Local Web Server (Network Access)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Finding your IP address..." -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*"} | Select-Object -First 1).IPAddress
Write-Host ""
Write-Host "Server will start on:" -ForegroundColor Green
Write-Host "  - Your computer: http://localhost:8000" -ForegroundColor Green
Write-Host "  - Other devices: http://$ipAddress:8000" -ForegroundColor Green
Write-Host ""
Write-Host "Share this URL with students: http://$ipAddress:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Start Python HTTP Server (accessible on network)
python -m http.server 8000 --bind 0.0.0.0
