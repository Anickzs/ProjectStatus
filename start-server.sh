#!/bin/bash

# Start the ProjectStatus web server
# Usage: ./start-server.sh [port]

PORT=${1:-8000}

echo "🚀 Starting ProjectStatus web server..."
echo "📁 Changing to web-app directory..."
cd web-app

echo "🌐 Starting server on port $PORT..."
echo "📱 Open your browser to: http://localhost:$PORT"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

python3 server.py $PORT
