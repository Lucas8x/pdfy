import type { OutputWriter, ProcessedFile } from '../../@types';
import { createPDF } from '../createPDF';

export function createPdfOutputWriter(
  outputFilePath: string,
  userPassword?: string
): OutputWriter {
  const pdf = createPDF(outputFilePath, userPassword);

  return {
    async write(image: ProcessedFile) {
      if (image.type === 'copy') {
        throw new Error(
          'Animated image streams and copy assets are not supported for PDF output.'
        );
      }

      if (image.type !== 'buffer') {
        throw new Error(
          'Animated image streams and copy assets are not supported for PDF output.'
        );
      }

      pdf.append(image.buffer, image.width, image.height);
    },
    async finalize() {
      await pdf.finalize();
    },
  };
}
