/** biome-ignore-all lint/suspicious/noEmptyBlockStatements: <explanation> */
import { afterAll, describe, expect, spyOn, test } from 'bun:test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';
import { askPassword } from '../src/cli/askPassword';
import { countExtensions } from '../src/cli/countExtensions';
import { parseArgs } from '../src/cli/parser';
import { selectFolder } from '../src/cli/selectFolder';
import { makeClickablePath } from '../src/utils';
import { tmpDirHelper } from './tempDirHelper';

const { createTmpDir, deleteTmpDirs } = tmpDirHelper();
afterAll(deleteTmpDirs);

describe('interactive password prompt', () => {
  test('password match', async () => {
    prompts.inject([true, '123456', '123456']);
    const pw = await askPassword();
    expect(pw).toBe('123456');
  });

  test('password mismatch', async () => {
    prompts.inject([true, '1234', '5678']);
    const pw = await askPassword();
    expect(pw).toBeNull();
  });

  test.todo('invalid password', async () => {
    prompts.inject([true, 'ç@!.$%&*)_=*/-+', 'ç@!.$%&*)_=*/-+']);
    const pw = await askPassword();
  });
});

describe('CLI argument parsing', () => {
  test('accepts a valid set of flags and returns normalized config values', () => {
    const tempDir = createTmpDir();
    const inputDir = path.join(tempDir, 'input');
    const outputDir = path.join(tempDir, 'output');
    mkdirSync(inputDir, { recursive: true });
    mkdirSync(outputDir, { recursive: true });

    const config = parseArgs([
      'node',
      'pdfy',
      '-i',
      inputDir,
      '-o',
      outputDir,
      '-c',
      '2',
      '-q',
      '40',
      '-s',
      'oldest',
      '--pw',
      'abc123',
      '--cbz',
    ]);

    expect(config.input).toBe(inputDir);
    expect(config.output).toBe(outputDir);
    expect(config.concurrency).toBe(2);
    expect(config.quality).toBe(40);
    expect(config.sort).toBe('oldest');
    expect(config.password).toBe('abc123');
    expect(config.cbz).toBe(true);
  });
});

describe.todo('interactive folder selection', () => {
  expect(selectFolder).toBeDefined();
});

describe('extension listing', () => {
  test('prints supported extension counts', async () => {
    const directory = createTmpDir();

    writeFileSync(path.join(directory, 'one.jpg'), '1');
    writeFileSync(path.join(directory, 'two.jpg'), '2');
    writeFileSync(path.join(directory, 'three.png'), '3');

    const log = spyOn(console, 'log').mockImplementation(() => {});

    try {
      await countExtensions(directory);

      expect(log).toHaveBeenCalledWith('.jpg = 2 items');
      expect(log).toHaveBeenCalledWith('.png = 1 items');
    } finally {
      log.mockRestore();
    }
  });

  test('print no supported files in folder', async () => {
    const directory = createTmpDir();
    writeFileSync(path.join(directory, 'one.exe'), '1');

    const log = spyOn(console, 'log').mockImplementation(() => {});

    try {
      await countExtensions(directory);
      expect(log).toHaveBeenCalledWith(
        `⚠️ No supported image files found in ${makeClickablePath(directory).ansi} folder.`
      );
    } finally {
      log.mockRestore();
    }
  });

  test.todo('catch error', async () => {
    const directory = createTmpDir();
    const log = spyOn(console, 'error').mockImplementation(() => {});

    try {
      await countExtensions(directory);
      expect(log).toHaveBeenCalledWith('');
    } finally {
      log.mockRestore();
    }
  });
});
