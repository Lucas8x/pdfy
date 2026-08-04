import fs from 'node:fs/promises';
import path from 'node:path';
import { enableCBZ, outputPath, sort } from '../cli/args';
import { processImages } from '../image/processImages';
import { createCBZ } from '../output/createCBZ';
import { createPDF } from '../output/createPDF';
import { makeClickablePath } from '../utils';
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

  const finalOutputPath = path.join(outputPath, outputFilename);

  let cbz: ReturnType<typeof createCBZ> | null = null;
  let pdf: ReturnType<typeof createPDF> | null = null;

  if (enableCBZ) {
    const stats = await fs.stat(folderPath);
    cbz = createCBZ(finalOutputPath, {
      birthtime: stats.birthtime,
      mtime: stats.mtime,
      imagesLength: files.length,
    });
  } else {
    pdf = createPDF(finalOutputPath, password);
  }

  const padMax = [...files.length.toString()].length;

  for await (const file of processImages(files)) {
    const filename = String(file.index + 1)
      .padStart(padMax, '0')
      .concat(
        file.extension.startsWith('.') ? file.extension : `.${file.extension}`
      );

    if (file.buffer) {
      if (enableCBZ) {
        cbz?.append(file.buffer, filename);
      } else {
        pdf?.append(file.buffer, file.width, file.height);
      }
    }

    if (file?.useCopyInstead && enableCBZ) {
      cbz?.copy(file.path, filename);
    }

    file.buffer = null;
  }

  await (cbz || pdf)?.finalize();

  let totalOriginalSize = 0;
  for (const file of files) {
    totalOriginalSize += file.size;
  }

  await printOutputDetails(finalOutputPath, totalOriginalSize);
}
