@echo off
echo ================================================
echo   DUNIS Africa E-Learning Platform
echo ================================================
echo.
echo Starting Backend (port 5000)...
start cmd /k "cd backend && npm run dev"

echo Waiting for backend to start...
timeout /t 3 /nobreak > NUL

echo Starting Frontend (port 3000)...
start cmd /k "cd frontend && set HOST=localhost && set DANGEROUSLY_DISABLE_HOST_CHECK=true && set REACT_APP_API_URL=http://localhost:5000/api && npm start"

echo.
echo Both servers starting...
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause
