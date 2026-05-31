import fs from 'node:fs';
import path from 'node:path';
import prompts, { type PromptObject } from 'prompts';
import { createPDF } from './createPDF';
import { makeClickablePath } from './utils';

const cwd = process.cwd();

async function selectFolder() {
  const folders = fs
    .readdirSync(cwd)
    .filter((file) => fs.statSync(file).isDirectory());

  const prompt: PromptObject = {
    type: 'select',
    name: 'folder',
    message: 'Select a folder:',
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
  const folderPath = await selectFolder();

  if (!folderPath) {
    console.log('No folder selected.');
    return;
  }

  console.log(`📂 Selected folder: ${makeClickablePath(folderPath).ansi}`);

  const outputName = path.basename(folderPath).concat('.pdf');
  const outputPdf = path.join(cwd, outputName);

  await createPDF(folderPath, outputPdf).catch(console.error);
}

main();

/* process.on('SIGINT', () => {
  console.log('Caught interrupt signal');
  if (pdfOutputPath && fs.existsSync(pdfOutputPath)) {
    fs.unlinkSync(pdfOutputPath);
  }
  process.exit();
}); */
