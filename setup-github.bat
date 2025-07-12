@echo off
REM 🚀 ZATCA Invoice Creator - GitHub Setup Script for Windows
REM This script helps you connect your local repository to GitHub

echo 🚀 ZATCA Invoice Creator - GitHub Repository Setup
echo ==================================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Error: This is not a git repository. Please run 'git init' first.
    pause
    exit /b 1
)

REM Check for uncommitted changes
git status --porcelain > nul 2>&1
if %errorlevel% equ 0 (
    for /f %%i in ('git status --porcelain') do (
        echo ⚠️  Warning: You have uncommitted changes. Please commit them first.
        git status --short
        pause
        exit /b 1
    )
)

echo ✅ Git repository is clean and ready
echo.

REM Get GitHub username and repository name
set /p github_username="GitHub Username: "
set /p repo_name="Repository Name (default: zatca-invoice-creator): "

REM Set default repository name if not provided
if "%repo_name%"=="" set repo_name=zatca-invoice-creator

echo.
echo 🔗 Repository URL will be: https://github.com/%github_username%/%repo_name%
echo.

REM Confirm before proceeding
set /p confirm="Continue with setup? (y/N): "
if /i not "%confirm%"=="y" (
    echo ❌ Setup cancelled
    pause
    exit /b 0
)

echo.
echo 🔧 Setting up GitHub repository...

REM Add remote origin
git remote add origin "https://github.com/%github_username%/%repo_name%.git"

REM Verify remote was added
git remote -v | findstr "origin" > nul
if %errorlevel% equ 0 (
    echo ✅ Remote origin added successfully
) else (
    echo ❌ Failed to add remote origin
    pause
    exit /b 1
)

echo.
echo 📤 Pushing to GitHub...

REM Push to GitHub
git push -u origin main --tags
if %errorlevel% equ 0 (
    echo.
    echo 🎉 SUCCESS! Repository has been pushed to GitHub
    echo.
    echo 📋 Next Steps:
    echo 1. Visit: https://github.com/%github_username%/%repo_name%
    echo 2. Check the GitHub Actions CI/CD pipeline
    echo 3. Review the README.md on GitHub
    echo 4. Follow the QA testing guide
    echo.
    echo 🚀 Your ZATCA Invoice Creator is now live on GitHub!
) else (
    echo.
    echo ❌ Failed to push to GitHub
    echo.
    echo 🔍 Possible solutions:
    echo 1. Make sure the repository exists on GitHub:
    echo    https://github.com/new
    echo 2. Check your GitHub authentication (token/SSH)
    echo 3. Verify the repository name and username
    echo.
    echo 💡 You can also push manually:
    echo    git push -u origin main --tags
)

echo.
echo 📚 Documentation available:
echo - README.md - Project overview
echo - DEPLOYMENT_GUIDE.md - Production deployment  
echo - QA_TESTING_GUIDE.md - Testing procedures
echo - NEXT_STEPS_GUIDE.md - Complete next steps
echo.
echo ✅ Setup complete!
pause
