export const DEFAULT_PAGINATION_LIMIT = 25;

 /**
 * Common image file extensions
 */
export const IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.tiff',
  '.tif',
  '.ico',
  '.svg',
  '.heic',
  '.heif',
  '.avif',
  '.jfif',
  '.pjpeg',
  '.pjp',
] as const;

/**
 * Common video file extensions
 */
export const VIDEO_EXTENSIONS = [
  '.mp4',
  '.webm',
  '.mkv',
  '.mov',
  '.avi',
  '.wmv',
  '.flv',
  '.m4v',
  '.mpg',
  '.mpeg',
  '.3gp',
  '.ogv',
  '.ts',
  '.m2ts',
  '.mts',
  '.vob',
  '.gifv',
] as const;

/**
 * Common audio file extensions
 */
export const AUDIO_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.ogg',
  '.m4a',
  '.flac',
  '.aac',
  '.wma',
  '.opus',
  '.oga',
  '.webm', // can be audio-only
  '.mid',
  '.midi',
  '.ape',
  '.wv',
  '.tta',
] as const;
