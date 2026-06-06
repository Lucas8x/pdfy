import fs from 'node:fs';
import path from 'node:path';
import prompts, { type PromptObject } from 'prompts';
import { outputPath } from './args';
import { createPDF } from './createPDF';
import { makeClickablePath } from './utils';

const cwd = process.cwd();

async function selectFolder(): Promise<string[]> {
  const folders = fs
    .readdirSync(cwd)
    .filter((file) => fs.statSync(file).isDirectory());

  const prompt: PromptObject = {
    type: 'multiselect',
    name: 'folder',
    message: 'Select a folder:',
    hint: 'Space to toggle select. Enter to submit',
    instructions: false,
    choices: [
      {
        title: 'Current Folder',
        value: cwd,
        description: cwd,
      },
      ...folders.map((folder) => ({
        title: folder,
        value: path.join(cwd, folder),
      })),
    ],
  };

  const result = await prompts(prompt);
  return result.folder;
}

async function main() {
  const selectedFolders = await selectFolder();

  if (
    !(selectedFolders && Array.isArray(selectedFolders)) ||
    selectedFolders.length === 0
  ) {
    console.warn('No folder selected.');
    return;
  }

  for (const folderPath of selectedFolders) {
    console.log(`📂 Selected folder: ${makeClickablePath(folderPath).ansi}`);

    const outputName = path.basename(folderPath).concat('.pdf');
    const outputPdf = path.join(outputPath, outputName);

    await createPDF(folderPath, outputPdf).catch(console.error);
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
