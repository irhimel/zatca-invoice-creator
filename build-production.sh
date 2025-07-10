#!/bin/bash

# ========================================
# Production Build Script
# ========================================

echo "🏗️  Building ZATCA Invoice Creator for Production"
echo "================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please run setup.sh first."
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist release

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the web application
echo "🔧 Building web application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Web build failed"
    exit 1
fi

echo "✅ Web application built successfully"

# Build Electron distributables
echo "📦 Building Electron distributables..."
npm run dist

if [ $? -ne 0 ]; then
    echo "❌ Electron build failed"
    exit 1
fi

echo "✅ Electron distributables built successfully"

# Display build results
echo ""
echo "🎉 Build completed successfully!"
echo ""

if [ -d "release" ]; then
    echo "📁 Distributables created in release/ directory:"
    ls -la release/
    echo ""
fi

echo "💡 Installation files are ready for distribution!"
echo ""
