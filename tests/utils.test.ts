/** biome-ignore-all lint/suspicious/noEmptyBlockStatements: <explanation> */
import { afterAll, describe, expect, mock, test } from 'bun:test';
import { utimesSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { createComicInfo } from '../src/utils/createComicInfo';
import { diffSize } from '../src/utils/filesizeIndicator';
import { getAdjustedSizes } from '../src/utils/getAdjustedSizes';
import { getOriginFolderStats } from '../src/utils/getOriginFolderStats';
import { makeClickablePath } from '../src/utils/index';
import { parseInteger } from '../src/utils/integerParser';
import { validatePassword } from '../src/utils/passwordValidator';
import { printOutputDetails } from '../src/utils/printOutputDetails';
import { readFolder } from '../src/utils/readFolder';
import { waitStreamEnd } from '../src/utils/waitStreamEnd';
import { tmpDirHelper } from './tempDirHelper';

const { createTmpDir, deleteTmpDirs } = tmpDirHelper();
afterAll(deleteTmpDirs);

describe('password validation', () => {
  test('accepts valid printable passwords with the expected size limit', () => {
    expect(validatePassword('abc123')).toEqual(['', true]);
    expect(validatePassword('A_9!$%^&*()[]{}')).toEqual(['', true]);
  });

  test('rejects empty and non-printable passwords', () => {
    expect(validatePassword('')).toEqual(['Password can not be empty', false]);
    expect(validatePassword('ç')).toEqual([
      'The password contains invalid characters. (ç)',
      false,
    ]);
  });

  test('rejects passwords longer than 32 chars', () => {
    const tooLong = 'a'.repeat(33);
    expect(validatePassword(tooLong)).toEqual([
      'The password cannot be longer than 32 characters.',
      false,
    ]);
  });

  test('rejects non-string', () => {
    // @ts-expect-error-next-line
    expect(validatePassword(1234)).toEqual([
      'Password is not a string.',
      false,
    ]);
  });
});

describe('numeric parsing utilities', () => {
  test('returns the provided integer when valid and positive', () => {
    expect(parseInteger('42', 'quality', 80)).toBe(42);
    expect(parseInteger('1', 'concurrency', 4)).toBe(1);
  });

  test('falls back to the default value for invalid or non-positive inputs', () => {
    expect(parseInteger('abc', 'quality', 80)).toBe(80);
    expect(parseInteger('0', 'quality', 80)).toBe(80);
    expect(parseInteger('-5', 'quality', 80)).toBe(80);
  });
});

describe('image sizing logic', () => {
  test('keeps portrait images within the configured page height', () => {
    const adjusted = getAdjustedSizes(1200, 1600);

    expect(adjusted.pageHeight).toBe(1080);
    expect(adjusted.pageWidth).toBeCloseTo(810, 5);
  });

  test('keeps wide images within the configured page width while preserving aspect ratio', () => {
    const adjusted = getAdjustedSizes(4200, 1200);

    expect(adjusted.pageWidth).toBe(1920);
    expect(adjusted.pageHeight).toBeCloseTo(548.571_428_571_4, 5);
  });
});

describe('comic metadata XML', () => {
  test('escapes special XML characters and renders the expected structure', () => {
    const xml = createComicInfo({
      title: 'C&A "Test" <Demo>',
      year: 2024,
      month: 8,
      pageCount: 12,
      summary: 'A & B < C',
    });

    expect(xml).toContain(
      '<Title>C&amp;A &quot;Test&quot; &lt;Demo&gt;</Title>'
    );
    expect(xml).toContain('<Year>2024</Year>');
    expect(xml).toContain('<PageCount>12</PageCount>');
    expect(xml).toContain('<Summary>A &amp; B &lt; C</Summary>');
  });
});

describe('filesystem and reporting helpers', () => {
  test('returns folder creation and modification timestamps', async () => {
    const directory = createTmpDir();

    const result = await getOriginFolderStats(directory);

    expect(result.birthtime).toBeInstanceOf(Date);
    expect(result.mtime).toBeInstanceOf(Date);
  });

  test('formats increases, decreases, and unchanged sizes', () => {
    expect(diffSize(1000, 1500)).toContain('📈 Diff: +');
    expect(diffSize(1000, 500)).toContain('📉 Diff: -');
    expect(diffSize(0, 0)).toContain('⏸ Diff: 0 B (0.00%)');
  });
});

describe('path formatting helpers', () => {
  test('creates clickable file links with a file scheme and original path', () => {
    const tempDir = createTmpDir();

    const filePath = path.join(tempDir, 'page-01.jpg');
    const result = makeClickablePath(filePath);

    expect(result.url).toContain('file://');
    expect(result.url).toContain(encodeURI(path.basename(filePath)));
    expect(result.ansi).toContain(filePath);
  });
});

describe('folder scanning', () => {
  test('sorts by modification time', async () => {
    const tempDir = createTmpDir();

    const newest = path.join(tempDir, 'b.jpg');
    const oldest = path.join(tempDir, 'a.png');

    writeFileSync(newest, 'newest');
    writeFileSync(oldest, 'oldest');

    const newTime = new Date('2024-01-02T12:00:00Z');
    const oldTime = new Date('2024-01-01T12:00:00Z');
    utimesSync(newest, newTime, newTime);
    utimesSync(oldest, oldTime, oldTime);

    const files = await readFolder(tempDir, 'newest');

    expect(files.map((file) => path.basename(file.path))).toEqual([
      'b.jpg',
      'a.png',
    ]);
    expect(files.every((file) => file.size > 0)).toBe(true);
  });

  test('check supported extensions', async () => {
    const tempDir = createTmpDir();

    writeFileSync(path.join(tempDir, 'a.jpg'), 'ignore me');
    writeFileSync(path.join(tempDir, 'b.png'), 'ignore me');
    writeFileSync(path.join(tempDir, 'c.gif'), 'ignore me');
    writeFileSync(path.join(tempDir, 'd.webp'), 'ignore me');

    const files = await readFolder(tempDir);

    expect(files.map((file) => path.basename(file.path))).toContainAllValues([
      'a.jpg',
      'b.png',
      'c.gif',
      'd.webp',
    ]);
    expect(files.length).toBe(4);
    expect(files.every((file) => file.size > 0)).toBe(true);
  });

  test('ignores unsupported files', async () => {
    const tempDir = createTmpDir();

    writeFileSync(path.join(tempDir, 'notes.txt'), 'ignore me');
    writeFileSync(path.join(tempDir, 'program.exe'), 'ignore me');
    writeFileSync(path.join(tempDir, 'readme.md'), 'ignore me');

    const files = await readFolder(tempDir);
    expect(files).toEqual([]);
  });

  test('non-existent folder', async () => {
    const tempDir = createTmpDir();
    const nonExistentFolder = path.join(tempDir, 'this_folder_not_exist');
    const files = await readFolder(nonExistentFolder);
    expect(files).toEqual([]);
  });

  test.todo('no permission', async () => {
    const error = Object.assign(new Error('permission denied'), {
      code: 'EACCES',
      errno: -13,
      syscall: 'open',
      path: '/bbb',
    });

    mock.module('node:fs/promises', () => ({
      readdir: mock(() => Promise.reject(error)),
    }));

    const files = await readFolder('bbb');
    expect(files).toEqual([]);
  });

  test.todo('no error code', async () => {
    mock.module('node:fs/promises', () => ({
      readdir: mock(() => Promise.reject(new Error('no error code'))),
    }));

    const files = await readFolder('ccc');
    expect(files).toEqual([]);
  });
});

describe('stream completion', () => {
  test('resolves when a stream emit end', () => {
    const stream = new Readable({ read() {} });
    const completion = waitStreamEnd(stream);

    stream.emit('end');

    expect(completion).resolves.toBeUndefined();
  });

  test('resolves when a stream closes without emitting end', () => {
    const stream = new Readable({ read() {} });
    const completion = waitStreamEnd(stream);

    stream.emit('close');

    expect(completion).resolves.toBeUndefined();
  });

  test('rejects when a stream emits an error', () => {
    const stream = new Readable({ read() {} });
    const completion = waitStreamEnd(stream);
    const error = new Error('stream failed');

    stream.emit('error', error);

    expect(completion).rejects.toBe(error);
  });
});

describe.todo('output details message', () => {
  expect(printOutputDetails).toBeDefined();
});
