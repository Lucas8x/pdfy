#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  enableCBZ,
  inputPath,
  outputPath,
  password as pwArg,
} from './cli/args';
import { askPassword } from './cli/askPasswor';
import { selectFolder } from './cli/selectFolder';
import { processImages } from './image/processImages';
import { createCBZ } from './output/createCBZ';
import { createPDF } from './output/createPDF';
import { makeClickablePath } from './utils';
import { printOutputDetails } from './utils/printOutputDetails';
import { readFolder } from './utils/readFolder';

async function processFolder(folderPath: string, userPassword: string) {
  console.log(
    `📂 Initiating process in: ${makeClickablePath(folderPath).ansi}`
  );

  const files = await readFolder(folderPath);

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
    pdf = createPDF(finalOutputPath, userPassword);
  }

  const padMax = [...files.length.toString()].length;
  let totalOriginalSize = 0;

  for await (const data of processImages(files)) {
    totalOriginalSize += data.originalSize;

    if (data.buffer) {
      if (enableCBZ) {
        const filename = `${String(data.index + 1).padStart(padMax, '0')}.jpg`;
        cbz?.append(data.buffer, filename);
      } else {
        pdf?.append(data.index, data.buffer, data.width, data.height);
      }
    }

    data.buffer = null;
  }

  await (cbz || pdf)?.finalize();

  await printOutputDetails(finalOutputPath, totalOriginalSize);
}

async function main() {
  const selectedFolders =
    inputPath === null ? await selectFolder() : [inputPath];

  if (
    !(selectedFolders && Array.isArray(selectedFolders)) ||
    selectedFolders.length === 0
  ) {
    console.warn('No folder selected.');
    return;
  }

  let userPassword = pwArg;
  if (!(pwArg || enableCBZ)) {
    userPassword = await askPassword();
  }

  for (const folderPath of selectedFolders) {
    await processFolder(folderPath, userPassword);
  }
}

main();

/* process.on('SIGINT', () => {
  console.log('Caught interrupt signal');
  if (pdfOutputPath && fs.existsSync(pdfOutputPath)) {
    fs.unlinkSync(pdfOutputPath);
  }
  process.exit();
}); */
