@echo off
REM ========================================
REM Windows EXE Builder Script
REM ========================================

echo 🏗️  Building Windows .exe installer for ZATCA Invoice Creator
echo ========================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo Visit: https://nodejs.org/en/download/
    pause
    exit /b 1
)

echo ✅ Node.js %node --version% detected

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Clean previous builds
echo 🧹 Cleaning previous builds...
if exist "dist" rmdir /s /q dist
if exist "release" rmdir /s /q release

REM Build the web application
echo 🔧 Building web application...
call npm run build

if errorlevel 1 (
    echo ❌ Web build failed
    pause
    exit /b 1
)

echo ✅ Web application built successfully

REM Build Windows installer
echo 📦 Building Windows .exe installer...
call npm run dist:win

if errorlevel 1 (
    echo ❌ Windows build failed
    pause
    exit /b 1
)

echo ✅ Windows installer built successfully

REM Display build results
echo.
echo 🎉 Windows .exe installer created successfully!
echo.

if exist "release" (
    echo 📁 Installer files created in release\ directory:
    dir release\*.exe
    echo.
    
    REM Find the main installer
    for %%f in (release\*Setup*.exe) do (
        echo 📦 Main installer: %%f
        echo 📏 Size: 
        for %%a in ("%%f") do echo    %%~za bytes
    )
)

echo.
echo 💡 Installation instructions:
echo 1. Copy the installer file to a Windows computer
echo 2. Right-click and "Run as administrator" (recommended)
echo 3. Follow the installation wizard
echo 4. The app will be installed and ready to use
echo.
echo 🚀 The installer includes everything needed to run the app!
echo.
pause
