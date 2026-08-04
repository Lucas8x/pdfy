import fs from 'node:fs';
import path from 'node:path';
import prompts, { type Choice } from 'prompts';
import { IGNORE_DIRECTORIES } from '../constants';
import { scanSupportedFiles } from '../utils/readFolder';

const cwd = process.cwd();

export async function selectFolder(): Promise<string[]> {
  const folders = fs
    .readdirSync(cwd, {
      withFileTypes: true,
    })
    .filter((dirent) => dirent.isDirectory())
    .filter((dirent) => !IGNORE_DIRECTORIES.has(dirent.name));

  const cwdDetails = await scanSupportedFiles(cwd);
  const cwdHasImages =
    cwdDetails.staticImages > 0 || cwdDetails.animatedImages > 0;

  const choices: Choice[] = [
    {
      title: 'Current Folder',
      value: cwd,
      description: cwdHasImages
        ? `${cwdDetails.staticImages} static images | ${cwdDetails.animatedImages} animated images.`
        : '',
      selected: cwdHasImages,
      disabled: !cwdHasImages,
    },
  ];

  for (const dirent of folders) {
    const fullPath = path.join(cwd, dirent.name);
    const { staticImages, animatedImages } = await scanSupportedFiles(fullPath);
    const hasImages = staticImages > 0 || animatedImages > 0;

    choices.push({
      title: dirent.name,
      description: hasImages
        ? `${staticImages} static images | ${animatedImages} animated images.`
        : '',
      value: fullPath,
      disabled: !hasImages,
    });
  }

  choices.sort((a, b) => {
    if (a.disabled && !b.disabled) {
      return 1;
    }
    if (!a.disabled && b.disabled) {
      return -1;
    }
    return 0;
  });

  const result = await prompts({
    type: 'multiselect',
    name: 'folder',
    message: 'Select a folder:',
    hint: 'Space to toggle select. Enter to submit. "a" to select all',
    instructions: false,
    choices,
  });

  return result.folder;
}
