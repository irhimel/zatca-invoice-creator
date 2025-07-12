@echo off
REM ========================================
REM Development Startup Script
REM ========================================

echo 🚀 Starting ZATCA Invoice Creator in Development Mode
echo ====================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please run setup.bat first.
    pause
    exit /b 1
)

REM Start Vite development server in background
echo 📦 Starting Vite development server...
start /B npm run dev

REM Wait for Vite to start
echo ⏳ Waiting for Vite server to be ready...
timeout /t 5 /nobreak >nul

echo ✅ Vite development server running on http://localhost:5173

REM Start Electron app
echo 🖥️  Starting Electron application...
echo.
echo 🎉 Development environment ready!
echo.
echo 💡 Tips:
echo - The app will automatically reload when you make changes
echo - Open DevTools in Electron for debugging
echo - Close this window to stop the development server
echo.

call npm run electron-dev

echo.
echo 🛑 Electron app closed. Development session ended.
pause
