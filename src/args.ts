import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Command } from 'commander';
import pkgJson from '../package.json';

const numCpus = os.cpus().length;
const DEFAULT_CONCURRENCY = Math.max(1, Math.floor(numCpus / 2));
const DEFAULT_QUALITY = 80;
const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 1080;

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

      const resolvedPath = path.resolve(value);

      if (!path.isAbsolute(resolvedPath)) {
        console.warn(
          'Output path must be absolute (ex: C:\\photos\\pdfs), exiting...'
        );
        process.exit(1);
      }

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

      const parsedValue = Number.parseInt(value, 10);

      if (Number.isNaN(parsedValue)) {
        console.warn(
          `Invalid concurrency value, (must be a number) using default (${DEFAULT_CONCURRENCY})`
        );
        return DEFAULT_CONCURRENCY;
      }

      if (parsedValue > numCpus) {
        console.warn(
          `You set concurrency above the maximum (${numCpus}). The maximum will be used.`
        );
        return numCpus;
      }

      if (parsedValue < 1) {
        console.warn(
          `Concurrency must be greater than 0, using default (${DEFAULT_CONCURRENCY})`
        );
        return DEFAULT_CONCURRENCY;
      }

      return parsedValue;
    },
    DEFAULT_CONCURRENCY
  )
  .option(
    '-q, --quality <number>',
    'Quality of the compressed images [1-100].',
    (value) => {
      const parsedValue = Number.parseInt(value, 10);

      if (Number.isNaN(parsedValue)) {
        console.warn(
          `Invalid quality value, (must be a number) using default (${DEFAULT_QUALITY})`
        );
        return DEFAULT_QUALITY;
      }

      if (parsedValue <= 0) {
        console.warn(
          `Invalid quality value, (must be greater than 0) using default (${DEFAULT_QUALITY})`
        );
        return DEFAULT_QUALITY;
      }

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
    (value) => {
      const parsedValue = Number.parseInt(value, 10);

      if (Number.isNaN(parsedValue)) {
        console.warn(
          `Invalid width value, (must be a number) using default (${DEFAULT_MAX_WIDTH})`
        );
        return DEFAULT_MAX_WIDTH;
      }

      if (parsedValue <= 0) {
        console.warn(
          `Invalid width value, (must be greater than 0) using default (${DEFAULT_MAX_WIDTH})`
        );
        return DEFAULT_MAX_WIDTH;
      }

      return parsedValue;
    },
    DEFAULT_MAX_WIDTH
  )
  .option(
    '-h, --height <number>',
    'Maximum height of the images in pixels.',
    (value) => {
      const parsedValue = Number.parseInt(value, 10);

      if (Number.isNaN(parsedValue)) {
        console.warn(
          `Invalid height value, (must be a number) using default (${DEFAULT_MAX_HEIGHT})`
        );
        return DEFAULT_MAX_HEIGHT;
      }

      if (parsedValue <= 0) {
        console.warn(
          `Invalid height value, (must be greater than 0) using default (${DEFAULT_MAX_HEIGHT})`
        );
        return DEFAULT_MAX_HEIGHT;
      }

      return parsedValue;
    },
    DEFAULT_MAX_HEIGHT
  )
  .parse(process.argv);

const {
  concurrency,
  output: outputPath,
  quality,
  width: maxWidth,
  height: maxHeight,
} = program.opts<{
  output: string;
  concurrency: number;
  quality: number;
  width: number;
  height: number;
}>();

export { concurrency, maxHeight, maxWidth, outputPath, quality };
