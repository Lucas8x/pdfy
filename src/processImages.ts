import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import pLimit from 'p-limit';
import { convertImage } from './convertImage';

const CONCURRENCY_LIMIT = Math.max(2, os.cpus().length / 2);
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

  const limit = pLimit(CONCURRENCY_LIMIT);

  let totalOriginalSize = 0;
  const failedItems: string[] = [];

  const conversionPromises = files.map((file, index) =>
    limit(async () => {
      const [error, result] = await convertImage(
        file,
        `[${(index + 1).toString().padStart(files.length.toString().length, '0')}/${files.length}]`
      );

      if (error) {
        failedItems.push(error.file);
        return null;
      }

      const { buffer, width, height, originalSize } = result;
      totalOriginalSize += originalSize;

      return { index, buffer, width, height };
    })
  );

  const results = (await Promise.all(conversionPromises))
    .filter((r) => r !== null)
    .sort((a, b) => a.index - b.index);

  console.log(`✅ Processed: ${results.length} of ${files.length}\n`);

  return { results, totalOriginalSize };
}
