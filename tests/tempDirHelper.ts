import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export function tmpDirHelper() {
  const tempDirectories: string[] = [];

  return {
    tempDirectories,
    createTmpDir() {
      const directory = mkdtempSync(path.join(tmpdir(), 'pdfy-test-'));
      tempDirectories.push(directory);
      return directory;
    },
    deleteTmpDirs() {
      for (const directory of tempDirectories.splice(0)) {
        rmSync(directory, { recursive: true, force: true });
      }
    },
  };
}
