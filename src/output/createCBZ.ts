import fs from 'node:fs';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import archiver, { type ArchiverOptions } from 'archiver';
import type { CreateCbzMetadataArgs } from '../@types';
import { createComicInfo } from '../utils/createComicInfo';

archiver.registerFormat('zip-encrypted', require('archiver-zip-encrypted'));

export function createCBZ(
  outputFilePath: string,
  metadata?: CreateCbzMetadataArgs,
  password?: string
) {
  const archive = archiver.create(password ? 'zip-encrypted' : 'zip', {
    zlib: { level: 0 },
    encryptionMethod: 'aes256', // aes256 | zip20
    password,
  } as ArchiverOptions);

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
    append(stream: Buffer | Readable, name: string): Promise<void> {
      if (Buffer.isBuffer(stream)) {
        archive.append(stream, { name });
        return Promise.resolve();
      }

      return new Promise<void>((resolve, reject) => {
        const rs = stream;
        const onEnd = () => {
          cleanup();
          resolve();
        };
        const onClose = () => {
          cleanup();
          resolve();
        };
        const onError = (err: Error) => {
          cleanup();
          reject(err);
        };
        function cleanup() {
          rs.removeListener('end', onEnd);
          rs.removeListener('close', onClose);
          rs.removeListener('error', onError);
        }

        try {
          archive.append(rs, { name });
        } catch (err) {
          cleanup();
          return reject(err as Error);
        }

        rs.on('end', onEnd);
        rs.on('close', onClose);
        rs.on('error', onError);
      });
    },
    copy(filePath: string, name: string) {
      archive.file(filePath, { name });
    },
    async finalize() {
      await archive.finalize();
      await finished(writeStream);
    },
  };
}
