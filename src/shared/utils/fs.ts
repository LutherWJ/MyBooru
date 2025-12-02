import { mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { Ok, Err, type Result, type FileSystemError } from '../types';

export function expandPath(path: string): string {
  if (path.startsWith('~/') || path === '~') {
    return join(homedir(), path.slice(2));
  }
  return path;
}

export function ensureDirectoryExists(dirPath: string): Result<void, FileSystemError> {
  try {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
    return Ok(undefined);
  } catch (error) {
    return Err({
      type: 'io_error',
      message: `Failed to create directory`,
      path: dirPath,
      originalError: error,
    });
  }
}

export function ensureParentDirectoryExists(filePath: string): Result<void, FileSystemError> {
  return ensureDirectoryExists(dirname(filePath));
}