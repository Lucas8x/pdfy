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
