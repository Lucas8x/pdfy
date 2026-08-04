import { Readable } from 'node:stream';
import type { File, ImageCompresed } from '../@types';
import { concurrency } from '../cli/args';
import ProgressBar from '../utils/lib/node-progress';
import { convertImage } from './convertImage';

type ProcessImagesReturn = AsyncGenerator<
  { index: number; path: string } & ImageCompresed
>;

export async function* processImages(files: File[]): ProcessImagesReturn {
  const bar = new ProgressBar(
    '🔄 Processing images [:current/:total] [:bar] :percent% | :rate imgs/s | ETA :veta',
    {
      total: files.length,
      width: 50,
      complete: '■',
      incomplete: ' ',
    }
  );

  const source = Readable.from(files.entries()).map(
    async ([index, file]: [number, File]) => {
      const [error, result] = await convertImage(file);

      bar.tick();

      if (!result) {
        if (error) {
          bar.interrupt(error);
        }
        return false;
      }

      return {
        index,
        path: file.path,
        ...result,
      };
    },
    {
      concurrency,
      //highWaterMark: 1,
    }
  );

  let errorCount = 0;

  for await (const result of source) {
    if (!result) {
      errorCount = +1;
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
