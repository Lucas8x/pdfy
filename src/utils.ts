import path from 'node:path';
import { filesize } from 'filesize';

function getIndicators(delta: number) {
  if (delta > 0) {
    return ['📈', '+'];
  }
  if (delta < 0) {
    return ['📉', '-'];
  }
  return ['⏸', ''];
}

export function diffSize(prev: number, curr: number) {
  const delta = curr - prev;
  const percent = prev ? (delta / prev) * 100 : 0;

  const [emoji, sign] = getIndicators(delta);

  return `${emoji} Diferença: ${sign}${filesize(Math.abs(delta))} (${delta > 0 ? '+' : ''}${percent.toFixed(2)}%)`;
}

const isWindows = process.platform === 'win32';
const pathRegex = /^([a-zA-Z]):/;

function toFileURL(filePath: string) {
  const resolved = path.resolve(filePath);

  const normalizedPath = isWindows
    ? resolved.replace(/\\/g, '/').replace(pathRegex, '/$1:')
    : resolved;

  return encodeURI(`file://${normalizedPath}`);
}

export function makeClickablePath(filePath: string) {
  const url = toFileURL(filePath);
  const ansiLink = `\u001b]8;;${url}\u001b\\${filePath}\u001b]8;;\u001b\\`;

  return {
    url,
    ansi: ansiLink,
  };
}

const PAGE_WIDTH = 1920;
const PAGE_HEIGHT = 1080;

export function getAdjustedSizes(imgWidth: number, imgHeight: number) {
  const aspect = imgWidth / imgHeight;

  if (aspect > 2.2) {
    return {
      pageWidth: PAGE_WIDTH,
      pageHeight: PAGE_WIDTH / aspect,
    };
  }

  const scale = PAGE_HEIGHT / imgHeight;

  return {
    pageWidth: imgWidth * scale,
    pageHeight: PAGE_HEIGHT,
  };
}
