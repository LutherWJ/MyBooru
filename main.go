package main // mango 🥭

import (
	"embed"
	"log"
	"mybooru/internal/fileops"
	"mybooru/internal/models"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"

	"mybooru/internal/app"
	"mybooru/internal/database"
	"mybooru/internal/server"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	paths, err := fileops.InitPaths()
	if err != nil {
		log.Fatal("Failed to initialize paths:", err)
	}

	config, err := models.LoadConfig(paths.Config)
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}
	db, err := database.InitDB(paths.DB)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	srv := server.NewServer(db, config, &paths)

	application := app.NewApp(db, paths, config, srv)

	err = wails.Run(&options.App{
		Title:  "MyBooru",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 30, G: 30, B: 44, A: 1},
		OnStartup:        application.Startup,
		OnShutdown:       application.Shutdown,
		Bind: []any{
			application,
		},
	})

	if err != nil {
		log.Fatal("Error running application:", err)
	}
}
