import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import type { File } from '../@types';
import {
  ANIMATED_EXTENSIONS,
  type SORTING_TYPES,
  STATIC_IMAGE_EXTENSIONS,
  SUPPORTED_EXTENSIONS,
} from '../constants';

export async function scanSupportedFiles(inputFolder: string) {
  const files = await readdir(inputFolder, { withFileTypes: true });

  let unsupportedCount = 0;
  const unsupportedFormats = new Set<string>();
  const extensionCounts = new Map<string, number>();
  let staticImages = 0;
  let animatedImages = 0;

  const filteredFiles = files
    .filter((dirent) => dirent.isFile())
    .filter((file) => {
      const ext = path.extname(file.name).toLowerCase();
      const support = SUPPORTED_EXTENSIONS.has(ext);
      if (!support) {
        unsupportedCount += 1;
        unsupportedFormats.add(ext);
        return false;
      }

      extensionCounts.set(ext, (extensionCounts.get(ext) ?? 0) + 1);

      if (STATIC_IMAGE_EXTENSIONS.has(ext)) {
        staticImages += 1;
      }
      if (ANIMATED_EXTENSIONS.has(ext)) {
        animatedImages += 1;
      }

      return true;
    });

  return {
    filteredFiles,
    extensionCounts,
    staticImages,
    animatedImages,
    unsupportedCount,
    unsupportedFormats,
  };
}

export async function readFolder(
  inputFolder: string,
  sort: SORTING_TYPES = 'newest'
): Promise<File[]> {
  try {
    const { filteredFiles, unsupportedCount, unsupportedFormats } =
      await scanSupportedFiles(inputFolder);

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
        `⚠️ ${unsupportedCount} file(s) ignored due to unsupported format: ${Array.from(unsupportedFormats).join('|')}`
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
