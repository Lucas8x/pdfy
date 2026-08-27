import type { Readable } from 'node:stream';

export function waitStreamEnd(stream: Readable): Promise<void> {
  return new Promise((resolve, reject) => {
    let finished = false;

    const onEnd = () => {
      cleanup();
      finished = true;
      resolve();
    };

    const onClose = () => {
      cleanup();
      if (!finished) {
        resolve();
      }
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    function cleanup() {
      stream.removeListener('end', onEnd);
      stream.removeListener('close', onClose);
      stream.removeListener('error', onError);
    }

    stream.on('end', onEnd);
    stream.on('close', onClose);
    stream.on('error', onError);
  });
}
