@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting MARS - Multi-modal Aspect-based Review System
echo ==============================================

REM Check if we're in the right directory
if not exist "client" (
    echo ❌ Error: Please run this script from the MARS root directory
    pause
    exit /b 1
)
if not exist "server" (
    echo ❌ Error: Please run this script from the MARS root directory
    pause
    exit /b 1
)

echo 🔍 Checking prerequisites...

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16+
    pause
    exit /b 1
)

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

echo.
echo 🐍 Setting up backend...
cd server

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install Python dependencies
    pause
    exit /b 1
)

echo ✅ Backend setup complete

echo.
echo ⚛️ Setting up frontend...
cd ..\client

REM Install Node.js dependencies
echo Installing Node.js dependencies...
npm install
if errorlevel 1 (
    echo ❌ Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo ✅ Frontend setup complete

echo.
echo 🚀 Starting services...
echo Backend will start on: http://localhost:8000
echo Frontend will start on: http://localhost:5173
echo.
echo Press Ctrl+C to stop both services
echo.

REM Start backend
cd ..\server
call venv\Scripts\activate
start "MARS Backend" cmd /c "python main.py & pause"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
cd ..\client
start "MARS Frontend" cmd /c "npm run dev & pause"

echo ✅ Both services are starting!
echo 🌐 Open http://localhost:5173 in Google Chrome to use MARS
echo.
echo Both services are running in separate windows.
echo Close the command windows to stop the services.
echo.
pause