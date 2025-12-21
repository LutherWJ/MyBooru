#!/bin/bash
set -e

# FFmpeg builds for macOS from Evermeet.cx
# https://evermeet.cx/ffmpeg/

INSTALL_DIR="$HOME/.mybooru/bin"
echo "Target directory: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

echo "Downloading FFmpeg for macOS..."
curl -L -o ffmpeg.zip "https://evermeet.cx/ffmpeg/getrelease/zip"
curl -L -o ffprobe.zip "https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip"

echo "Extracting..."
unzip -o ffmpeg.zip
unzip -o ffprobe.zip

echo "Installing to $INSTALL_DIR..."
mv -f ffmpeg "$INSTALL_DIR/"
mv -f ffprobe "$INSTALL_DIR/"

echo "Cleaning up..."
rm ffmpeg.zip ffprobe.zip

echo "Done. 'ffmpeg' and 'ffprobe' are installed in $INSTALL_DIR"