import os from 'node:os';
import { parseArgs } from 'node:util';

const numCpus = os.cpus().length;
const DEFAULT_CONCURRENCY = Math.max(1, Math.floor(numCpus / 2));

const { values } = parseArgs({
  options: {
    concurrency: {
      type: 'string',
      short: 'c',
      default: DEFAULT_CONCURRENCY.toString(),
    },
  },
  strict: true,
  allowPositionals: true,
});

let concurrency = DEFAULT_CONCURRENCY;
const concurrencyArgNumber = Number(values.concurrency);

if (!Number.isNaN(concurrencyArgNumber)) {
  if (concurrencyArgNumber > numCpus) {
    console.warn(`You set concurrency above the maximum (${numCpus})`);
    concurrency = numCpus;
  } else {
    concurrency = concurrencyArgNumber;
  }
  if (concurrency < 1) {
    concurrency = 1;
  }
}

export { concurrency };
