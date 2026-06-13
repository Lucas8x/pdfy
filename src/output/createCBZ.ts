import fs from 'node:fs';
import path from 'node:path';
import { ZipArchive } from 'archiver';
import type { CreateCbzMetadaArgs, ProcessResults } from '../@types';
import { createComicInfo } from '../utils/createComicInfo';

export function createCBZ(
  images: ProcessResults[],
  outputFilePath: string,
  onFinish: () => void,
  metadata?: CreateCbzMetadaArgs
) {
  const archive = new ZipArchive({
    zlib: { level: 0 },
  });

  const writeStream = fs.createWriteStream(outputFilePath).on('finish', () => {
    onFinish();
  });

  archive.pipe(writeStream);

  const padMax = [...images.length.toString()].length;

  for (const { buffer, index } of images) {
    archive.append(buffer, {
      name: `${String(index + 1).padStart(padMax, '0')}.jpg`,
    });
  }

  if (metadata) {
    const title = path.basename(outputFilePath).split('.')[0];
    const xml = createComicInfo({
      title,
      pageCount: images.length,
      summary: [
        `Title: ${title}`,
        `Pages: ${images.length}`,
        `Original creation date: ${metadata.birthtime.toLocaleString()}`,
        `Original last modified: ${metadata.mtime.toLocaleString()}`,
        `Created on: ${new Date().toLocaleString()}`,
      ].join('\n'),
      year: metadata.birthtime.getFullYear(),
      month: metadata.birthtime.getMonth() + 1,
    });

    archive.append(Buffer.from(xml, 'utf8'), {
      name: 'ComicInfo.xml',
    });
  }

  archive.finalize();
}
