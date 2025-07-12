#!/bin/bash

# ========================================
# Development Startup Script
# ========================================

echo "🚀 Starting ZATCA Invoice Creator in Development Mode"
echo "===================================================="

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    kill $VITE_PID 2>/dev/null
    kill $ELECTRON_PID 2>/dev/null
    exit 0
}

# Set up trap to call cleanup function on script exit
trap cleanup SIGINT SIGTERM

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please run setup.sh first."
    exit 1
fi

# Start Vite development server in background
echo "📦 Starting Vite development server..."
npm run dev &
VITE_PID=$!

# Wait for Vite to start
echo "⏳ Waiting for Vite server to be ready..."
sleep 5

# Check if Vite is running
if ! kill -0 $VITE_PID 2>/dev/null; then
    echo "❌ Failed to start Vite development server"
    exit 1
fi

echo "✅ Vite development server running on http://localhost:5173"

# Start Electron app
echo "🖥️  Starting Electron application..."
npm run electron-dev &
ELECTRON_PID=$!

echo ""
echo "🎉 Development environment ready!"
echo ""
echo "💡 Tips:"
echo "- The app will automatically reload when you make changes"
echo "- Open DevTools in Electron for debugging"
echo "- Press Ctrl+C to stop both servers"
echo ""

# Wait for Electron process to finish
wait $ELECTRON_PID

# Clean up Vite server
cleanup
