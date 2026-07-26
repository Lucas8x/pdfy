import { glob } from 'node:fs/promises';
import path from 'node:path';
import { makeClickablePath } from '../utils';

export async function countExtensions(inputFolder: string) {
  const counts = new Map<string, number>();
  let padMax = 0;

  try {
    for await (const entry of glob(
      '*.{jpg,jpeg,png,webp,jfif,tiff,svg,avif,bmp,gif}',
      {
        cwd: inputFolder,
      }
    )) {
      const extension = path.extname(entry).toLowerCase();
      counts.set(extension, (counts.get(extension) ?? 0) + 1);

      if (extension.length > padMax) {
        padMax = extension.length;
      }
    }

    if (!counts.size) {
      console.log(
        `⚠️ No supported image files found in ${makeClickablePath(inputFolder).ansi} folder. `
      );
    }

    for (const [ext, count] of counts) {
      console.log(`${ext.padEnd(padMax, ' ')} = ${count} items`);
    }
  } catch (error) {
    console.error('Error while counting file extensions:', error);
  }
}
