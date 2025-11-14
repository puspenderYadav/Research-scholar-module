@echo off
echo ========================================
echo Restarting Backend Server
echo ========================================
echo.

echo Step 1: Stopping all Python processes on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo Step 2: Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo Step 3: Starting backend server...
cd backend
start "Backend Server" cmd /k "python run.py"

echo.
echo ========================================
echo Backend server restarted!
echo Check the new window for server output
echo ========================================
pause
