@echo off
REM ========================================
REM Production Build Script
REM ========================================

echo 🏗️  Building ZATCA Invoice Creator for Production
echo =================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please run setup.bat first.
    pause
    exit /b 1
)

REM Clean previous builds
echo 🧹 Cleaning previous builds...
if exist "dist" rmdir /s /q dist
if exist "release" rmdir /s /q release

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
)

REM Build the web application
echo 🔧 Building web application...
call npm run build

if errorlevel 1 (
    echo ❌ Web build failed
    pause
    exit /b 1
)

echo ✅ Web application built successfully

REM Build Electron distributables
echo 📦 Building Electron distributables...
call npm run dist

if errorlevel 1 (
    echo ❌ Electron build failed
    pause
    exit /b 1
)

echo ✅ Electron distributables built successfully

REM Display build results
echo.
echo 🎉 Build completed successfully!
echo.

if exist "release" (
    echo 📁 Distributables created in release\ directory:
    dir release
    echo.
)

echo 💡 Installation files are ready for distribution!
echo.
pause
