import fs from 'node:fs/promises';
import path from 'node:path';
import type sharp from 'sharp';
import type { ConvertImageReturns } from './@types';
import { maxHeight, maxWidth, quality } from './args';
import { getSharpInstance } from './getSharpInstance';
import { diffSize } from './utils';

const COMPRESSION_THRESHOLD = 5 * 1024 * 1024; // 5MB em bytes

async function compressImage(
  img: sharp.Sharp,
  originalSize: number,
  prefix: string
) {
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

  console.log(
    `${prefix} 🔧 Size after ${compressionCount > 1 ? `(${compressionCount}) compressions` : 'compression'} : ${diffSize(originalSize, buffer.length)}`
  );

  return buffer;
}

export async function convertImage(
  file: string,
  logPrefix: string
): ConvertImageReturns {
  try {
    const image = await getSharpInstance(file);
    const metadata = await image.metadata();
    let { width, height } = metadata;

    if (width === undefined || height === undefined) {
      console.error(`${logPrefix} ❌ Unable to get image dimensions ${file}`);
      return [{ error: 'UNKNOWN_DIMENSIONS', file }, null];
    }

    console.log(
      `${logPrefix} 📷 Processing: ${path.basename(file)} (${width}x${height})`
    );

    const shouldResize = width > maxWidth || height > maxHeight;

    if (shouldResize) {
      const scale = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      console.log(`${logPrefix} 🔄 Resizing to: ${width}x${height}`);
    }

    const pipeline = image.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    const originalSize = (await fs.stat(file)).size;

    const buffer = await compressImage(pipeline, originalSize, logPrefix);

    return [null, { buffer, width, height, originalSize }];
  } catch (error) {
    console.error(`${logPrefix} ❌ Error processing ${file}:`, error);
    return [
      {
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        file,
      },
      null,
    ];
  }
}
