import { Readable } from 'node:stream';
import ProgressBar from 'progress';
import type { ImageCompresed } from '../@types';
import { concurrency } from '../cli/args';
import { convertImage } from './convertImage';

export async function* processImages(
  files: string[]
): AsyncGenerator<{ index: number } & ImageCompresed> {
  const bar = new ProgressBar(
    '🔄 Processing images [:current/:total] [:bar] :percent% :rate imgs/s ETA :etas',
    {
      total: files.length,
      width: 50,
      complete: '█',
      incomplete: ' ',
    }
  );

  async function wrapperConvert([index, file]: [number, string]) {
    const [error, result] = await convertImage(file, (msg) =>
      bar.interrupt(msg)
    );

    bar.tick();
    if (error || !result) {
      return null;
    }

    return {
      index,
      ...result,
    };
  }

  const processedCount = 0;

  const source = Readable.from(files.entries()).map(wrapperConvert, {
    concurrency,
    //highWaterMark: 1,
  });

  for await (const result of source) {
    if (result) {
      yield result;
    }
  }

  if (processedCount > 0) {
    console.log(`✅ Processed: ${processedCount} of ${files.length}\n`);
  }
}
