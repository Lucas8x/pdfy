import fs from 'node:fs';
import path from 'node:path';
import { finished } from 'node:stream/promises';
import PDFDocument from 'pdfkit';
import { getAdjustedSizes } from '../utils/getAdjustedSizes';

export function createPDF(outputFilePath: string, userPassword?: string) {
  const doc = new PDFDocument({
    autoFirstPage: false,
    bufferPages: false,
    pdfVersion: '1.5',
    margin: 0,
    userPassword,
    info: {
      Title: path.basename(outputFilePath),
    },
  });

  const writeStream = fs.createWriteStream(outputFilePath);

  doc.pipe(writeStream);

  const queue = new Map<
    number,
    {
      buffer: Buffer | null;
      width: number;
      height: number;
    }
  >();

  function addImage(buffer: Buffer, width: number, height: number) {
    const { pageWidth, pageHeight } = getAdjustedSizes(width, height);

    doc.addPage({
      size: [pageWidth, pageHeight],
      margin: 0,
    });

    doc.image(buffer, 0, 0, {
      width: pageWidth,
      height: pageHeight,
    });
  }

  function addMissing() {
    for (const [index, data] of Array.from(queue).sort((a, b) => a[0] - b[0])) {
      if (data.buffer) {
        addImage(data.buffer, data.width, data.height);
      }

      queue.delete(index);
      data.buffer = null;
    }
  }

  return {
    append(index: number, buffer: Buffer, width: number, height: number) {
      queue.set(index, {
        buffer,
        width,
        height,
      });
    },
    async finalize(): Promise<void> {
      addMissing();
      doc.end();
      await finished(writeStream);
    },
  };
}
