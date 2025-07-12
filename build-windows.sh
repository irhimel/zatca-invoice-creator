#!/bin/bash

# ========================================
# Windows EXE Builder Script (Cross-platform)
# ========================================

echo "🏗️  Building Windows .exe installer for ZATCA Invoice Creator"
echo "========================================================"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

success() {
    echo -e "✅ ${GREEN}$1${NC}"
}

error() {
    echo -e "❌ ${RED}$1${NC}"
    exit 1
}

info() {
    echo -e "💡 ${BLUE}$1${NC}"
}

warning() {
    echo -e "⚠️  ${YELLOW}$1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js 18+ first."
fi

success "Node.js $(node -v) detected"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install || error "Failed to install dependencies"
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist release

# Build the web application
echo "🔧 Building web application..."
npm run build || error "Web build failed"

success "Web application built successfully"

# Build Windows installer
echo "📦 Building Windows .exe installer..."
npm run dist:win || error "Windows build failed"

success "Windows installer built successfully"

# Display build results
echo ""
echo "🎉 Windows .exe installer created successfully!"
echo ""

if [ -d "release" ]; then
    echo "📁 Installer files created in release/ directory:"
    ls -la release/*.exe 2>/dev/null || echo "No .exe files found"
    echo ""
    
    # Find the main installer
    INSTALLER=$(find release -name "*Setup*.exe" | head -1)
    if [ -n "$INSTALLER" ]; then
        echo "📦 Main installer: $INSTALLER"
        echo "📏 Size: $(ls -lh "$INSTALLER" | awk '{print $5}')"
    fi
fi

echo ""
info "Installation instructions:"
echo "1. Copy the installer file to a Windows computer"
echo "2. Right-click and 'Run as administrator' (recommended)"
echo "3. Follow the installation wizard"
echo "4. The app will be installed and ready to use"
echo ""
success "The installer includes everything needed to run the app!"
echo ""
