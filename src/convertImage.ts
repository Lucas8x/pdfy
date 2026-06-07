import fs from 'node:fs/promises';
import type sharp from 'sharp';
import type { ConvertImageReturns } from './@types';
import { maxHeight, maxWidth, quality } from './args';
import { getSharpInstance } from './getSharpInstance';
import { makeClickablePath } from './utils';

const COMPRESSION_THRESHOLD = 5 * 1024 * 1024; // 5MB em bytes

async function compressImage(img: sharp.Sharp, originalSize: number) {
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
    const defaultCompression = await img
      .jpeg({
        quality: quality - 10 * compressionCount,
        progressive: true,
        mozjpeg: true,
        optimiseCoding: true,
      })
      .toBuffer();

    if (defaultCompression.length < buffer.length) {
      buffer = defaultCompression;
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
): ConvertImageReturns {
  try {
    const image = await getSharpInstance(file);
    const metadata = await image.metadata();
    let { width, height } = metadata;

    if (width === undefined || height === undefined) {
      logError(
        `❌ Unable to get image dimensions ${makeClickablePath(file).ansi}`
      );
      return ['UNKNOWN_DIMENSIONS', null];
    }

    const shouldResize = width > maxWidth || height > maxHeight;

    if (shouldResize) {
      const scale = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const pipeline = image.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    const originalSize = (await fs.stat(file)).size;

    const buffer = await compressImage(pipeline, originalSize);

    return [null, { buffer, width, height, originalSize }];
  } catch (error) {
    const err = error instanceof Error ? error.message : 'UNKNOWN_ERROR';

    logError(`\n❌ Error processing ${makeClickablePath(file).ansi}: ${err}`);

    return [err, null];
  }
}
