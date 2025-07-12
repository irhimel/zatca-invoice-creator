#!/bin/bash

# ========================================
# macOS App Builder Script
# ========================================

echo "🍎 Building macOS App for ZATCA Invoice Creator"
echo "=============================================="

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

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    error "This script must be run on macOS to build macOS applications"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js 18+ first."
fi

success "Node.js $(node -v) detected on macOS"

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

# Build macOS app
echo "🍎 Building macOS .dmg installer..."
npm run dist:mac || error "macOS build failed"

success "macOS app built successfully"

# Display build results
echo ""
echo "🎉 macOS .dmg installer created successfully!"
echo ""

if [ -d "release" ]; then
    echo "📁 Installer files created in release/ directory:"
    ls -la release/*.dmg 2>/dev/null || echo "No .dmg files found"
    ls -la release/*.zip 2>/dev/null || echo "No .zip files found"
    echo ""
    
    # Find the main installer
    DMG_INSTALLER=$(find release -name "*.dmg" | head -1)
    if [ -n "$DMG_INSTALLER" ]; then
        echo "📦 Main installer: $DMG_INSTALLER"
        echo "📏 Size: $(ls -lh "$DMG_INSTALLER" | awk '{print $5}')"
        
        # Check architecture
        if [[ "$DMG_INSTALLER" == *"arm64"* ]]; then
            info "Apple Silicon (M1/M2) version"
        elif [[ "$DMG_INSTALLER" == *"x64"* ]]; then
            info "Intel version"
        else
            info "Universal version"
        fi
    fi
    
    ZIP_FILE=$(find release -name "*.zip" | head -1)
    if [ -n "$ZIP_FILE" ]; then
        echo "📦 Zip archive: $ZIP_FILE"
        echo "📏 Size: $(ls -lh "$ZIP_FILE" | awk '{print $5}')"
    fi
fi

echo ""
info "Installation instructions:"
echo "1. Double-click the .dmg file to mount it"
echo "2. Drag 'ZATCA Invoice Creator.app' to the Applications folder"
echo "3. Launch from Applications or Spotlight search"
echo "4. If macOS shows security warning, go to System Preferences > Security & Privacy > General"
echo "5. Click 'Open Anyway' to allow the app to run"
echo ""
success "The macOS app is ready for distribution!"
echo ""

# Show system compatibility
echo "🖥️  System Compatibility:"
echo "   • macOS 10.15 (Catalina) or later"
echo "   • Intel Macs: x64 version"
echo "   • Apple Silicon Macs: arm64 version"
echo "   • Memory: 4GB RAM minimum, 8GB recommended"
echo "   • Storage: 500MB available space"
echo ""
