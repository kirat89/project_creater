@echo off
REM Start both backend and frontend in development mode

echo.
echo ================================================
echo.  Starting Create-Anything Development Environment
echo.
echo ================================================
echo.

REM Ensure script runs from its own directory (script location = project root)
pushd "%~dp0" >nul

REM Check apps folder exists
if not exist "apps" (
  echo ERROR: apps directory not found in %~dp0
  echo Please move this script to the project root and run again
  pause
  popd >nul
  exit /b 1
)

REM Start backend
echo Starting backend...
cd apps\backend || (
  echo Failed to change directory to apps\backend
  popd >nul
  exit /b 1
)

REM Check if virtual environment exists
if not exist ".venv" (
  echo Creating virtual environment...
  python -m venv .venv
)

REM Activate virtual environment
call .venv\Scripts\activate.bat

REM Install dependencies if needed



echo Installing dependencies...
pip install -r requirements.txt


REM Start the backend in a new window
echo Starting backend on http://localhost:8000
start "Create-Anything Backend" cmd /k python -m uvicorn main:app --reload

REM Return to script root
cd ..\.. || (
  echo Warning: failed to return to root from backend dir
)

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start frontend
echo Starting frontend...
cd apps\web

REM Install dependencies if needed
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)

REM Start the frontend in a new window
echo Starting frontend on http://localhost:3000
start "Create-Anything Frontend" cmd /k npm run dev

echo.
echo ================================================
echo.
echo   Services started! Opening in browser...
echo.
echo   Frontend: http://localhost:3000
echo   Backend: http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo   Close either terminal window to stop the service
echo.
echo ================================================
echo.

REM Return to script root (popd)
popd >nul

REM Open in browser
timeout /t 3 /nobreak
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
  start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" http://localhost:3000
) else if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
  start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" http://localhost:3000
) else (
  start http://localhost:3000
)
