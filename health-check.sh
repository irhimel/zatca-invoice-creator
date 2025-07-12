#!/bin/bash

# ========================================
# Application Health Check Script
# ========================================

echo "🔍 ZATCA Invoice Creator - Health Check"
echo "======================================"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
    echo -e "✅ ${GREEN}$1${NC}"
}

warning() {
    echo -e "⚠️  ${YELLOW}$1${NC}"
}

error() {
    echo -e "❌ ${RED}$1${NC}"
}

# Check Node.js
echo "Checking system requirements..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    success "Node.js: $NODE_VERSION"
else
    error "Node.js: Not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    success "npm: v$NPM_VERSION"
else
    error "npm: Not installed"
fi

echo ""
echo "Checking project files..."

# Check package.json
if [ -f "package.json" ]; then
    success "package.json: Found"
else
    error "package.json: Missing"
fi

# Check node_modules
if [ -d "node_modules" ]; then
    success "node_modules: Installed"
else
    warning "node_modules: Not installed (run: npm install)"
fi

# Check environment files
if [ -f ".env" ]; then
    success ".env: Configured"
else
    warning ".env: Not configured (copy from .env.example)"
fi

if [ -f ".env.example" ]; then
    success ".env.example: Found"
else
    error ".env.example: Missing"
fi

# Check configuration files
if [ -f "zatca-config.json" ]; then
    success "zatca-config.json: Found"
else
    warning "zatca-config.json: Missing"
fi

if [ -f "database-setup.sql" ]; then
    success "database-setup.sql: Found"
else
    warning "database-setup.sql: Missing"
fi

echo ""
echo "Checking build capability..."

# Check if build works
if [ -d "node_modules" ]; then
    echo "Testing build process..."
    if npm run build >/dev/null 2>&1; then
        success "Build: Working"
    else
        error "Build: Failed"
    fi
else
    warning "Build: Cannot test (dependencies not installed)"
fi

# Check Electron
echo ""
echo "Checking Electron setup..."

if [ -f "public/electron.js" ]; then
    success "Electron main: Found"
else
    error "Electron main: Missing"
fi

if [ -f "public/preload.js" ]; then
    success "Electron preload: Found"
else
    error "Electron preload: Missing"
fi

echo ""
echo "📊 Health Check Summary"
echo "======================="

if [ -f ".env" ] && [ -d "node_modules" ] && [ -f "public/electron.js" ]; then
    success "Application: Ready to use! 🎉"
    echo ""
    echo "Quick start commands:"
    echo "  Development: ./dev-start.sh"
    echo "  Production:  ./build-production.sh"
else
    warning "Application: Needs setup"
    echo ""
    echo "Run setup script: ./setup.sh"
fi

echo ""
