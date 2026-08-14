import fs from 'node:fs/promises';
import type { CreateCbzMetadataArgs } from '../@types';

export async function getOriginFolderStats(
  folderPath: string
): Promise<Omit<CreateCbzMetadataArgs, 'imagesLength'>> {
  const stats = await fs.stat(folderPath);

  return {
    birthtime: stats.birthtime,
    mtime: stats.mtime,
  };
}
