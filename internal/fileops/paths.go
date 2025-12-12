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

// GetMediaDir returns the media storage directory
func GetMediaDir() (string, error) {
	appDir, err := GetAppDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(appDir, "media"), nil
}

// GetCacheDir returns the cache directory
func GetCacheDir() (string, error) {
	appDir, err := GetAppDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(appDir, "cache"), nil
}

// GetThumbnailDir returns the thumbnail cache directory
func GetThumbnailDir(size int) (string, error) {
	cacheDir, err := GetCacheDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(cacheDir, "thumbnails", fmt.Sprintf("%d", size)), nil
}

// GetMediaFilePath returns the full path for a media file
// Files are organized by MD5 hash prefix: ~/.mybooru/media/{hash[:2]}/{hash}.{ext}
func GetMediaFilePath(md5Hash, extension string) (string, error) {
	if len(md5Hash) < 2 {
		return "", fmt.Errorf("invalid MD5 hash: %s", md5Hash)
	}

	mediaDir, err := GetMediaDir()
	if err != nil {
		return "", err
	}

	hashPrefix := md5Hash[:2]
	dirPath := filepath.Join(mediaDir, hashPrefix)

	return filepath.Join(dirPath, fmt.Sprintf("%s.%s", md5Hash, extension)), nil
}

// GetThumbnailPath returns the path for a thumbnail
// Thumbnails are organized: ~/.mybooru/cache/thumbnails/{size}/{hash[:2]}/{hash}.jpg
func GetThumbnailPath(md5Hash string, size int) (string, error) {
	if len(md5Hash) < 2 {
		return "", fmt.Errorf("invalid MD5 hash: %s", md5Hash)
	}

	thumbDir, err := GetThumbnailDir(size)
	if err != nil {
		return "", err
	}

	hashPrefix := md5Hash[:2]
	dirPath := filepath.Join(thumbDir, hashPrefix)

	return filepath.Join(dirPath, fmt.Sprintf("%s.jpg", md5Hash)), nil
}

// EnsureDirectoryExists creates a directory if it doesn't exist
func EnsureDirectoryExists(path string) error {
	return os.MkdirAll(path, 0755)
}
