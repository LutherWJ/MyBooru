#!/bin/bash
set -e

# FFmpeg static build for Linux (amd64) from John Van Sickle
# https://johnvansickle.com/ffmpeg/

INSTALL_DIR="$HOME/.mybooru/bin"
echo "Target directory: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
OUTPUT_FILE="ffmpeg-release-amd64-static.tar.xz"

echo "Downloading FFmpeg for Linux (amd64)..."
curl -L -o "$OUTPUT_FILE" "$URL"

echo "Extracting..."
tar -xf "$OUTPUT_FILE"

echo "Locating binaries..."
# Find the directory starting with ffmpeg- and ending with -static
EXTRACTED_DIR=$(find . -maxdepth 1 -type d -name "ffmpeg-*-static" | head -n 1)

if [ -d "$EXTRACTED_DIR" ]; then
    echo "Found extracted directory: $EXTRACTED_DIR"
    
    echo "Installing to $INSTALL_DIR..."
    mv -f "$EXTRACTED_DIR/ffmpeg" "$INSTALL_DIR/"
    mv -f "$EXTRACTED_DIR/ffprobe" "$INSTALL_DIR/"
    
    echo "Done. 'ffmpeg' and 'ffprobe' are installed in $INSTALL_DIR"
    
    # Cleanup
    rm "$OUTPUT_FILE"
    rm -rf "$EXTRACTED_DIR"
else
    echo "Error: Could not find extracted directory."
    exit 1
fi