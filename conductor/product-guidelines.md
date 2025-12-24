# Product Guidelines - MyBooru

## Design Philosophy
MyBooru prioritizes efficiency and control, catering to power users who manage large collections. The interface is designed to be high-performance and information-rich, blending the density of traditional booru boards with modern desktop responsiveness.

### Visual & UX Principles
- **Information Density:** Maximize screen real estate for media and metadata. UI elements should be compact and functional, allowing users to see tag details, resolutions, and file info at a glance.
- **Keyboard-First Workflow:** The application is built to be fully navigable via keyboard. Common actions (navigating the grid, opening media, tagging, searching) must have dedicated, intuitive shortcuts to enable rapid workflows without context switching to the mouse.
- **Responsiveness:** Interactions should be instantaneous. The UI must remain fluid even when loading or filtering grids containing thousands of items.

## Privacy & Data Sovereignty
- **Local-Only Persistence:** All user data, including the media library, thumbnails, and SQLite database, resides strictly on the user's local machine.
- **No Telemetry:** The application operates in a completely offline-capable mode. No usage data, errors, or metadata are transmitted to external servers.
- **Explicit Export Only:** Data egress occurs solely upon explicit user action (e.g., exporting a file or backup). The system never initiates external connections for data transfer autonomously.

## Engineering Standards
- **Performance & Flexibility:** The architecture is designed to scale. Backend operations (Go) and frontend rendering (Vue/Wails) are optimized to handle large datasets with minimal overhead. Components should be single-purpose unless coupling offers a proven performance benefit.
- **Robust Error Handling:** Failures—whether from filesystem permissions, corrupt files, or FFmpeg subprocesses—must be caught, logged, and surfaced to the user with clear, actionable messages. Silent failures are unacceptable.
- **Strict Typing:** Development enforces strict type safety across the stack (Go structs in backend, TypeScript interfaces in frontend) to ensure reliability and facilitate refactoring.
