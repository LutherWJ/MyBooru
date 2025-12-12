# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyBooru is a personal media gallery application ported from Electron to Wails. It combines a Go backend with a Vue 3 frontend, using SQLite for data storage and FFmpeg for media processing.

**Tech Stack:**
- Backend: Go 1.24, Wails v2, SQLite (mattn/go-sqlite3)
- Frontend: Vue 3 (Composition API), Pinia, Vue Router 4, Tailwind CSS 4
- Media Processing: FFmpeg/FFprobe

## Common Commands

### Development
```bash
# Run in development mode (auto-generates TypeScript bindings in frontend/wailsjs/)
wails dev

# Install/update dependencies
go mod tidy
cd frontend && npm install && cd ..

# Build production binary
wails build
```

### Frontend Only
```bash
cd frontend
npm run dev      # Vite dev server (standalone)
npm run build    # Build frontend assets
npm run preview  # Preview production build
```

### Database Location
- Database: `~/.mybooru/data.db`
- Media files: `~/.mybooru/media/{hash[:2]}/{hash}.{ext}`
- Thumbnails: `~/.mybooru/cache/thumbnails/300/{hash[:2]}/{hash}.jpg`

## Architecture

### Backend Structure (Go)

**Entry Point:** `main.go` initializes the database and creates the Wails app with the App struct bound to the frontend.

**Key Packages:**
- `internal/app/app.go` - Wails application instance; all public methods are auto-exposed to frontend via TypeScript bindings
- `internal/database/` - Database layer with SQLite operations
    - `database.go` - DB initialization, WAL mode configuration
    - `schema.go` - SQL schema (media, tags, media_tags, view_history, collections, etc.)
    - `media.go` - CRUD operations for media (GetMediaByID, CreateMedia, UpdateMedia, DeleteMedia, SearchMedia)
    - `tags.go` - Tag operations (AddTagsToMedia, RemoveTagFromMedia, SearchTags)
    - `queries.go` - Search query parser (converts tag syntax like `-tag`, `~tag` to SearchQuery struct)
- `internal/models/types.go` - All Go structs (Media, Tag, SearchQuery, etc.) that map to database schema
- `internal/fileops/` - File system operations
    - `paths.go` - Path utilities for media/thumbnail locations
    - `upload.go` - File upload and FFmpeg metadata extraction

**Wails Bindings:** Any public method on the App struct in `internal/app/app.go` is automatically exposed to the frontend. TypeScript bindings are generated in `frontend/wailsjs/go/app/App.d.ts` during `wails dev`.

### Frontend Structure (Vue 3)

**Router:** `frontend/src/router/index.ts` defines routes for Gallery, Upload, and other views.

**Stores (Pinia):**
- `tabStore.ts` - Manages tab navigation state
- `uploadStore.ts` - Upload progress and state management

**Key Views:**
- `Gallery.vue` - Main gallery view with grid of media items
- `Upload.vue` - File upload interface with tag management
- `Home.vue` - Landing/home page

**Components:**
- `TabBar.vue` - Tab navigation (CTRL+T, CTRL+W, CTRL+TAB shortcuts)
- `SearchBar.vue` - Tag-based search interface

### Database Schema

**Core Tables:**
- `media` - Media files with metadata (type, dimensions, rating, tags, favorites)
- `tags` - Tag definitions with categories (0=general, 1=metadata, 2=artist)
- `media_tags` - Many-to-many junction table
- `view_history` - Track when media was viewed
- `collections` - User-defined media collections
- `tag_aliases` - Tag alias redirects (antecedent → consequent)
- `tag_implications` - Automatic tag relationships (child implies parent)
- `search_history` - Search query history
- `saved_searches` - Named saved searches

**Tag Counts:** The `media` table denormalizes tag counts (`tag_count`, `tag_count_general`, `tag_count_metadata`, `tag_count_artist`) for performance. Update these when tags change.

### Search Query Syntax

The query parser (`internal/database/queries.go`) supports:
- `tag` - Include tag (must have)
- `-tag` - Exclude tag (must not have)
- `~tag` - Optional tag (nice to have)

Example: `cat -dog ~outdoors` finds media with "cat", without "dog", optionally with "outdoors".

### Media Processing Flow

1. File uploaded → `internal/fileops/upload.go` calculates MD5 hash
2. FFprobe extracts metadata (dimensions, duration, codec)
3. Media record created in database with metadata
4. File moved to `~/.mybooru/media/{hash[:2]}/{hash}.{ext}`
5. Thumbnail generated at `~/.mybooru/cache/thumbnails/300/{hash[:2]}/{hash}.jpg`

## Keyboard Navigation

Full keyboard navigation is a core feature (see KEYBOARD_CONTROLS.MD):

**Global:**
- CTRL+T: New tab
- CTRL+W: Close tab
- CTRL+TAB / CTRL+SHIFT+TAB: Cycle tabs
- CTRL+[0-9]: Jump to tab by index

**Gallery:**
- W/A/S/D: Navigate grid selection
- SPACEBAR: Open selected image
- Q: Focus search bar
- Z/X: Previous/next page
- H/J/K/L: Jump to edge of row/column

**Upload:**
- W/A/S/D: Navigate UI elements
- SPACEBAR: Activate element
- Q: Focus tag input

## Migration from Electron

This codebase maintains 100% database compatibility with the original Electron version:
- Same schema → can use existing `~/.mybooru/data.db`
- IPC calls replaced with Wails bindings (method calls instead of `ipcRenderer.invoke()`)
- Result<T,E> pattern replaced with Go's `(value, error)` idiom
- better-sqlite3 → mattn/go-sqlite3
- Node child_process → Go os/exec for FFmpeg

## Development Notes

- TypeScript bindings are auto-generated by Wails - do not manually edit files in `frontend/wailsjs/`
- To add a new backend API: add a public method to `internal/app/app.go`, then run `wails dev` to regenerate bindings
- SQLite uses WAL mode for concurrent reads during media processing
- Media files are content-addressed by MD5 hash to prevent duplicates
- Timestamps are stored as Unix epoch integers (seconds since 1970)