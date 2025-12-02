import { join } from 'node:path';
import { expandPath } from './fs';

const APP_DATA_DIR = expandPath('~/.mybooru');

export function getAppDataDir(): string {
  return APP_DATA_DIR;
}

export function getMediaDir(): string {
  return join(APP_DATA_DIR, 'media');
}

export function getDatabasePath(): string {
  return join(APP_DATA_DIR, 'data.db');
}

export function getCacheDir(): string {
  return join(APP_DATA_DIR, 'cache');
}

export function getLogsDir(): string {
  return join(APP_DATA_DIR, 'logs');
}

export function getMediaFilePath(hash: string, extension: string): string {
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  const subdir = hash.slice(0, 2);
  return join(getMediaDir(), subdir, `${hash}${ext}`);
}

export function getThumbnailPath(hash: string, size: string = 'medium'): string {
  const subdir = hash.slice(0, 2);
  return join(getCacheDir(), 'thumbnails', size, subdir, `${hash}.jpg`);
}

export function getFfprobePath(): string {
  if (process.env.NODE_ENV === 'production') {
    const executable = process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
    return join(process.resourcesPath, 'binaries', executable);
  }
  const executable = process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
  // Use __dirname to get project root reliably (go up from src/shared/utils)
  return join(__dirname, '..', '..', '..', 'binaries', executable);
}

export function getFfmpegPath(): string {
  if (process.env.NODE_ENV === 'production') {
    const executable = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
    return join(process.resourcesPath, 'binaries', executable);
  }
  const executable = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  return join(__dirname, '..', '..', '..', 'binaries', executable);
}
