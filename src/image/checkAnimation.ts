import fs from 'node:fs/promises';
import path from 'node:path';

const HEADER_SIZE = {
  '.gif': 32 * 1024,
  '.webp': 256,
  '.png': 1024,
} as const;

type ImageExtension = keyof typeof HEADER_SIZE;

async function readHeader(
  filePath: string,
  ext: ImageExtension
): Promise<Buffer> {
  let file: fs.FileHandle | undefined;

  try {
    file = await fs.open(filePath, 'r');

    const headerSize = HEADER_SIZE[ext];
    const buffer = Buffer.allocUnsafe(headerSize);
    const { bytesRead } = await file.read(buffer, 0, headerSize, 0);

    return buffer.subarray(0, bytesRead);
  } finally {
    await file?.close();
  }
}

export async function checkAnimation(filePath: string): Promise<boolean> {
  try {
    const ext = path.extname(filePath).toLowerCase();

    if (!Object.keys(HEADER_SIZE).includes(ext)) {
      return false;
    }

    const buffer = await readHeader(filePath, ext as ImageExtension);

    switch (ext) {
      case '.gif': {
        let imageCount = 0;

        for (const byte of buffer) {
          if (byte === 0x2c) {
            imageCount += 1;

            if (imageCount > 1) {
              return true;
            }
          }
        }

        return false;
      }

      case '.webp':
        return buffer.includes(Buffer.from('ANIM'));

      case '.png':
        return buffer.includes(Buffer.from('acTL'));

      default:
        return false;
    }
  } catch {
    return false;
  }
}
