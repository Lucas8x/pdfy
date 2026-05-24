import fs from 'node:fs/promises';
import bmp from 'bmp-js';
import sharp from 'sharp';

sharp.cache(false);

export async function getSharpInstance(filePath: string): Promise<sharp.Sharp> {
  if (filePath.endsWith('.bmp')) {
    const bmpFile = await fs.readFile(filePath);

    const { data, width, height } = bmp.decode(bmpFile);

    for (let i = 0; i < data.length; i += 4) {
      const b = data[i];
      const r = data[i + 2];

      data[i] = r; // R
      data[i + 2] = b; // B
    }

    return sharp(data, {
      raw: { width, height, channels: 4 },
    });
  }

  return sharp(filePath);
}
