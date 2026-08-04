import { makeClickablePath } from '../utils';
import { scanSupportedFiles } from '../utils/readFolder';

export async function countExtensions(inputFolder: string) {
  try {
    const { extensionCounts } = await scanSupportedFiles(inputFolder);

    if (extensionCounts.size === 0) {
      console.log(
        `⚠️ No supported image files found in ${makeClickablePath(inputFolder).ansi} folder. `
      );
      return;
    }

    let padMax = 0;

    for (const ext of extensionCounts.keys()) {
      if (ext.length > padMax) {
        padMax = ext.length;
      }
    }

    for (const [ext, count] of extensionCounts) {
      console.log(`${ext.padEnd(padMax, ' ')} = ${count} items`);
    }
  } catch (error) {
    console.error('Error while counting file extensions:', error);
  }
}
