import fs from 'node:fs';
import { filesize } from 'filesize';
import PDFDocument from 'pdfkit';
import { processImages } from './processImages';
import { diffSize, getAdjustedSizes, makeClickablePath } from './utils';

export async function createPDF(inputFolder: string, outputPdf: string) {
  const { results, totalOriginalSize } = await processImages(inputFolder);

  const doc = new PDFDocument({
    autoFirstPage: false,
    pdfVersion: '1.5',
    margin: 0,
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
      `📁 PDF salvo como: ${makeClickablePath(outputPdf).ansi}\n` +
        `📊 Tamanho total original: ${filesize(totalOriginalSize)}\n` +
        `📊 Tamanho final do PDF: ${filesize(finalPdfSize)}\n` +
        diffSize(totalOriginalSize, finalPdfSize)
    );
  });
}
