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

func (a *App) GetConfig() (*models.Config, error) {
	return a.config, nil
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

// StartUpload begins a new file upload session
func (a *App) StartUpload(totalSize int64) (string, error) {
	return a.paths.StartUpload(totalSize)
}

// UploadChunk writes a chunk of data to an upload session
func (a *App) UploadChunk(sessionID string, base64Data string) error {
	return a.paths.UploadChunk(sessionID, base64Data)
}

// FinalizeUpload completes the upload and creates the media record
func (a *App) FinalizeUpload(sessionID string, tags string) (int64, error) {
	return a.paths.FinalizeUpload(a.db, sessionID, tags)
}

// GetMediaByID retrieves a single media item by ID
func (a *App) GetMediaByID(id int64) (*models.Media, error) {
	return a.db.GetMediaByID(id)
}

func (a *App) SearchMedia(searchString string, limit int, offset int, beforeID *int64, afterID *int64) (*models.SearchResult, error) {
	query := search.ParseQuery(searchString)
	query.Limit = limit
	query.Offset = offset
	query.BeforeID = beforeID
	query.AfterID = afterID
	return a.db.GetMediaBySearch(query)
}
