import os from 'node:os';

export const DEFAULT_QUALITY = 80;

export const DEFAULT_MAX_WIDTH = 1920;

export const DEFAULT_MAX_HEIGHT = 1080;

export const SORTING_OPTIONS = ['newest', 'oldest'] as const;
export type SORTING_TYPES = (typeof SORTING_OPTIONS)[number];

export const DEFAULT_SORTING = SORTING_OPTIONS[0];

export const NUM_CPUS = os.cpus().length;

export const DEFAULT_CONCURRENCY = Math.max(1, Math.floor(NUM_CPUS / 2));

export const EXTENSION_REGEX =
  /\.(jpe?g|png|webp|jfif|tiff|svg|avif|bmp|gif)$/i;

export const COMPRESSION_THRESHOLD = 5 * 1024 * 1024; // 5MB em bytes
