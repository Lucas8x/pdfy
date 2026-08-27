import { Readable } from 'node:stream';
import type { File, OutputWriter } from '../@types';
import type { ImageProcessor } from '../image/imageProcessor';
import ProgressBar from '../utils/lib/node-progress';
import { waitStreamEnd } from '../utils/waitStreamEnd';

export async function processImages(
  files: File[],
  outputWrite: OutputWriter['write'],
  imageProcessor: ImageProcessor,
  concurrency = 1,
  enableCBZ = false
): Promise<void> {
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
      const [error, result] = await imageProcessor.run(file);

      if (!result) {
        errorCount += 1;
        if (error) {
          bar.interrupt(error);
        }
        return false;
      }

      if (result.type === 'stream' && enableCBZ) {
        try {
          outputWrite({
            index,
            path: file.path,
            ...result,
          });

          await waitStreamEnd(result.stream);
          bar.tick();

          return false;
        } catch (err) {
          bar.interrupt(err instanceof Error ? err.message : String(err));
          return false;
        }
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
      continue;
    }

    await outputWrite(result);
    bar.tick();

    if ('buffer' in result) {
      result.buffer = null;
    }
  }

  console.log('');
  if (errorCount > 0) {
    console.log(`⛔ Error on: ${errorCount} of ${files.length} files.`);
  }
  console.log(
    `✅ Processed: ${files.length - errorCount} of ${files.length} files.\n`
  );
}
