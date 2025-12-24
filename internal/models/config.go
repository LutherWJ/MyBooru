package models

import (
	"encoding/json"
	"fmt"
	"os"
)

var (
	ErrInvalidPort      = fmt.Errorf("invalid port number provided")
	ErrInvalidThumbSize = fmt.Errorf("invalid thumbnail size provided")
)

type Config struct {
	AppDir        string `json:"app_dir"`
	Port          int    `json:"port"`
	ThumbnailSize int    `json:"thumbnail_sizes"`
}

func DefaultConfig() *Config {
	return &Config{
		Port:          2234,
		ThumbnailSize: 256,
	}
}

func LoadConfig(path string) (*Config, error) {
	// Try to load existing config
	data, err := os.ReadFile(path)
	if err != nil {
		config := DefaultConfig()
		config.Save(path)
		return config, nil
	}

	var config Config
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, err
	}

	return &config, nil
}

func (c *Config) ModifyConfig(newConfig *Config, configPath string) error {
	if newConfig.Port < 0 && 65536 < newConfig.Port {
		return ErrInvalidPort
	}
	if c.ThumbnailSize < 0 {
		return ErrInvalidThumbSize
	}
	c.Port = newConfig.Port
	c.ThumbnailSize = newConfig.ThumbnailSize
	return c.Save(configPath)
}

func (c *Config) Save(path string) error {
	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}
