# MyBooru - Wails Version

A personal media gallery application built with Go (Wails) and Vue 3.

## Migration from Electron

This is a port of MyBooru from Electron to Wails, maintaining the same database schema and core functionality while leveraging Go's performance and smaller binary size.

## Tech Stack

**Backend:**
- Go 1.23
- Wails v2 (desktop framework)
- SQLite with mattn/go-sqlite3
- FFmpeg/FFprobe for media processing

**Frontend:**
- Vue 3 + Composition API
- Pinia for state management
- Vue Router 4
- Tailwind CSS 4

## Prerequisites

- Go 1.23 or later
- Node.js 18+ (for frontend build)
- FFmpeg and FFprobe (for media processing)
- Linux: `build-essential libgtk-3-dev libwebkit2gtk-4.1-dev`

### Installing Prerequisites on Linux Mint

```bash
# Install system dependencies
sudo apt install build-essential libgtk-3-dev libwebkit2gtk-4.1-dev ffmpeg
```

## Project Structure

```
MyBooru-Wails/
├── main.go                 # Application entry point
├── go.mod                  # Go dependencies
├── wails.json              # Wails configuration
├── internal/
│   ├── app/                # Wails app bindings (replaces Electron IPC)
│   │   └── app.go          # API methods exposed to frontend
│   ├── database/           # Database layer
│   │   ├── database.go     # DB initialization and setup
│   │   ├── schema.go       # SQL schema definitions
│   │   ├── media.go        # Media CRUD operations
│   │   └── tags.go         # Tag operations
│   ├── models/             # Data models and types
│   │   └── types.go        # Structs matching database schema
│   └── fileops/            # File operations
│       ├── paths.go        # Path utilities
│       └── upload.go       # Upload and FFmpeg integration
└── frontend/               # Vue 3 application (to be copied from Electron version)
```

## Database

The application uses SQLite with the same schema as the Electron version:

- **Storage:** `~/.mybooru/data.db`
- **Media files:** `~/.mybooru/media/{hash[:2]}/{hash}.{ext}`
- **Thumbnails:** `~/.mybooru/cache/thumbnails/300/{hash[:2]}/{hash}.jpg`
- **WAL mode** enabled for concurrent access

## Development

```bash
# Install Go dependencies
go mod tidy

# Install frontend dependencies
cd frontend && npm install && cd ..

# Run in development mode (this will auto-generate TypeScript bindings)
wails dev

# Build for production
wails build
```

## API Reference

The Go backend exposes methods to the frontend via Wails bindings. TypeScript bindings are auto-generated in `frontend/wailsjs/`.

### Media Operations
- `GetAllMedia(page, limit int)` - Get paginated media
- `GetMediaByID(id int64)` - Get single media item
- `SearchMedia(query)` - Complex search with filters
- `ToggleFavorite(id int64)` - Toggle favorite status
- `DeleteMedia(id int64)` - Delete media item

### Tag Operations
- `GetTagsForMedia(mediaID int64)` - Get all tags for media
- `AddTagsToMedia(mediaID int64, tagNames []string)` - Add tags
- `RemoveTagFromMedia(mediaID, tagID int64)` - Remove tag
- `SearchTags(pattern string, limit int)` - Search tags

## Migration Notes

### Changes from Electron
1. IPC replaced with Wails bindings
2. Result<T,E> pattern → idiomatic Go (value, error)
3. better-sqlite3 → mattn/go-sqlite3
4. Node child_process → Go os/exec for FFmpeg

### Database Compatibility
You can use the same `~/.mybooru/data.db` from the Electron version - schemas are 100% compatible.

## Status

### ✅ Completed
- Backend database layer fully ported to Go
- Vue 3 frontend copied from Electron version
- Basic API calls updated to use Wails bindings
- Build configuration ready

### 🔨 TODO
- [ ] Test the app with `wails dev`
- [ ] Implement search query parser (TypeScript → Go)
- [ ] Implement file upload UI
- [ ] Add upload progress tracking
- [ ] Add keyboard navigation
- [ ] Implement tab system
- [ ] Port remaining Electron API calls as needed
