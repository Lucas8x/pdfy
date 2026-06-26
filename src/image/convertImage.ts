import fs from 'node:fs/promises';
import type sharp from 'sharp';
import type { ImageCompresed } from '../@types';
import {
  enableCBZ,
  maxHeight,
  maxWidth,
  quality,
  skipAnimatedFrame,
} from '../cli/args';
import { makeClickablePath } from '../utils';
import { getSharpInstance } from './getSharpInstance';

const COMPRESSION_THRESHOLD = 5 * 1024 * 1024; // 5MB em bytes

async function compressImage(
  img: sharp.Sharp,
  originalSize: number,
  isAnimated: boolean
) {
  if (isAnimated && enableCBZ) {
    return await img
      .webp({
        quality,
        effort: 6,
      })
      .toBuffer();
  }

  let buffer = await img
    .flatten({ background: '#ffffff' })
    .jpeg({
      quality,
      progressive: true,
      mozjpeg: true,
      optimiseCoding: true,
    })
    .toBuffer();

  let compressionCount = 1;

  while (
    compressionCount < 3 &&
    (buffer.length > originalSize || buffer.length > COMPRESSION_THRESHOLD)
  ) {
    const heavyReduction = await img
      .jpeg({
        quality: quality - 10 * compressionCount,
        progressive: true,
        mozjpeg: true,
        optimiseCoding: true,
      })
      .toBuffer();

    if (heavyReduction.length < buffer.length) {
      buffer = heavyReduction;
      compressionCount += 1;
    } else {
      break;
    }
  }

  return buffer;
}

export async function convertImage(
  file: string,
  logError: (message: string) => void
): Promise<[null, ImageCompresed] | [string, null]> {
  try {
    const image = await getSharpInstance(file);
    const metadata = await image.metadata();
    const { width, height, pages } = metadata;

    const isAnimated = (pages ?? 1) > 1;
    if (skipAnimatedFrame && isAnimated) {
      return [
        null,
        {
          buffer: null,
          width,
          height,
          originalSize: 0,
          isAnimated,
        },
      ];
    }

    if (width === undefined || height === undefined) {
      logError(
        `❌ Unable to get image dimensions ${makeClickablePath(file).ansi}`
      );
      return ['UNKNOWN_DIMENSIONS', null];
    }

    const pipeline = image.resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    });

    const originalSize = (await fs.stat(file)).size;

    const buffer = await compressImage(pipeline, originalSize, isAnimated);

    return [null, { buffer, width, height, originalSize, isAnimated }];
  } catch (error) {
    const err = error instanceof Error ? error.message : 'UNKNOWN_ERROR';

    logError(`\n❌ Error processing ${makeClickablePath(file).ansi}: ${err}`);

    return [err, null];
  }
}
