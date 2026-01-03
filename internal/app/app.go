package app

import (
	"context"
	"log"

	"mybooru/internal/database"
	"mybooru/internal/fileops"
	"mybooru/internal/models"
	"mybooru/internal/server"
	"mybooru/internal/ui"
)

type App struct {
	ctx    context.Context
	paths  fileops.AppPaths
	config *models.Config
	db     *database.DB
	server *server.Server
}

func NewApp(db *database.DB, paths fileops.AppPaths, config *models.Config, server *server.Server) *App {
	return &App{
		paths:  paths,
		config: config,
		db:     db,
		server: server,
	}
}

func (a *App) GetConfig() *models.Config {
	return a.config
}

func (a *App) UpdateConfig(config *models.Config) error {
	return a.config.ModifyConfig(config, a.paths.Config)
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	if err := a.server.Start(); err != nil {
		log.Printf("Failed to start HTTP server: %v", err)
	}
}

func (a *App) Shutdown(ctx context.Context) {
	if err := a.server.Stop(); err != nil {
		log.Printf("Failed to stop HTTP server: %v", err)
	}
	a.paths.CleanupUploadSessions()
	_ = a.db.Vacuum()
	_ = a.db.Close()
	a.ctx = nil
}

// GetMediaByID retrieves a single media item by ID
func (a *App) GetMediaByID(id int64) (*models.Media, error) {
	return a.db.GetMediaByID(id)
}

// GetTagsByMediaID retrieves tags for a media item
func (a *App) GetTagsByMediaID(mediaID int64) ([]*models.Tag, error) {
	return a.db.GetTagsByMediaID(mediaID)
}

func (a *App) GetApiPort() int {
	return a.server.GetPort()
}

func (a *App) SearchMedia(searchString string, limit int, offset int, beforeID *int64, afterID *int64) (*models.SearchResult, error) {
	query := ui.ParseQuery(searchString)
	query.Limit = limit
	query.Offset = offset
	query.BeforeID = beforeID
	query.AfterID = afterID
	return a.db.GetMediaBySearch(query)
}

func (a *App) UpdateMediaTags(mediaID int64, tagString string) error {
	newTags, err := ui.ParseTags(tagString)
	if err != nil {
		return err
	}

	oldTags, err := a.db.GetTagsByMediaID(mediaID)
	if err != nil {
		return err
	}

	// Create map of new tags for O(1) lookup
	newTagMap := make(map[string]bool)
	for _, t := range newTags {
		newTagMap[t.Name] = true
	}

	// Create map of old tags
	oldTagMap := make(map[string]int64)
	for _, t := range oldTags {
		oldTagMap[t.Name] = t.ID
	}

	// Tags to add
	var toAdd []models.CreateTagInput
	for _, t := range newTags {
		if _, exists := oldTagMap[t.Name]; !exists {
			toAdd = append(toAdd, t)
		}
	}

	// Tags to remove
	var toRemove []int64
	for _, t := range oldTags {
		if !newTagMap[t.Name] {
			toRemove = append(toRemove, t.ID)
		}
	}

	if len(toAdd) > 0 {
		if err := a.db.AddTagsToMediaTx(mediaID, toAdd); err != nil {
			return err
		}
	}

	for _, tagID := range toRemove {
		if err := a.db.RemoveTagFromMedia(mediaID, tagID); err != nil {
			return err
		}
	}

	return nil
}
