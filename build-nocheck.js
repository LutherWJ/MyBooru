#!/usr/bin/env node
// Temporary build script that skips type checking
// Just copies the TypeScript files to dist for development

import { cpSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create dist directory
mkdirSync(join(__dirname, 'dist/main'), { recursive: true });

// Copy source files (Electron will use ts-node or we can use tsc with noEmitOnError: false)
console.log('Copying source files for development...');
console.log('Note: This bypasses type checking for quick testing');
console.log('Run `bun run build:electron` to see type errors\n');

// For now, let's just run tsc with noEmitOnError false
import { execSync } from 'child_process';

try {
  execSync(
    'tsc src/main/main.ts src/main/preload.ts --outDir dist/main --module CommonJS --moduleResolution node --target ES2020 --skipLibCheck --esModuleInterop --noEmitOnError false',
    { stdio: 'inherit' }
  );
  console.log('\nBuild completed (with errors ignored)');
} catch (error) {
  console.log('\nBuild completed (with errors ignored)');
}
