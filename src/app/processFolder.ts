import path from 'node:path';
import { enableCBZ, outputPath, sort } from '../cli/args';
import { processImages } from '../image/processImages';
import { createOutputWriter } from '../output/outputWriter';
import { makeClickablePath } from '../utils';
import { getOriginFolderStats } from '../utils/getOriginFolderStats';
import { printOutputDetails } from '../utils/printOutputDetails';
import { readFolder } from '../utils/readFolder';

export async function processFolder(folderPath: string, password?: string) {
  console.log(
    `📂 Initiating process in: ${makeClickablePath(folderPath).ansi}`
  );

  const files = await readFolder(folderPath, sort);

  if (!files.length) {
    console.error(
      `⚠️ No valid images found in [${path.basename(folderPath)}]. PDF/CBZ creation aborted.`
    );
    return;
  }

  const outputFilename = path
    .basename(folderPath)
    .concat(enableCBZ ? '.cbz' : '.pdf');

  const outputFilePath = path.join(outputPath, outputFilename);

  const outputWriter = createOutputWriter({
    outputFilePath,
    enableCBZ,
    padMax: enableCBZ ? [...files.length.toString()].length : 0,
    metadata: enableCBZ
      ? {
          imagesLength: files.length,
          ...(await getOriginFolderStats(folderPath)),
        }
      : undefined,
    password,
  });

  for await (const file of processImages(files)) {
    outputWriter.write(file);
    file.buffer = null;
  }

  await outputWriter.finalize();

  await printOutputDetails(
    outputFilePath,
    files.reduce((total, file) => total + file.size, 0)
  );
}
