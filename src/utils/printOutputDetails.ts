import fs from 'node:fs/promises';
import path from 'node:path';
import { filesize } from 'filesize';
import { makeClickablePath } from '.';
import { diffSize } from './filesizeIndicator';

export async function printOutputDetails(
  filePath: string,
  totalOriginalSize: number
) {
  const finalFileSize = (await fs.stat(filePath)).size;

  const ext = path.extname(filePath).slice(1).toUpperCase();

  console.log(
    [
      `📁 ${ext} saved as: ${makeClickablePath(filePath).ansi}`,
      `📊 Original total size: ${filesize(totalOriginalSize)}`,
      `📊 Final ${ext} size: ${filesize(finalFileSize)}`,
      diffSize(totalOriginalSize, finalFileSize),
    ].join('\n')
  );
}
