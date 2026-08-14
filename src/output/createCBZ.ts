import fs from 'node:fs';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { ZipArchive } from 'archiver';
import type { CreateCbzMetadataArgs } from '../@types';
import { createComicInfo } from '../utils/createComicInfo';

export function createCBZ(
  outputFilePath: string,
  metadata?: CreateCbzMetadataArgs
) {
  const archive = new ZipArchive({
    zlib: { level: 0 },
  });

  const writeStream = fs.createWriteStream(outputFilePath);

  archive.pipe(writeStream);

  if (metadata) {
    const [title] = path.basename(outputFilePath).split('.');
    const xml = createComicInfo({
      title,
      pageCount: metadata.imagesLength,
      summary: [
        `Title: ${title}`,
        `Pages: ${metadata.imagesLength}`,
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

  return {
    append(stream: Buffer | Readable, name: string) {
      archive.append(stream, { name });
    },
    copy(filePath: string, name: string) {
      archive.file(filePath, { name });
    },
    async finalize() {
      await archive.finalize();
    },
  };
}
