import type { Readable } from 'node:stream';

export type ImageCompressed =
  | {
      type: 'buffer';
      buffer: Buffer;
      width: number;
      height: number;
      extension: string;
    }
  | {
      type: 'copy';
      buffer: null;
      width: number;
      height: number;
      extension: string;
    }
  | {
      type: 'stream';
      stream: Readable;
      width: number;
      height: number;
      extension: string;
    };

export type ProcessedFile = {
  index: number;
  path: string;
} & ImageCompressed;

// =====================================

export type CreateCbzMetadataArgs = {
  birthtime: Date;
  imagesLength: number;
  mtime: Date;
};

export type CbzMetadata = {
  title: string;
  pageCount: number;
  summary: string;
  year: number;
  month: number;
};

export type File = {
  path: string;
  size: number;
};

export type OutputWriter = {
  write: (image: ProcessedFile) => void | Promise<void>;
  finalize: () => void | Promise<void>;
};
