import { execFile } from 'node:child_process';
import { PassThrough, type Readable } from 'node:stream';
import { promisify } from 'node:util';
import ffmpeg from 'fluent-ffmpeg';
import type { File, ImageCompressed } from '../@types';
import { MAX_ANIMATION_FPS } from '../constants';
import { checkAnimation } from './checkAnimation';

const execFileAsync = promisify(execFile);

export type FfmpegProcessorArgs = {
  quality: number;
  maxWidth: number;
  maxHeight: number;
};

export class FfmpegProcessor {
  private availability: boolean | null = null;
  private readonly quality: number;
  private readonly maxWidth: number;
  private readonly maxHeight: number;

  constructor(args: FfmpegProcessorArgs) {
    this.quality = args.quality;
    this.maxWidth = args.maxWidth;
    this.maxHeight = args.maxHeight;
  }

  async checkFfmpegAvailability(): Promise<void> {
    if (this.availability) {
      return;
    }

    try {
      const [ffmpegResult, ffprobeResult] = await Promise.all([
        execFileAsync('ffmpeg', ['-version']),
        execFileAsync('ffprobe', ['-version']),
      ]);

      this.availability = !!ffmpegResult && !!ffprobeResult;
    } catch {
      this.availability = false;
    }
  }

  printStatusMessage(
    cbzAnimationSupport: boolean,
    copyAnimated: boolean
  ): void {
    if (cbzAnimationSupport && !copyAnimated) {
      console.log(
        this.availability
          ? '😊 FFmpeg is available and will be used for animation compression.'
          : '⚠️ FFmpeg is not available. Please install FFmpeg to enable beeter animation compression.'
      );
    }
  }

  getIsAvailable() {
    return this.availability;
  }

  private async compress(
    filePath: string
  ): Promise<[null, Readable] | [string, null]> {
    try {
      const fps =
        Math.min(await getFPS(filePath), MAX_ANIMATION_FPS) ||
        MAX_ANIMATION_FPS;

      const bufferStream = new PassThrough();

      ffmpeg(filePath)
        .inputOptions(['-hwaccel', 'auto'])
        .videoFilter(
          `scale=${this.maxWidth}:${this.maxHeight}:force_original_aspect_ratio=decrease`
        )
        .videoFilter(`fps=${fps}`)
        .outputOptions([
          '-quality',
          this.quality.toString(),
          '-compression_level',
          '0',
          '-lossless',
          '0',
        ])
        .toFormat('webp')
        .on('error', (err) => {
          bufferStream.destroy(err);
        })
        .pipe(bufferStream, { end: true });

      return [null, bufferStream];
    } catch (error) {
      return [error instanceof Error ? error.message : String(error), null];
    }
  }

  async run(file: File): Promise<ImageCompressed | null> {
    const isAnimated = await checkAnimation(file.path);

    if (!(this.availability && isAnimated)) {
      return null;
    }

    const [err, stream] = await this.compress(file.path);

    if (err || !stream) {
      return null;
    }

    return {
      type: 'stream',
      stream,
      width: this.maxWidth,
      height: this.maxHeight,
      extension: '.webp',
    };
  }
}

function getFPS(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return reject(err);
      }

      const stream = metadata.streams.find((s) => s.codec_type === 'video');
      if (!stream?.avg_frame_rate) {
        return reject(new Error('FPS not found.'));
      }

      const [num, den] = stream.avg_frame_rate.split('/').map(Number);
      resolve(den === 0 ? 0 : num / den);
    });
  });
}
