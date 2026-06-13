export type ImageCompresed = {
  buffer: Buffer;
  width: number;
  height: number;
  originalSize: number;
};

export type ProcessResults = {
  buffer: Buffer<ArrayBufferLike>;
  width: number;
  height: number;
  originalSize: number;
  index: number;
};

export type CreateCbzMetadaArgs = {
  birthtime: Date;
  mtime: Date
};

export type CbzMetadata = {
  title: string;
  pageCount: number;
  summary: string;
  year: number;
  month: number;
}
