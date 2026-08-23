import path from 'node:path';
import {
  DEFAULT_CONCURRENCY,
  DEFAULT_SORTING,
  type SORTING_TYPES,
} from '../constants';
import type { ImageProcessor } from '../image/imageProcessor';
import { createOutputWriter } from '../output/outputWriter';
import { makeClickablePath } from '../utils';
import { getOriginFolderStats } from '../utils/getOriginFolderStats';
import { printOutputDetails } from '../utils/printOutputDetails';
import { readFolder } from '../utils/readFolder';
import { processImages } from './processImages';

export async function processFolder(
  inputFolderPath: string,
  outputFolderPath: string,
  {
    enableCBZ = false,
    password,
    sort = DEFAULT_SORTING,
    concurrency = DEFAULT_CONCURRENCY,
  }: {
    password?: string;
    enableCBZ?: boolean;
    sort?: SORTING_TYPES;
    concurrency?: number;
  },
  imageProcessor: ImageProcessor
) {
  console.log(
    `📂 Initiating process in: ${makeClickablePath(inputFolderPath).ansi}`
  );

  const files = await readFolder(inputFolderPath, sort);

  if (!files.length) {
    console.error(
      `⚠️ No valid images found in [${path.basename(inputFolderPath)}]. PDF/CBZ creation aborted.`
    );
    return;
  }

  const outputFilename = path
    .basename(inputFolderPath)
    .concat(enableCBZ ? '.cbz' : '.pdf');

  const outputFilePath = path.join(outputFolderPath, outputFilename);

  const outputWriter = createOutputWriter({
    outputFilePath,
    enableCBZ,
    padMax: enableCBZ ? [...files.length.toString()].length : 0,
    metadata: enableCBZ
      ? {
          imagesLength: files.length,
          ...(await getOriginFolderStats(inputFolderPath)),
        }
      : undefined,
    password,
  });

  for await (const file of processImages(files, imageProcessor, concurrency)) {
    outputWriter.write(file);
    file.buffer = null;
  }

  await outputWriter.finalize();

  await printOutputDetails(
    outputFilePath,
    files.reduce((total, file) => total + file.size, 0)
  );
}
