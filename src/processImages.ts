import fs from 'node:fs';
import path from 'node:path';
import pLimit from 'p-limit';
import ProgressBar from 'progress';
import { concurrency } from './args';
import { convertImage } from './convertImage';

const EXTENSION_REGEX = /\.(jpe?g|png|webp|jfif|tiff|svg|avif|bmp)$/i;

export async function processImages(inputFolder: string) {
  let unsupportedCount = 0;
  let unsupportedFormats = '';

  const files = fs
    .readdirSync(inputFolder)
    .filter((fileName) => {
      const support = EXTENSION_REGEX.test(fileName);
      if (!support) {
        unsupportedCount += 1;
        const ext = path.extname(fileName).toLowerCase();
        if (!unsupportedFormats.includes(ext)) {
          unsupportedFormats = unsupportedFormats.concat(ext, '|');
        }
      }
      return support;
    })
    .map((fileName) => path.join(inputFolder, fileName));

  console.log(`🖼️ Found ${files.length} images. Starting conversion...`);

  if (unsupportedCount > 0) {
    console.log(
      `⚠️ ${unsupportedCount} file(s) ignored due to unsupported format: ${unsupportedFormats}`
    );
  }

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

  console.log(`✅ Processed: ${results.length} of ${files.length}\n`);

  return { results, totalOriginalSize };
}
