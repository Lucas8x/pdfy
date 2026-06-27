import { Readable } from 'node:stream';
import type { ImageCompresed } from '../@types';
import { concurrency } from '../cli/args';
import ProgressBar from '../utils/lib/node-progress';
import { convertImage } from './convertImage';

type ProcessImagesReturn = AsyncGenerator<{ index: number } & ImageCompresed>;

export async function* processImages(files: string[]): ProcessImagesReturn {
  const bar = new ProgressBar(
    '🔄 Processing images [:current/:total] [:bar] :percent% | :rate imgs/s | ETA :veta',
    {
      total: files.length,
      width: 50,
      complete: '■',
      incomplete: ' ',
    }
  );

  async function wrapperConvert([index, file]: [number, string]) {
    const [error, result] = await convertImage(file, (msg) =>
      bar.interrupt(msg)
    );

    bar.tick();
    if (error || !result) {
      return false;
    }

    return {
      index,
      ...result,
    };
  }

  let errorCount = 0;

  const source = Readable.from(files.entries()).map(wrapperConvert, {
    concurrency,
    //highWaterMark: 1,
  });

  for await (const result of source) {
    if (!result) {
      errorCount++;
      continue;
    }
    yield result;
  }

  console.log('');
  if (errorCount > 0) {
    console.log(`⛔ Error on: ${errorCount} of ${files.length} files.`);
  }
  console.log(
    `✅ Processed: ${files.length - errorCount} of ${files.length} files.\n`
  );
}
