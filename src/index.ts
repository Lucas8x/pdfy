#!/usr/bin/env node
import { processFolder } from './app/processFolder';
import { enableCBZ, inputPath, password as pwArg } from './cli/args';
import { askPassword } from './cli/askPasswor';
import { selectFolder } from './cli/selectFolder';

async function main() {
  const selectedFolders =
    inputPath === null ? await selectFolder() : [inputPath];

  if (selectedFolders.length === 0) {
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
