#!/bin/bash

# Railway start script for Content Multiplier

echo "Starting Content Multiplier..."

# Install dependencies if needed
if [ ! -d "apps/api/node_modules" ]; then
    echo "Installing API dependencies..."
    cd apps/api && npm install
    cd ../..
fi

# Start the API server
echo "Starting API server..."
cd apps/api
npm start