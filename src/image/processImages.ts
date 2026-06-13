import pLimit from 'p-limit';
import ProgressBar from 'progress';
import { concurrency } from '../cli/args';
import { readDir } from '../utils/readDir';
import { convertImage } from './convertImage';

export async function processImages(inputFolder: string) {
  const files = await readDir(inputFolder);

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

  let totalOriginalSize = 0;
  const failedItems: string[] = [];

  const conversionPromises = files.map((file, index) =>
    limit(async () => {
      const [error, result] = await convertImage(file, (msg) =>
        bar.interrupt(msg)
      );

      bar.tick();

      if (error !== null || result === null) {
        failedItems.push(file);
        return null;
      }

      totalOriginalSize += result.originalSize;
      return { index, ...result };
    })
  );

  const results = (await Promise.all(conversionPromises))
    .filter((r) => r !== null)
    .sort((a, b) => a.index - b.index);

  if (results.length > 0) {
    console.log(`✅ Processed: ${results.length} of ${files.length}\n`);
  }

  return { results, totalOriginalSize };
}
