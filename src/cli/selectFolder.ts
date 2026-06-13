import fs from 'node:fs';
import path from 'node:path';
import prompts, { type PromptObject } from 'prompts';

const cwd = process.cwd();

export async function selectFolder(): Promise<string[]> {
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
