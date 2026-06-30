import fs from 'node:fs';
import path from 'node:path';
import { Command, Option } from 'commander';
import pkgJson from '../../package.json';
import {
  DEFAULT_CONCURRENCY,
  DEFAULT_MAX_HEIGHT,
  DEFAULT_MAX_WIDTH,
  DEFAULT_QUALITY,
  DEFAULT_SORTING,
  NUM_CPUS,
  SORTING_OPTIONS,
  type SORTING_TYPES,
} from '../constants';
import { parseInteger } from '../utils/integerParser';
import { validatePassword } from '../utils/passwordValidator';

const program = new Command('pdfy')
  .version(pkgJson.version)
  .option(
    '-i, --input <path>',
    'Input directory that will be converted',
    (value): string => {
      if (value.trim() === '') {
        console.warn('You provided an empty input path, exiting...');
        process.exit(1);
      }

      if (!path.isAbsolute(value)) {
        console.warn(
          'Input path must be absolute (ex: C:\\myphotos), exiting...'
        );
        process.exit(1);
      }

      const resolvedPath = path.normalize(value);

      try {
        const stats = fs.statSync(resolvedPath);
        if (!stats.isDirectory()) {
          console.warn('Input must be a directory, exiting...');
          process.exit(1);
        }
      } catch {
        console.warn('Input path does not exist, exiting...');
        process.exit(1);
      }

      return resolvedPath;
    },
    null
  )
  .option(
    '-o, --output <path>',
    'Output directory of pdf',
    (value): string => {
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
    `Number of concurrent processes to use. [1-${NUM_CPUS}, "all", "max"]`,
    (value): number => {
      if (['all', 'max'].includes(value.trim())) {
        return NUM_CPUS;
      }

      const parsedValue = parseInteger(
        value,
        'concurrency',
        DEFAULT_CONCURRENCY
      );

      if (parsedValue > NUM_CPUS) {
        console.warn(
          `You set concurrency above the maximum (${NUM_CPUS}). The maximum will be used.`
        );
        return NUM_CPUS;
      }

      return parsedValue;
    },
    DEFAULT_CONCURRENCY
  )
  .option(
    '-q, --quality <number>',
    'Quality of the compressed images [1-100].',
    (value): number => {
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
    (value): number => parseInteger(value, 'width', DEFAULT_MAX_WIDTH),
    DEFAULT_MAX_WIDTH
  )
  .option(
    '-h, --height <number>',
    'Maximum height of the images in pixels.',
    (value): number => parseInteger(value, 'height', DEFAULT_MAX_HEIGHT),
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
  .option(
    '--pw, --password <string>',
    'Protect file with password.',
    (value): string => {
      const [error, isValid] = validatePassword(value);
      if (!isValid) {
        console.warn(error);
        process.exit(1);
      }
      return value;
    }
  )
  .addOption(
    new Option('--cbz', 'Create CBZ file instead of PDF.').conflicts([
      'pw',
      'password',
    ])
  )
  .addOption(
    new Option(
      '--skip-animated-frame',
      'Do not insert first frame of animated images on PDF/CBZ'
    )
      .default(false)
      .conflicts(['includeAnimated'])
  )
  .option(
    '--include-animated',
    'Also process animated images, this will drastically increase processing time. Only CBZ support animated images.',
    false
  )
  .parse(process.argv);

export const {
  input: inputPath,
  output: outputPath,
  concurrency,
  quality,
  width: maxWidth,
  height: maxHeight,
  sort,
  password,
  cbz: enableCBZ,
  skipAnimatedFrame,
  includeAnimated,
} = program.opts<{
  input: string | null;
  output: string;
  concurrency: number;
  quality: number;
  width: number;
  height: number;
  sort: SORTING_TYPES;
  password: string;
  cbz: boolean;
  skipAnimatedFrame: boolean;
  includeAnimated: boolean;
}>();

export const cbzAnimationSupport =
  enableCBZ && includeAnimated && !skipAnimatedFrame;

if (!enableCBZ && includeAnimated) {
  console.warn('--include-animated need to be used with the --cbz');
  process.exit(1);
}
