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
  | [string, null]
>;
