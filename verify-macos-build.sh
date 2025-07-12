#!/bin/bash

# ========================================
# macOS App Verification Script
# ========================================

echo "🔍 Verifying macOS App Installers"
echo "=================================="

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
}

info() {
    echo -e "💡 ${BLUE}$1${NC}"
}

warning() {
    echo -e "⚠️  ${YELLOW}$1${NC}"
}

# Check if release directory exists
if [ ! -d "release" ]; then
    error "Release directory not found. Please run the build script first."
    exit 1
fi

echo "📁 Checking release directory contents..."
ls -la release/

echo ""
echo "🔍 Verifying DMG files..."

# Check x64 DMG
X64_DMG="release/ZATCA Invoice Creator-1.0.0-x64.dmg"
if [ -f "$X64_DMG" ]; then
    SIZE_X64=$(ls -lh "$X64_DMG" | awk '{print $5}')
    success "Intel DMG found: $SIZE_X64"
    
    # Verify DMG integrity
    if hdiutil verify "$X64_DMG" >/dev/null 2>&1; then
        success "Intel DMG integrity verified"
    else
        warning "Intel DMG integrity check failed"
    fi
else
    error "Intel DMG not found"
fi

# Check ARM64 DMG
ARM64_DMG="release/ZATCA Invoice Creator-1.0.0-arm64.dmg"
if [ -f "$ARM64_DMG" ]; then
    SIZE_ARM64=$(ls -lh "$ARM64_DMG" | awk '{print $5}')
    success "Apple Silicon DMG found: $SIZE_ARM64"
    
    # Verify DMG integrity
    if hdiutil verify "$ARM64_DMG" >/dev/null 2>&1; then
        success "Apple Silicon DMG integrity verified"
    else
        warning "Apple Silicon DMG integrity check failed"
    fi
else
    error "Apple Silicon DMG not found"
fi

echo ""
echo "🔍 Verifying ZIP files..."

# Check x64 ZIP
X64_ZIP="release/ZATCA Invoice Creator-1.0.0-x64.zip"
if [ -f "$X64_ZIP" ]; then
    SIZE_X64_ZIP=$(ls -lh "$X64_ZIP" | awk '{print $5}')
    success "Intel ZIP found: $SIZE_X64_ZIP"
    
    # Test ZIP integrity
    if unzip -t "$X64_ZIP" >/dev/null 2>&1; then
        success "Intel ZIP integrity verified"
    else
        warning "Intel ZIP integrity check failed"
    fi
else
    error "Intel ZIP not found"
fi

# Check ARM64 ZIP
ARM64_ZIP="release/ZATCA Invoice Creator-1.0.0-arm64.zip"
if [ -f "$ARM64_ZIP" ]; then
    SIZE_ARM64_ZIP=$(ls -lh "$ARM64_ZIP" | awk '{print $5}')
    success "Apple Silicon ZIP found: $SIZE_ARM64_ZIP"
    
    # Test ZIP integrity
    if unzip -t "$ARM64_ZIP" >/dev/null 2>&1; then
        success "Apple Silicon ZIP integrity verified"
    else
        warning "Apple Silicon ZIP integrity check failed"
    fi
else
    error "Apple Silicon ZIP not found"
fi

echo ""
echo "🖥️  System Information:"
echo "   • Current macOS: $(sw_vers -productVersion)"
echo "   • Architecture: $(uname -m)"
echo "   • Node.js: $(node -v)"
echo "   • npm: $(npm -v)"

echo ""
echo "📋 Quick Installation Test:"
echo "1. To test Intel version:"
echo "   open '$X64_DMG'"
echo ""
echo "2. To test Apple Silicon version:"
echo "   open '$ARM64_DMG'"
echo ""

# Detect current system architecture and recommend appropriate version
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    info "Your Mac uses Apple Silicon - use the ARM64 version"
    echo "   Recommended: $ARM64_DMG"
elif [ "$ARCH" = "x86_64" ]; then
    info "Your Mac uses Intel processor - use the x64 version"
    echo "   Recommended: $X64_DMG"
fi

echo ""
success "App verification completed!"
echo ""
info "Both macOS installers are ready for distribution!"
