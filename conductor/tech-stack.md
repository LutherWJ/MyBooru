# Tech Stack - MyBooru

## Backend
- **Language:** Go 1.24
- **Framework:** Wails v2 (Desktop Application Framework)
- **Database:** SQLite (via `github.com/mattn/go-sqlite3`)
- **Media Processing:** FFmpeg/FFprobe (external binaries via `os/exec`)
- **Key Libraries:**
    - `echo/v4` (for some server/routing components)
    - `lo` (utility functions)

## Frontend
- **Framework:** Vue 3 (Composition API)
- **Language:** TypeScript
- **State Management:** Pinia
- **Routing:** Vue Router 4
- **Styling:** Tailwind CSS 4
- **Build Tool:** Vite (via Wails)

## Infrastructure & Tooling
- **Build System:** Wails CLI
- **Version Control:** Git
- **Dependency Management:** Go Modules (`go.mod`), NPM (`package.json`)
