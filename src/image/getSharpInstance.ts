import fs from 'node:fs/promises';
import { sharpFromBmp } from '@huh-david/bmp-js/sharp';
import sharp from 'sharp';
import { cbzAnimationSupport } from '../cli/args';

sharp.cache(false);

export async function getSharpInstance(filePath: string): Promise<sharp.Sharp> {
  if (filePath.endsWith('.bmp')) {
    const bmpFile = await fs.readFile(filePath);
    return sharpFromBmp(bmpFile);
  }

  return sharp(filePath, {
    pages: cbzAnimationSupport ? -1 : 1,
    animated: cbzAnimationSupport,
  });
}
