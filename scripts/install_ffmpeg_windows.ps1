# FFmpeg builds for Windows from Gyan.dev
# https://www.gyan.dev/ffmpeg/builds/

$ErrorActionPreference = "Stop"

$InstallDir = Join-Path $env:USERPROFILE ".mybooru\bin"
Write-Host "Target directory: $InstallDir"

if (-not (Test-Path -Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir | Out-Null
}

$Url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$ZipFile = "ffmpeg-release-essentials.zip"

Write-Host "Downloading FFmpeg for Windows..."
Invoke-WebRequest -Uri $Url -OutFile $ZipFile

Write-Host "Extracting..."
Expand-Archive -Path $ZipFile -DestinationPath . -Force

Write-Host "Locating binaries..."
$ExtractedDir = Get-ChildItem -Directory -Filter "ffmpeg-*-essentials_build" | Select-Object -First 1

if ($ExtractedDir) {
    $BinDir = Join-Path $ExtractedDir.FullName "bin"
    
    Write-Host "Installing to $InstallDir..."
    Copy-Item -Path (Join-Path $BinDir "ffmpeg.exe") -Destination $InstallDir -Force
    Copy-Item -Path (Join-Path $BinDir "ffprobe.exe") -Destination $InstallDir -Force
    
    Write-Host "Done. 'ffmpeg.exe' and 'ffprobe.exe' are installed in $InstallDir"
    
    # Cleanup
    Remove-Item $ZipFile
    Remove-Item $ExtractedDir.FullName -Recurse -Force
} else {
    Write-Error "Could not find extracted directory."
}