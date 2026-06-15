export type ImageCompresed = {
  buffer: Buffer | null;
  width: number;
  height: number;
  originalSize: number;
};

export type CreateCbzMetadaArgs = {
  imagesLength: number;
  birthtime: Date;
  mtime: Date;
};

export type CbzMetadata = {
  title: string;
  pageCount: number;
  summary: string;
  year: number;
  month: number;
};
