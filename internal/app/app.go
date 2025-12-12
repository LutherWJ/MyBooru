package app

import (
	"context"
	"mybooru/internal/database"
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
