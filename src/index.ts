import fs from 'node:fs';
import path from 'node:path';
import prompts, { type PromptObject } from 'prompts';
import { createPDF } from './createPDF';

const cwd = process.cwd();

async function selectFolder() {
  const folders = fs
    .readdirSync(cwd)
    .filter((file) => fs.statSync(file).isDirectory());

  const prompt: PromptObject = {
    type: 'select',
    name: 'folder',
    message: 'Selecione uma pasta:',
    choices: [
      {
        title: 'Pasta Atual',
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
    console.log('Nenhuma pasta selecionada.');
    return;
  }

  console.log(`📂 Pasta selecionada: ${folderPath}`);

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
