# DUNIS Africa E-Learning - Start Script (PowerShell)
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  DUNIS Africa E-Learning Platform" -ForegroundColor Cyan  
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "Starting Backend (port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Wait a moment
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend (port 3000)..." -ForegroundColor Yellow
$env:HOST = "localhost"
$env:DANGEROUSLY_DISABLE_HOST_CHECK = "true"
$env:REACT_APP_API_URL = "http://localhost:5000/api"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; `$env:HOST='localhost'; `$env:DANGEROUSLY_DISABLE_HOST_CHECK='true'; `$env:REACT_APP_API_URL='http://localhost:5000/api'; npm start"

Write-Host ""
Write-Host "Both servers starting..." -ForegroundColor Green
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
