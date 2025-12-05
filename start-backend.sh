#!/bin/bash

# Script để khởi động backend server
cd "$(dirname "$0")/apps/api"

echo "🚀 Starting backend server..."
echo "📁 Working directory: $(pwd)"
echo "🔧 Node version: $(node --version)"
echo "📦 NPM version: $(npm --version)"
echo ""

# Kiểm tra dependencies
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Khởi động server
echo "🌐 Starting server on port 3001..."
npm run dev

