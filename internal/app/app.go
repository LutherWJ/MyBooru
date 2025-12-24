package app

import (
	"context"
	"log"

	"mybooru/internal/database"
	"mybooru/internal/fileops"
	"mybooru/internal/models"
	"mybooru/internal/search"
	"mybooru/internal/server"
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
	query := search.ParseQuery(searchString)
	query.Limit = limit
	query.Offset = offset
	query.BeforeID = beforeID
	query.AfterID = afterID
	return a.db.GetMediaBySearch(query)
}
