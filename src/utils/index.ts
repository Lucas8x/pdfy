import path from 'node:path';

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
