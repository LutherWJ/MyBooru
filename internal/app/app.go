package app

import (
	"context"
	"fmt"

	"mybooru/internal/database"
	"mybooru/internal/fileops"
	"mybooru/internal/models"
)

type App struct {
	ctx context.Context
	db  *database.DB
}

func NewApp(db *database.DB) *App {
	return &App{
		db: db,
	}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) Shutdown(ctx context.Context) {
	if err := a.db.Close(); err != nil {
		fmt.Printf("Error closing database: %v\n", err)
	}
}

// StartUpload begins a new file upload session
func (a *App) StartUpload(totalSize int64) (string, error) {
	return fileops.StartUpload(totalSize)
}

// UploadChunk writes a chunk of data to an upload session
func (a *App) UploadChunk(sessionID string, data []byte) error {
	return fileops.UploadChunk(sessionID, data)
}

// FinalizeUpload completes the upload and creates the media record
func (a *App) FinalizeUpload(sessionID string, tags string) (int64, error) {
	return fileops.FinalizeUpload(a.db, sessionID, tags)
}

// GetMediaByID retrieves a single media item by ID
func (a *App) GetMediaByID(id int64) (*models.Media, error) {
	return a.db.GetMediaByID(id)
}
