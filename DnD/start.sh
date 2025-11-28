#!/bin/bash
echo "Starting D&D Web App..."

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run the development server
echo "Launching Vite Server..."
npm run dev -- --host
