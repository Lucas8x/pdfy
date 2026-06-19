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

  return {
    append(buffer: Buffer, width: number, height: number) {
      addImage(buffer, width, height);
    },
    async finalize(): Promise<void> {
      doc.end();
      await finished(writeStream);
    },
  };
}
