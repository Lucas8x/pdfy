import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Command } from 'commander';
import pkgJson from '../package.json';
import { parseInteger } from './utils';

const numCpus = os.cpus().length;
const DEFAULT_CONCURRENCY = Math.max(1, Math.floor(numCpus / 2));
const DEFAULT_QUALITY = 80;
const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 1080;
const SORTING_OPTIONS = ['newest', 'oldest'] as const;
type SORTING_TYPES = (typeof SORTING_OPTIONS)[number];
const DEFAULT_SORTING = SORTING_OPTIONS[0];

const program = new Command('pdfy')
  .version(pkgJson.version)
  .option(
    '-o, --output <path>',
    'Output directory of pdf',
    (value) => {
      if (value.trim() === '') {
        console.warn(
          'You provided an empty output path, current directory will be used.'
        );
        return process.cwd();
      }

      if (!path.isAbsolute(value)) {
        console.warn(
          'Output path must be absolute (ex: C:\\photos\\pdfs), exiting...'
        );
        process.exit(1);
      }

      const resolvedPath = path.normalize(value);

      try {
        const stats = fs.statSync(resolvedPath);
        if (!stats.isDirectory()) {
          console.warn('Output must be a directory, exiting...');
          process.exit(1);
        }
      } catch {
        console.warn('Output path does not exist, exiting...');
        process.exit(1);
      }

      return resolvedPath;
    },
    process.cwd()
  )
  .option(
    '-c, --concurrency <number>',
    `Number of concurrent processes to use. [1-${numCpus}, "all", "max"]`,
    (value) => {
      if (['all', 'max'].includes(value.trim())) {
        return numCpus;
      }

      const parsedValue = parseInteger(
        value,
        'concurrency',
        DEFAULT_CONCURRENCY
      );

      if (parsedValue > numCpus) {
        console.warn(
          `You set concurrency above the maximum (${numCpus}). The maximum will be used.`
        );
        return numCpus;
      }

      return parsedValue;
    },
    DEFAULT_CONCURRENCY
  )
  .option(
    '-q, --quality <number>',
    'Quality of the compressed images [1-100].',
    (value) => {
      const parsedValue = parseInteger(value, 'quality', DEFAULT_QUALITY);

      if (parsedValue > 100) {
        console.warn(
          'You set quality above the maximum (100). The maximum will be used.'
        );
        return 100;
      }

      return parsedValue;
    },
    DEFAULT_QUALITY
  )
  .option(
    '-w, --width <number>',
    'Maximum width of the images in pixels.',
    (value) => parseInteger(value, 'width', DEFAULT_MAX_WIDTH),
    DEFAULT_MAX_WIDTH
  )
  .option(
    '-h, --height <number>',
    'Maximum height of the images in pixels.',
    (value) => parseInteger(value, 'height', DEFAULT_MAX_HEIGHT),
    DEFAULT_MAX_HEIGHT
  )
  .option(
    `-s, --sort <${SORTING_OPTIONS.join('|')}>`,
    'Determines the order in which the images will be inserted into the PDF.',
    (value): SORTING_TYPES => {
      if (SORTING_OPTIONS.includes(value.toLowerCase() as SORTING_TYPES)) {
        return value.toLowerCase() as SORTING_TYPES;
      }

      console.warn(
        `Invalid sorting value, (must be ${SORTING_OPTIONS.join(' or ')}) using default: (newest)`
      );
      return DEFAULT_SORTING;
    },
    DEFAULT_SORTING
  )
  .parse(process.argv);

export const {
  concurrency,
  output: outputPath,
  quality,
  width: maxWidth,
  height: maxHeight,
  sort,
} = program.opts<{
  output: string;
  concurrency: number;
  quality: number;
  width: number;
  height: number;
  sort: SORTING_TYPES;
}>();
