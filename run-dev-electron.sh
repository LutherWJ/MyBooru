#!/bin/bash
# Wait for Vite to be ready and capture the port
wait-on http://localhost:5173 http://localhost:5174 http://localhost:5175 -t 30000 2>/dev/null

# Find which port Vite is using
for port in 5173 5174 5175 5176; do
  if curl -s http://localhost:$port > /dev/null 2>&1; then
    export VITE_DEV_SERVER_URL="http://localhost:$port"
    echo "Vite dev server found at $VITE_DEV_SERVER_URL"
    break
  fi
done

# Build and run Electron
node build-nocheck.js && electron .
