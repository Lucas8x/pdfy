import fs from 'node:fs/promises';
import path from 'node:path';
import { enableCBZ, outputPath, password as pwArg } from './cli/args';
import { askPassword } from './cli/askPasswor';
import { selectFolder } from './cli/selectFolder';
import { processImages } from './image/processImages';
import { createCBZ } from './output/createCBZ';
import { createPDF } from './output/createPDF';
import { makeClickablePath } from './utils';
import { printOutputDetails } from './utils/printOutputDetails';

async function main() {
  const selectedFolders = await selectFolder();

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
    console.log(`📂 Selected folder: ${makeClickablePath(folderPath).ansi}`);

    const { results, totalOriginalSize } = await processImages(folderPath);

    if (!results.length) {
      console.error(
        '⚠️ No valid images found to process. PDF/CBZ creation aborted.'
      );
      return;
    }

    const outputFilename = path
      .basename(folderPath)
      .concat(enableCBZ ? '.cbz' : '.pdf');

    const finalOutputPath = path.join(outputPath, outputFilename);

    if (enableCBZ) {
      const { birthtime, mtime } = await fs.stat(folderPath);

      createCBZ(
        results,
        finalOutputPath,
        () => {
          printOutputDetails(finalOutputPath, totalOriginalSize);
        },
        { birthtime, mtime }
      );
    } else {
      createPDF(
        results,
        finalOutputPath,
        () => {
          printOutputDetails(finalOutputPath, totalOriginalSize);
        },
        userPassword
      );
    }
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
