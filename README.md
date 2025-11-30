# MyBooru

A personal image gallery built with Electron, Vue 3, TypeScript, and Tailwind CSS, powered by Bun.

## Tech Stack

- **Electron** - Desktop application framework
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Bun** - Fast all-in-one JavaScript runtime
- **Vite** - Next-generation frontend tooling

## Project Structure

```
MyBooru/
├── src/
│   ├── main/          # Electron main process
│   │   ├── main.ts    # Main entry point
│   │   └── preload.ts # Preload script for IPC
│   └── renderer/      # Vue frontend
│       ├── App.vue    # Root Vue component
│       ├── main.ts    # Vue entry point
│       └── style.css  # Global styles with Tailwind
├── public/            # Static assets
├── dist/              # Build output
└── index.html         # HTML template
```

## Getting Started

### Install dependencies

```bash
bun install
```

### Development

Run the app in development mode with hot reload:

```bash
bun run dev
```

This will start the Vite dev server and launch Electron.

### Build

Build the application for production:

```bash
bun run build
```

### Package

Create a distributable package:

```bash
# Package without installer
bun run pack

# Create installer
bun run dist
```

## Available Scripts

- `bun run dev` - Start development server and Electron app
- `bun run dev:renderer` - Start only Vite dev server
- `bun run dev:electron` - Build and start only Electron
- `bun run build` - Build both renderer and main process
- `bun run build:renderer` - Build Vue app with Vite
- `bun run build:electron` - Compile TypeScript for Electron
- `bun run pack` - Package app without creating installer
- `bun run dist` - Build and create distributable installer

## Development Notes

- The renderer process runs on `http://localhost:5173` during development
- Hot module replacement is enabled for Vue components
- DevTools are automatically opened in development mode
- Context isolation is enabled for security
