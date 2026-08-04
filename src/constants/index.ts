import os from 'node:os';

export const DEFAULT_QUALITY = 80;

export const DEFAULT_MAX_WIDTH = 1920;

export const DEFAULT_MAX_HEIGHT = 1080;

export const SORTING_OPTIONS = ['newest', 'oldest'] as const;
export type SORTING_TYPES = (typeof SORTING_OPTIONS)[number];

export const DEFAULT_SORTING = SORTING_OPTIONS.at(0);

export const NUM_CPUS = os.cpus().length;

export const DEFAULT_CONCURRENCY = Math.max(1, Math.floor(NUM_CPUS / 2));

export const STATIC_IMAGE_EXTENSIONS = new Set([
  '.avif',
  '.bmp',
  '.jfif',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg',
  '.tiff',
  '.webp',
]);

export const ANIMATED_EXTENSIONS = new Set(['.apng', '.avif', '.gif', '.webp']);

export const SUPPORTED_EXTENSIONS =
  STATIC_IMAGE_EXTENSIONS.union(ANIMATED_EXTENSIONS);

export const COMPRESSION_THRESHOLD = 5 * 1024 * 1024; // 5MB em bytes

export const IGNORE_DIRECTORIES = new Set([
  '.git',
  '.svn',
  '.vscode',
  '.zed',
  '.idea',
  'node_modules',
]);
