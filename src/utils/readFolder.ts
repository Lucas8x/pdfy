import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { sort } from '../cli/args';

const EXTENSION_REGEX = /\.(jpe?g|png|webp|jfif|tiff|svg|avif|bmp)$/i;

export async function readFolder(inputFolder: string): Promise<string[]> {
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
          return {
            filePath,
            mtime: (await stat(filePath)).mtime,
          };
        })
      )
    ).sort((a, b) => {
      const bTime = b.mtime.getTime();
      const aTime = a.mtime.getTime();
      return sort === 'newest' ? bTime - aTime : aTime - bTime;
    });

    console.log(`🖼️ Found ${sortedFiles.length} images.`);

    if (unsupportedCount > 0) {
      console.log(
        `⚠️ ${unsupportedCount} file(s) ignored due to unsupported format: ${unsupportedFormats}`
      );
    }

    return sortedFiles.map((f) => f.filePath);
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
