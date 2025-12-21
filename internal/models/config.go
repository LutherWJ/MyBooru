package models

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Config struct {
	AppDir         string `json:"app_dir"`   // Base: ~/.mybooru
	MediaDir       string `json:"media_dir"` // Base: ~/.mybooru/media
	CacheDir       string `json:"cache_dir"` // Base: ~/.mybooru/cache
	TempDir        string `json:"temp_dir"`  // Base: ~/.mybooru/tmp
	Port           int    `json:"port"`
	ThumbnailSizes []int  `json:"thumbnail_sizes"`
}

func DefaultConfig() (*Config, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	appDir := filepath.Join(homeDir, ".mybooru")

	return &Config{
		AppDir:         appDir,
		MediaDir:       filepath.Join(appDir, "media"),
		CacheDir:       filepath.Join(appDir, "cache"),
		TempDir:        filepath.Join(appDir, "tmp"),
		ThumbnailSizes: []int{256, 512},
	}, nil
}

func LoadConfig(path string) (*Config, error) {
	// Try to load existing config
	data, err := os.ReadFile(path)
	if err != nil {
		config, err := DefaultConfig()
		if err != nil {
			return nil, err
		}

		config.Save(path)
		return config, nil
	}

	var config Config
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, err
	}

	return &config, nil
}

func (c *Config) Save(path string) error {
	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return err
	}

	os.MkdirAll(filepath.Dir(path), 0755)
	return os.WriteFile(path, data, 0644)
}
