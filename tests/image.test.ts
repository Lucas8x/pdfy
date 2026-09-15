import { afterAll, describe, expect, test } from 'bun:test';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { checkAnimation } from '../src/image/checkAnimation';
import { FfmpegProcessor } from '../src/image/ffmpegProcessor';
import { getSharpInstance } from '../src/image/getSharpInstance';
import { ImageProcessor } from '../src/image/imageProcessor';

import { tmpDirHelper } from './tempDirHelper';

const { createTmpDir, deleteTmpDirs } = tmpDirHelper();
afterAll(deleteTmpDirs);

describe('animation detection', () => {
  test('detects animated PNG and WebP signatures', async () => {
    const directory = createTmpDir();
    const pngPath = path.join(directory, 'animated.PNG');
    const webpPath = path.join(directory, 'animated.webp');

    writeFileSync(pngPath, Buffer.from('png header acTL data'));
    writeFileSync(webpPath, Buffer.from('RIFF data ANIM data'));

    expect(await checkAnimation(pngPath)).toBe(true);
    expect(await checkAnimation(webpPath)).toBe(true);
  });

  test('detects GIFs with multiple image descriptors and rejects static inputs', async () => {
    const directory = createTmpDir();
    const animatedGif = path.join(directory, 'animated.gif');
    const staticGif = path.join(directory, 'static.gif');
    const missing = path.join(directory, 'missing.png');

    writeFileSync(
      animatedGif,
      Buffer.from([0x47, 0x49, 0x46, 0x2c, 0x00, 0x2c])
    );
    writeFileSync(staticGif, Buffer.from([0x47, 0x49, 0x46, 0x2c]));

    expect(await checkAnimation(animatedGif)).toBe(true);
    expect(await checkAnimation(staticGif)).toBe(false);
    expect(await checkAnimation(missing)).toBe(false);
    expect(await checkAnimation(path.join(directory, 'photo.jpg'))).toBe(false);
  });
});

describe.todo('ffmpeg', () => {
  expect(FfmpegProcessor).toBeDefined();
});

describe.todo('sharp', () => {
  expect(getSharpInstance).toBeDefined();
});

describe.todo('image processor', () => {
  expect(ImageProcessor).toBeDefined();
});
