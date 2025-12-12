#!/bin/bash
set -e

echo "🚀 Setting up MyBooru Wails project..."

# Check for Go
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed or not in PATH"
    echo "   Install Go and add to PATH, then re-run this script"
    exit 1
fi

# Check for wails
if ! command -v wails &> /dev/null; then
    echo "❌ Wails CLI not found"
    echo "   Run: go install github.com/wailsapp/wails/v2/cmd/wails@latest"
    exit 1
fi

# Check for ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  FFmpeg not found - media upload will not work"
    echo "   Install with: sudo apt install ffmpeg"
fi

# Download Go dependencies
echo "📦 Downloading Go dependencies..."
go mod tidy

# Check if frontend exists
if [ ! -d "frontend/src" ]; then
    echo "⚠️  Frontend not found"
    echo "   Next step: Copy Vue app from Electron version"
    echo "   Run: cp -r ../MyBooru/src/renderer/* frontend/src/"
else
    echo "✅ Frontend directory exists"

    # Install frontend dependencies if package.json exists
    if [ -f "frontend/package.json" ]; then
        echo "📦 Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. If frontend not copied yet:"
echo "   cp -r ../MyBooru/src/renderer/* frontend/src/"
echo ""
echo "2. Update frontend API calls (see MIGRATION.md)"
echo ""
echo "3. Run development server:"
echo "   wails dev"
echo ""
echo "4. Build for production:"
echo "   wails build"
