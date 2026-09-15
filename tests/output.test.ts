import { afterAll, describe, expect, test } from 'bun:test';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { file } from 'bun';
import { createCbzOutputWriter } from '../src/output/adapters/cbzOutputWriter';
import { createPdfOutputWriter } from '../src/output/adapters/pdfOutputWriter';
import { createCBZ } from '../src/output/createCBZ';
import { createPDF } from '../src/output/createPDF';
import { createOutputWriter } from '../src/output/outputWriter';
import { tmpDirHelper } from './tempDirHelper';

const { createTmpDir, deleteTmpDirs } = tmpDirHelper();
afterAll(deleteTmpDirs);

describe('output writers', () => {
  test('creates a PDF output and write a image', async () => {
    const directory = createTmpDir();
    const outputPath = path.join(directory, 'output.pdf');

    const writer = createOutputWriter({
      outputFilePath: outputPath,
      enableCBZ: false,
      padMax: 0,
    });

    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64'
    );

    await writer.write({
      index: 0,
      path: path.join(directory, 'source.png'),
      type: 'buffer',
      buffer: png,
      width: 1,
      height: 1,
      extension: '.jpeg',
    });

    await writer.finalize();

    expect(file(outputPath).size).toBeGreaterThan(0);
  });

  test('creates a CBZ output and write a image', async () => {
    const directory = createTmpDir();
    const outputPath = path.join(directory, 'output.cbz');

    const writer = createOutputWriter({
      outputFilePath: outputPath,
      enableCBZ: true,
      padMax: 2,
    });

    await writer.write({
      index: 0,
      path: path.join(directory, 'source.jpg'),
      type: 'buffer',
      buffer: Buffer.from('image data'),
      width: 1,
      height: 1,
      extension: 'jpg',
    });

    await writer.finalize();

    const { size } = file(outputPath);
    const zip = new AdmZip(outputPath);
    const entries = zip.getEntries();

    expect(size).toBeGreaterThan(0);
    expect(entries).toHaveLength(1);

    /* for (const { name } of entries) {
      expect(zip.getEntry(name)).not.toBeNull();
    } */
  });
});
