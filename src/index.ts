import fs from 'node:fs';
import path from 'node:path';
import prompts, { type PromptObject } from 'prompts';
import { outputPath, password as pwArg } from './args';
import { createPDF } from './createPDF';
import { makeClickablePath, validatePassword } from './utils';

const cwd = process.cwd();

async function selectFolder(): Promise<string[]> {
  const folders = fs
    .readdirSync(cwd)
    .filter((file) => fs.statSync(file).isDirectory());

  const prompt: PromptObject = {
    type: 'multiselect',
    name: 'folder',
    message: 'Select a folder:',
    hint: 'Space to toggle select. Enter to submit. "a" to select all',
    instructions: false,
    choices: [
      {
        title: 'Current Folder',
        value: cwd,
        description: cwd,
        selected: true,
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

async function askPassword() {
  let password = '';

  const result = await prompts([
    {
      type: 'confirm',
      name: 'requestPassword',
      message: 'Do you want to password-protect?',
    },
    {
      type: (prev) => (prev ? 'password' : null),
      name: 'password',
      message: 'Write a password',
      validate: (value) => {
        const [error, isValid] = validatePassword(value);
        if (!isValid) {
          return error;
        }
        password = value;
        return true;
      },
    },
    {
      type: (prev) => (prev ? 'password' : null),
      name: 'passwordConfirm',
      message: 'Confirm the password',
      validate: (value) => {
        const [error, isValid] = validatePassword(value);
        if (!isValid) {
          return error;
        }
        if (value !== password) {
          return 'Password does not match the previous one.';
        }
        return true;
      },
    },
  ]);

  if (!result.requestPassword || result.password !== result.passwordConfirm) {
    return null;
  }
  return result.password;
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

  let userPassword = pwArg;
  if (!pwArg) {
    userPassword = await askPassword();
  }

  for (const folderPath of selectedFolders) {
    console.log(`📂 Selected folder: ${makeClickablePath(folderPath).ansi}`);

    const outputName = path.basename(folderPath).concat('.pdf');
    const outputPdf = path.join(outputPath, outputName);

    await createPDF(folderPath, outputPdf, userPassword).catch(console.error);
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
