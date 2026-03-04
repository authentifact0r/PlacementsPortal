#!/bin/bash

# PlacementsPortal - Start All Servers
# Run both web app and Reed API proxy

echo "🚀 Starting PlacementsPortal Servers..."
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js and npm first."
    exit 1
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ node not found. Please install Node.js first."
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $WEB_PID $PROXY_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

trap cleanup INT TERM

# Start Reed API Proxy (port 3001)
echo "📡 Starting Reed API Proxy on port 3001..."
node reed-proxy-server.js > /dev/null 2>&1 &
PROXY_PID=$!
sleep 2

# Check if proxy started successfully
if ! lsof -ti:3001 > /dev/null 2>&1; then
    echo "❌ Failed to start Reed API proxy"
    exit 1
fi
echo "✅ Reed API Proxy running (PID: $PROXY_PID)"

# Start Web App (port 3000)
echo "🌐 Starting Web App on port 3000..."
echo "   (This may take 30-60 seconds to compile...)"
npm start > /dev/null 2>&1 &
WEB_PID=$!

# Wait for web app to start
echo "⏳ Waiting for web app to compile..."
sleep 10

# Check if web app started successfully
if ! lsof -ti:3000 > /dev/null 2>&1; then
    echo "❌ Failed to start web app"
    kill $PROXY_PID 2>/dev/null
    exit 1
fi
echo "✅ Web App running (PID: $WEB_PID)"

echo ""
echo "🎉 All servers started successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📱 Web App:        http://localhost:3000"
echo "  📡 Reed API Proxy: http://localhost:3001"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Keep script running
wait
