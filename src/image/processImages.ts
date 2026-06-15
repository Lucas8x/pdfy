import pLimit from 'p-limit';
import ProgressBar from 'progress';
import type { ImageCompresed } from '../@types';
import { concurrency } from '../cli/args';
import { convertImage } from './convertImage';

export async function* processImages(files: string[]) {
  const pending = new Set<
    Promise<(ImageCompresed & { index: number }) | null>
  >();

  const bar = new ProgressBar(
    '🔄 Processing images [:current/:total] [:bar] :percent% :rate imgs/s ETA :etas',
    {
      total: files.length,
      width: 50,
      complete: '█',
      incomplete: ' ',
    }
  );

  const limit = pLimit(concurrency);

  let processedCount = 0;
  const failedItems: string[] = [];

  for (const [index, file] of files.entries()) {
    const task = limit(async () => {
      const [error, result] = await convertImage(file, (msg) =>
        bar.interrupt(msg)
      );

      bar.tick();
      processedCount += 1;

      if (error || !result) {
        failedItems.push(file);
        return null;
      }

      return { index, ...result };
    });

    pending.add(task);
    task.finally(() => pending.delete(task));
  }

  while (pending.size > 0) {
    const result = await Promise.race(pending);

    if (result) {
      yield result;
    }
  }

  if (processedCount > 0) {
    console.log(`✅ Processed: ${processedCount} of ${files.length}\n`);
  }
}

/* const results = (await Promise.all(conversionPromises))
    .filter((r) => r !== null)
    .sort((a, b) => a.index - b.index); */
