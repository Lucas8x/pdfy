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

  return `${emoji} Diff: ${sign}${filesize(Math.abs(delta))} (${delta > 0 ? '+' : ''}${percent.toFixed(2)}%)`;
}
