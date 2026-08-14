import type { CreateCbzMetadataArgs, OutputWriter } from '../@types';
import { createCbzOutputWriter } from './adapters/cbzOutputWriter';
import { createPdfOutputWriter } from './adapters/pdfOutputWriter';

type CreateOutputWriterArgs = {
  outputFilePath: string;
  enableCBZ: boolean;
  padMax: number;
  metadata?: CreateCbzMetadataArgs;
  password?: string;
};

export function createOutputWriter({
  outputFilePath,
  enableCBZ,
  padMax,
  metadata,
  password,
}: CreateOutputWriterArgs): OutputWriter {
  return enableCBZ
    ? createCbzOutputWriter(outputFilePath, padMax, metadata)
    : createPdfOutputWriter(outputFilePath, password);
}
