import fs from 'node:fs';
import { filesize } from 'filesize';
import PDFDocument from 'pdfkit';
import { processImages } from './processImages';
import { diffSize, getAdjustedSizes, makeClickablePath } from './utils';

export async function createPDF(
  inputFolder: string,
  outputPdf: string,
  userPassword?: string
) {
  const { results, totalOriginalSize } = await processImages(inputFolder);

  if (!results.length) {
    console.error('⚠️ No valid images found to process. PDF creation aborted.');
    return;
  }

  const doc = new PDFDocument({
    autoFirstPage: false,
    pdfVersion: '1.5',
    margin: 0,
    userPassword,
  });

  const writeStream = fs.createWriteStream(outputPdf);
  doc.pipe(writeStream);

  for (const { buffer, width, height } of results) {
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

  writeStream.on('finish', () => {
    const finalPdfSize = fs.statSync(outputPdf).size;
    console.log(
      `📁 PDF saved as: ${makeClickablePath(outputPdf).ansi}\n` +
        `📊 Original total size: ${filesize(totalOriginalSize)}\n` +
        `📊 Final PDF size: ${filesize(finalPdfSize)}\n` +
        diffSize(totalOriginalSize, finalPdfSize)
    );
  });
}
