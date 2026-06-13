import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import type { ProcessResults } from '../@types';
import { getAdjustedSizes } from '../utils/getAdjustedSizes';

export function createPDF(
  images: ProcessResults[],
  outputFilePath: string,
  onFinish: () => void,
  userPassword?: string
) {
  const doc = new PDFDocument({
    autoFirstPage: false,
    pdfVersion: '1.5',
    margin: 0,
    userPassword,
    info: {
      Title: path.basename(outputFilePath),
    },
  });

  const writeStream = fs.createWriteStream(outputFilePath).on('finish', () => {
    onFinish?.();
  });

  doc.pipe(writeStream);

  for (const { buffer, width, height } of images) {
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

  doc.end();
}
