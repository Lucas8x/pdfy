import type { CbzMetadata } from '../@types';

export function createComicInfo(metadata: CbzMetadata) {
  return `<?xml version="1.0" encoding="utf-8"?>
<ComicInfo>
  <Title>${escapeXml(metadata.title)}</Title>
  <Year>${metadata.year}</Year>
  <Month>${metadata.month}</Month>
  <PageCount>${metadata.pageCount}</PageCount>
  <Summary>${escapeXml(metadata.summary)}</Summary>
</ComicInfo>`;
}

function escapeXml(str: string) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
