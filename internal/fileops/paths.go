package fileops

import (
	"fmt"
	"os"
	"path/filepath"
)

// GetAppDir returns the application data directory (~/.mybooru)
func GetAppDir() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get home directory: %w", err)
	}
	return filepath.Join(homeDir, ".mybooru"), nil
}

// GetMediaFilePath returns the full path for a media file
// Files are organized by MD5 hash prefix: ~/.mybooru/media/{hash[:2]}/{hash}.{ext}
func (paths *AppPaths) GetMediaFilePath(md5Hash, extension string) (string, error) {
	if len(md5Hash) < 2 {
		return "", fmt.Errorf("invalid MD5 hash: %s", md5Hash)
	}

	hashPrefix := md5Hash[:2]
	dirPath := filepath.Join(paths.MediaDir, hashPrefix)

	return filepath.Join(dirPath, fmt.Sprintf("%s.%s", md5Hash, extension)), nil
}

// GetThumbnailPath returns the path for a thumbnail
// Thumbnails are organized: ~/.mybooru/cache/thumbnails/{size}/{hash[:2]}/{hash}.jpg
func (paths *AppPaths) GetThumbnailPath(md5Hash string, size int) (string, error) {
	if len(md5Hash) < 2 {
		return "", fmt.Errorf("invalid MD5 hash: %s", md5Hash)
	}

	hashPrefix := md5Hash[:2]
	dirPath := filepath.Join(paths.ThumbnailDir, hashPrefix)

	return filepath.Join(dirPath, fmt.Sprintf("%s.jpg", md5Hash)), nil
}

type AppPaths struct {
	AppDir       string
	MediaDir     string
	ThumbnailDir string
	CacheDir     string
	TempDir      string
	FFmpeg       string
	FFprobe      string
	DB           string
	Config       string
}

func InitPaths() (AppPaths, error) {
	appDir, err := GetAppDir()
	if err != nil {
		return AppPaths{}, err
	}

	binDir := filepath.Join(appDir, "bin")

	paths := AppPaths{
		AppDir:       appDir,
		MediaDir:     filepath.Join(appDir, "media"),
		ThumbnailDir: filepath.Join(appDir, "thumbnail"),
		CacheDir:     filepath.Join(appDir, "cache"),
		TempDir:      filepath.Join(appDir, "tmp"),
		FFmpeg:       filepath.Join(binDir, "ffmpeg"),
		FFprobe:      filepath.Join(binDir, "ffprobe"),
		DB:           filepath.Join(appDir, "data.db"),
		Config:       filepath.Join(appDir, "config.json"),
	}

	// Ensure directories exist
	dirs := []string{
		paths.AppDir,
		paths.MediaDir,
		paths.ThumbnailDir,
		paths.CacheDir,
		paths.TempDir,
		binDir,
	}

	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return AppPaths{}, err
		}
	}

	return paths, nil
}
