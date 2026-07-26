import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import type { File } from '../@types';
import { sort } from '../cli/args';
import { EXTENSION_REGEX } from '../constants';

export async function readFolder(inputFolder: string): Promise<File[]> {
  try {
    let unsupportedCount = 0;
    let unsupportedFormats = '';

    const files = await readdir(inputFolder, {
      withFileTypes: true,
    });

    const filteredFiles = files
      .filter((dirent) => dirent.isFile())
      .filter((file) => {
        const support = EXTENSION_REGEX.test(file.name);
        if (!support) {
          unsupportedCount += 1;
          const ext = path.extname(file.name).toLowerCase();
          if (!unsupportedFormats.includes(ext)) {
            unsupportedFormats = unsupportedFormats.concat(ext, '|');
          }
        }
        return support;
      });

    const sortedFiles = (
      await Promise.all(
        filteredFiles.map(async (file) => {
          const filePath = path.join(inputFolder, file.name);
          const { mtime, size } = await stat(filePath);
          return {
            path: filePath,
            mtime: mtime.getTime(),
            size,
          };
        })
      )
    ).sort((a, b) =>
      sort === 'newest' ? b.mtime - a.mtime : a.mtime - b.mtime
    );

    console.log(`🖼️ Found ${sortedFiles.length} images.`);

    if (unsupportedCount > 0) {
      console.log(
        `⚠️ ${unsupportedCount} file(s) ignored due to unsupported format: ${unsupportedFormats}`
      );
    }

    return sortedFiles.map(({ mtime, ...rest }) => rest);
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      switch (error.code) {
        case 'ENOENT':
          console.error('Error: Directory not found.');
          break;
        case 'EACCES':
          console.error('Error: Permission denied to access directory.');
          break;
        default:
      }
    } else {
      console.error(
        'Unexpected error:',
        error instanceof Error ? error.message : String(error)
      );
      return [];
    }
    return [];
  }
}
