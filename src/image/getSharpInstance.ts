import fs from 'node:fs/promises';
import { sharpFromBmp } from '@huh-david/bmp-js/sharp';
import sharp, { type Sharp } from 'sharp';

sharp.cache(false);

export async function getSharpInstance(
  filePath: string,
  cbzAnimationSupport: boolean
): Promise<Sharp> {
  if (filePath.endsWith('.bmp')) {
    const bmpFile = await fs.readFile(filePath);
    return sharpFromBmp(bmpFile);
  }

  return sharp(filePath, {
    pages: cbzAnimationSupport ? -1 : 1,
    animated: cbzAnimationSupport,
  });
}
