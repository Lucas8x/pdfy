export type ConvertImageReturns = Promise<
  | [
      null,
      {
        buffer: Buffer;
        width: number;
        height: number;
        originalSize: number;
      },
    ]
  | [{ error: string; file: string }, null]
>;
