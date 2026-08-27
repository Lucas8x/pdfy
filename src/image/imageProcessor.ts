import path from 'node:path';
import type { Sharp } from 'sharp';
import type { File, ImageCompressed } from '../@types';
import { COMPRESSION_THRESHOLD } from '../constants';
import { makeClickablePath } from '../utils';
import type { FfmpegProcessor } from './ffmpegProcessor';
import { getSharpInstance } from './getSharpInstance';

export type ImageProcessorArgs = {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  skipAnimatedFrame: boolean;
  copyAnimated: boolean;
  cbzAnimationSupport: boolean;
  ffmpegProcessor: FfmpegProcessor;
};

export class ImageProcessor {
  private readonly quality: number;
  private readonly maxWidth: number;
  private readonly maxHeight: number;
  private readonly skipAnimatedFrame: boolean;
  private readonly copyAnimated: boolean;
  private readonly cbzAnimationSupport: boolean;
  private readonly ffmpegProcessor: FfmpegProcessor;

  constructor(args: ImageProcessorArgs) {
    this.quality = args.quality;
    this.maxWidth = args.maxWidth;
    this.maxHeight = args.maxHeight;
    this.skipAnimatedFrame = args.skipAnimatedFrame;
    this.copyAnimated = args.copyAnimated;
    this.cbzAnimationSupport = args.cbzAnimationSupport;
    this.ffmpegProcessor = args.ffmpegProcessor;
  }

  private async compressImage(args: {
    image: Sharp;
    isAnimated: boolean;
    originalSize: number;
  }) {
    const { image, isAnimated, originalSize } = args;

    if (isAnimated && this.cbzAnimationSupport) {
      return await image
        .webp({
          quality: this.quality,
          effort: 6,
        })
        .toBuffer();
    }

    let buffer = await image
      .flatten({ background: '#ffffff' })
      .jpeg({
        quality: this.quality,
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
      const heavyReduction = await image
        .jpeg({
          quality: this.quality - 10 * compressionCount,
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

  async run(
    file: File
  ): Promise<[null, ImageCompressed | null] | [string, null]> {
    try {
      const image = await getSharpInstance(file.path, this.cbzAnimationSupport);
      const metadata = await image.metadata();
      const { width, height, pages } = metadata;

      const isAnimated = (pages ?? 1) > 1;

      if (this.skipAnimatedFrame && isAnimated) {
        return [null, null];
      }

      if (this.cbzAnimationSupport && isAnimated) {
        if (this.copyAnimated) {
          return [
            null,
            {
              type: 'copy',
              buffer: null,
              width,
              height,
              extension: path.extname(file.path),
            },
          ];
        }

        if (this.ffmpegProcessor.getIsAvailable()) {
          const streamCompression = await this.ffmpegProcessor.run(file);
          if (streamCompression) {
            return [null, streamCompression];
          }
        }
      }

      const extension =
        isAnimated && this.cbzAnimationSupport ? '.webp' : '.jpeg';

      if (width === undefined || height === undefined) {
        return [
          `❌ Unable to get image dimensions ${makeClickablePath(file.path).ansi}`,
          null,
        ];
      }

      const imgResized = image.resize({
        width: this.maxWidth,
        height: this.maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      });

      const buffer = await this.compressImage({
        image: imgResized,
        originalSize: file.size,
        isAnimated,
      });

      return [null, { type: 'buffer', buffer, width, height, extension }];
    } catch (error) {
      const err = error instanceof Error ? error.message : 'UNKNOWN_ERROR';

      return [
        `\n❌ Error processing ${makeClickablePath(file.path).ansi}: ${err}`,
        null,
      ];
    }
  }
}
