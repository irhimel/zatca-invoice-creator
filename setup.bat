@echo off
REM ========================================
REM ZATCA Invoice Creator App Setup Script
REM ========================================

echo 🚀 Setting up ZATCA Invoice Creator App...
echo ========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo Visit: https://nodejs.org/en/download/
    pause
    exit /b 1
)

echo ✅ Node.js %node --version% detected

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Copy environment file if it doesn't exist
if not exist ".env" (
    echo.
    echo 📋 Creating environment configuration...
    copy .env.example .env
    echo ✅ Created .env file from template
    echo ⚠️  Please edit .env file with your actual business information
) else (
    echo ⚠️  .env file already exists - skipping copy
)

REM Create dist directory if it doesn't exist
if not exist "dist" mkdir dist

echo.
echo 🔧 Testing build process...
call npm run build

if errorlevel 1 (
    echo ❌ Build failed. Please check for errors above.
    pause
    exit /b 1
)

echo ✅ Build completed successfully

echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Edit .env file with your business information
echo 2. Set up Azure SQL Database using database-setup.sql
echo 3. Configure ZATCA credentials in zatca-config.json
echo 4. Run development server: npm run dev
echo 5. Build Electron app: npm run electron-dev
echo.
echo For detailed setup instructions, see SETUP_GUIDE.md
echo.
pause
