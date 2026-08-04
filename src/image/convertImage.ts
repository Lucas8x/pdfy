import path from 'node:path';
import type { Sharp } from 'sharp';
import type { File, ImageCompresed } from '../@types';
import {
  cbzAnimationSupport,
  copyAnimated,
  enableCBZ,
  maxHeight,
  maxWidth,
  quality,
  skipAnimatedFrame,
} from '../cli/args';
import { COMPRESSION_THRESHOLD } from '../constants';
import { makeClickablePath } from '../utils';
import { getSharpInstance } from './getSharpInstance';

async function compressImage(
  img: Sharp,
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
  file: File
): Promise<[null, ImageCompresed] | [string, null]> {
  try {
    const image = await getSharpInstance(file.path);
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
          extension: '',
        },
      ];
    }

    if (cbzAnimationSupport && isAnimated && copyAnimated) {
      return [
        null,
        {
          buffer: null,
          width,
          height,
          extension: path.extname(file.path),
          useCopyInstead: true,
        },
      ];
    }

    const extension = isAnimated && cbzAnimationSupport ? '.webp' : '.jpeg';

    if (width === undefined || height === undefined) {
      return [
        `❌ Unable to get image dimensions ${makeClickablePath(file.path).ansi}`,
        null,
      ];
    }

    const pipeline = image.resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    });

    const buffer = await compressImage(pipeline, file.size, isAnimated);

    return [null, { buffer, width, height, extension }];
  } catch (error) {
    const err = error instanceof Error ? error.message : 'UNKNOWN_ERROR';

    return [
      `\n❌ Error processing ${makeClickablePath(file.path).ansi}: ${err}`,
      null,
    ];
  }
}
