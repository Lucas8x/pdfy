import type {
  CreateCbzMetadataArgs,
  OutputWriter,
  ProcessedFile,
} from '../../@types';
import { createCBZ } from '../createCBZ';

export function createCbzOutputWriter(
  outputFilePath: string,
  padMax: number,
  metadata?: CreateCbzMetadataArgs
): OutputWriter {
  const cbz = createCBZ(outputFilePath, metadata);

  return {
    write(image: ProcessedFile) {
      const filename = String(image.index + 1)
        .padStart(padMax, '0')
        .concat(
          image.extension.startsWith('.')
            ? image.extension
            : `.${image.extension}`
        );

      if (image.type === 'copy') {
        cbz.copy(image.path, filename);
        return;
      }

      cbz.append(image.buffer, filename);
    },
    async finalize() {
      await cbz.finalize();
    },
  };
}
